"""
Unit tests for SecLab XDR Cloud Module:
- ScopeGuard (boundary enforcement & refusal logging)
- CloudTrailIngestor (MITRE ATT&CK mapping & schema normalization)
- CloudScanner (boto3 read-only audit with mocked AWS clients)
"""

import unittest
from unittest.mock import MagicMock
from datetime import datetime, timezone, timedelta

from modules.cloud.scope_guard import ScopeGuard
from modules.cloud.cloudtrail_ingest import CloudTrailIngestor
from modules.cloud.cloud_scanner import CloudScanner


class TestScopeGuard(unittest.TestCase):
    def setUp(self):
        self.guard = ScopeGuard()

    def test_scope_allowed_aws_account(self):
        allowed, msg = self.guard.validate_target("aws_account", "123456789012")
        self.assertTrue(allowed)
        self.assertEqual(msg, "Target in scope")

    def test_scope_disallowed_aws_account(self):
        allowed, msg = self.guard.validate_target("aws_account", "999999999999")
        self.assertFalse(allowed)
        self.assertIn("SCOPE_VIOLATION", msg)

    def test_scope_allowed_ip(self):
        allowed, msg = self.guard.validate_target("ip", "192.168.1.50")
        self.assertTrue(allowed)
        self.assertEqual(msg, "Target in scope")

    def test_scope_disallowed_ip(self):
        allowed, msg = self.guard.validate_target("ip", "203.0.113.195")
        self.assertFalse(allowed)
        self.assertIn("SCOPE_VIOLATION", msg)


class TestCloudTrailIngestor(unittest.TestCase):
    def setUp(self):
        self.ingestor = CloudTrailIngestor()

    def test_normalize_privilege_escalation(self):
        raw_event = {
            "eventName": "AttachUserPolicy",
            "eventTime": "2026-10-26T07:00:00Z",
            "eventSource": "iam.amazonaws.com",
            "awsRegion": "us-east-1",
            "sourceIPAddress": "198.51.100.24",
            "userIdentity": {"userName": "compromised_admin"},
            "requestParameters": {
                "userName": "attacker_user",
                "policyArn": "arn:aws:iam::aws:policy/AdministratorAccess",
            },
        }

        normalized = self.ingestor.normalize_event(raw_event, "123456789012")

        self.assertEqual(normalized["severity"], "CRITICAL")
        self.assertEqual(normalized["type"], "aws_cloudtrail_attachuserpolicy")
        self.assertIn("T1098", normalized["attack_ids"])
        self.assertEqual(normalized["enrichment"]["mitreTactic"], "Persistence")
        self.assertEqual(normalized["data"]["username"], "compromised_admin")

    def test_normalize_defense_evasion(self):
        raw_event = {
            "eventName": "StopLogging",
            "eventTime": "2026-10-26T07:15:00Z",
            "eventSource": "cloudtrail.amazonaws.com",
            "sourceIPAddress": "192.0.2.1",
            "userIdentity": {"userName": "stealth_operator"},
        }

        normalized = self.ingestor.normalize_event(raw_event)
        self.assertEqual(normalized["severity"], "CRITICAL")
        self.assertIn("T1562.001", normalized["attack_ids"])
        self.assertEqual(normalized["enrichment"]["mitreTactic"], "Defense Evasion")

    def test_normalize_unknown_event(self):
        raw_event = {
            "eventName": "DescribeInstances",
            "eventTime": "2026-10-26T07:20:00Z",
            "eventSource": "ec2.amazonaws.com",
            "userIdentity": {"userName": "analyst"},
        }

        normalized = self.ingestor.normalize_event(raw_event)
        self.assertEqual(normalized["severity"], "INFO")
        self.assertEqual(len(normalized["attack_ids"]), 0)


class TestCloudScanner(unittest.TestCase):
    def setUp(self):
        self.scanner = CloudScanner()

    def test_scanner_scope_guard_refusal(self):
        result = self.scanner.scan_account("999999999999")
        self.assertFalse(result["success"])
        self.assertIn("SCOPE_VIOLATION", result["error"])
        self.assertEqual(len(result["findings"]), 0)

    def test_scanner_detects_open_security_group_ports(self):
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {
            "SecurityGroups": [
                {
                    "GroupId": "sg-test-123",
                    "IpPermissions": [
                        {
                            "FromPort": 22,
                            "ToPort": 22,
                            "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                        },
                        {
                            "FromPort": 5432,
                            "ToPort": 5432,
                            "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                        },
                    ],
                }
            ]
        }

        result = self.scanner.scan_account("123456789012", ec2_client=mock_ec2)
        self.assertTrue(result["success"])
        self.assertEqual(len(result["findings"]), 2)
        severities = [f["severity"] for f in result["findings"]]
        self.assertTrue(all(s == "CRITICAL" for s in severities))

    def test_scanner_detects_s3_vulnerabilities(self):
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            "Buckets": [{"Name": "open-data-bucket"}]
        }
        # Simulate missing public access block
        mock_s3.get_public_access_block.side_effect = Exception("NoSuchPublicAccessBlockConfiguration")

        result = self.scanner.scan_account("123456789012", s3_client=mock_s3)
        self.assertTrue(result["success"])
        self.assertEqual(len(result["findings"]), 1)
        self.assertEqual(result["findings"][0]["severity"], "CRITICAL")
        self.assertIn("open-data-bucket", result["findings"][0]["title"])

    def test_scanner_detects_iam_no_mfa_and_old_keys(self):
        mock_iam = MagicMock()
        mock_iam.list_users.return_value = {
            "Users": [{"UserName": "vulnerable_user"}]
        }
        mock_iam.list_mfa_devices.return_value = {"MFADevices": []}
        old_date = datetime.now(timezone.utc) - timedelta(days=120)
        mock_iam.list_access_keys.return_value = {
            "AccessKeyMetadata": [
                {
                    "AccessKeyId": "AKIAVULNERABLEKEY12",
                    "Status": "Active",
                    "CreateDate": old_date,
                }
            ]
        }

        result = self.scanner.scan_account("123456789012", iam_client=mock_iam)
        self.assertTrue(result["success"])
        self.assertEqual(len(result["findings"]), 2)  # 1 for MFA, 1 for key age
        self.assertTrue(all(f["category"] == "IAM" for f in result["findings"]))

    def test_scanner_detects_stopped_cloudtrail(self):
        mock_ct = MagicMock()
        mock_ct.describe_trails.return_value = {
            "trailList": [{"Name": "main-audit-trail"}]
        }
        mock_ct.get_trail_status.return_value = {"IsLogging": False}

        result = self.scanner.scan_account("123456789012", cloudtrail_client=mock_ct)
        self.assertTrue(result["success"])
        self.assertEqual(len(result["findings"]), 1)
        self.assertEqual(result["findings"][0]["severity"], "CRITICAL")
        self.assertIn("main-audit-trail", result["findings"][0]["title"])


if __name__ == "__main__":
    unittest.main()
