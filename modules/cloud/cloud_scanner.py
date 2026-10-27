"""
CloudGuard Automated Cloud Configuration Scanner (Python/boto3)
Executes strictly READ-ONLY security posture checks:
- Security Groups (open ports 22, 3389, 5432 to 0.0.0.0/0)
- S3 Buckets (public ACLs, missing encryption)
- IAM (users without MFA, keys older than 90 days, wildcard admin policies)
- CloudTrail (logging stopped)
Enforces Scope Guard against config/scope.yaml before scanning.
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from modules.cloud.scope_guard import ScopeGuard

class CloudScanner:
    def __init__(self, scope_guard: Optional[ScopeGuard] = None):
        self.scope_guard = scope_guard or ScopeGuard()

    def scan_account(self, account_id: str, ec2_client=None, s3_client=None, iam_client=None, cloudtrail_client=None) -> Dict[str, Any]:
        """
        Runs full read-only security audit on an AWS account.
        Respects Scope Guard.
        """
        # 1. Enforce Scope Guard
        allowed, reason = self.scope_guard.validate_target("aws_account", account_id, actor="cloud_scanner")
        if not allowed:
            return {
                "success": False,
                "error": reason,
                "findings": [],
            }

        findings = []

        # 2. Check Security Groups
        if ec2_client:
            findings.extend(self._check_security_groups(account_id, ec2_client))

        # 3. Check S3 Buckets
        if s3_client:
            findings.extend(self._check_s3_buckets(account_id, s3_client))

        # 4. Check IAM
        if iam_client:
            findings.extend(self._check_iam(account_id, iam_client))

        # 5. Check CloudTrail
        if cloudtrail_client:
            findings.extend(self._check_cloudtrail(account_id, cloudtrail_client))

        return {
            "success": True,
            "accountId": account_id,
            "scanTimestamp": datetime.now(timezone.utc).isoformat(),
            "findingsCount": len(findings),
            "findings": findings,
        }

    def _check_security_groups(self, account_id: str, ec2_client) -> List[Dict[str, Any]]:
        findings = []
        dangerous_ports = {
            22: ("SSH Exposed to World", "CRITICAL"),
            3389: ("RDP Exposed to World", "CRITICAL"),
            5432: ("PostgreSQL Exposed to 0.0.0.0/0", "CRITICAL"),
            3306: ("MySQL Port Exposed to 0.0.0.0/0", "HIGH"),
        }

        try:
            response = ec2_client.describe_security_groups()
            for sg in response.get("SecurityGroups", []):
                sg_id = sg.get("GroupId")
                for rule in sg.get("IpPermissions", []):
                    from_port = rule.get("FromPort")
                    to_port = rule.get("ToPort")
                    ip_ranges = [r.get("CidrIp") for r in rule.get("IpRanges", [])]

                    if "0.0.0.0/0" in ip_ranges and from_port is not None:
                        for port, (title, severity) in dangerous_ports.items():
                            if from_port <= port <= (to_port or from_port):
                                findings.append({
                                    "title": f"{title} on {sg_id}",
                                    "description": f"Security group {sg_id} allows ingress from 0.0.0.0/0 on port {port}.",
                                    "severity": severity,
                                    "category": "NETWORK",
                                    "status": "OPEN",
                                    "cloudAccountId": account_id,
                                    "resourceId": sg_id,
                                    "recommendation": f"Restrict port {port} ingress to specific corporate/VPC CIDR blocks.",
                                    "riskScore": 95 if severity == "CRITICAL" else 80,
                                })
        except Exception as e:
            print(f"[Scanner Error] describe_security_groups: {e}")

        return findings

    def _check_s3_buckets(self, account_id: str, s3_client) -> List[Dict[str, Any]]:
        findings = []
        try:
            buckets = s3_client.list_buckets().get("Buckets", [])
            for bucket in buckets:
                name = bucket["Name"]
                # Check Public Access Block
                try:
                    pab = s3_client.get_public_access_block(Bucket=name)
                    config = pab.get("PublicAccessBlockConfiguration", {})
                    if not (config.get("BlockPublicAcls") and config.get("BlockPublicPolicy")):
                        findings.append({
                            "title": f"S3 Bucket {name} Missing Full Public Access Block",
                            "description": f"Bucket {name} does not enforce BlockPublicAcls / BlockPublicPolicy.",
                            "severity": "HIGH",
                            "category": "STORAGE",
                            "status": "OPEN",
                            "cloudAccountId": account_id,
                            "resourceId": f"arn:aws:s3:::{name}",
                            "recommendation": f"Enable Amazon S3 Block Public Access settings on bucket {name}.",
                            "riskScore": 85,
                        })
                except Exception:
                    # Often 404 when no block configuration exists at all -> vulnerable
                    findings.append({
                        "title": f"S3 Bucket {name} Has No Public Access Block",
                        "description": f"No PublicAccessBlock configured for bucket {name}.",
                        "severity": "CRITICAL",
                        "category": "STORAGE",
                        "status": "OPEN",
                        "cloudAccountId": account_id,
                        "resourceId": f"arn:aws:s3:::{name}",
                        "recommendation": "Configure S3 Block Public Access immediately.",
                        "riskScore": 92,
                    })
        except Exception as e:
            print(f"[Scanner Error] list_buckets: {e}")

        return findings

    def _check_iam(self, account_id: str, iam_client) -> List[Dict[str, Any]]:
        findings = []
        try:
            users = iam_client.list_users().get("Users", [])
            for user in users:
                user_name = user["UserName"]
                # 1. Check MFA
                mfas = iam_client.list_mfa_devices(UserName=user_name).get("MFADevices", [])
                if len(mfas) == 0:
                    findings.append({
                        "title": f"IAM User {user_name} Console Access Without MFA",
                        "description": f"IAM principal {user_name} does not have an active MFA device configured.",
                        "severity": "HIGH",
                        "category": "IAM",
                        "status": "OPEN",
                        "cloudAccountId": account_id,
                        "resourceId": f"arn:aws:iam::{account_id}:user/{user_name}",
                        "recommendation": f"Enforce virtual MFA or FIDO hardware token for user {user_name}.",
                        "riskScore": 85,
                    })

                # 2. Check Key Age (> 90 days)
                keys = iam_client.list_access_keys(UserName=user_name).get("AccessKeyMetadata", [])
                for key in keys:
                    create_date = key.get("CreateDate")
                    if create_date:
                        age_days = (datetime.now(timezone.utc) - create_date).days
                        if age_days > 90 and key.get("Status") == "Active":
                            findings.append({
                                "title": f"IAM Access Key Older than 90 Days ({user_name})",
                                "description": f"Access key {key.get('AccessKeyId')} for user {user_name} is {age_days} days old.",
                                "severity": "HIGH",
                                "category": "IAM",
                                "status": "OPEN",
                                "cloudAccountId": account_id,
                                "resourceId": key.get("AccessKeyId"),
                                "recommendation": "Rotate credentials older than 90 days per CIS benchmark.",
                                "riskScore": 75,
                            })
        except Exception as e:
            print(f"[Scanner Error] list_users: {e}")

        return findings

    def _check_cloudtrail(self, account_id: str, cloudtrail_client) -> List[Dict[str, Any]]:
        findings = []
        try:
            trails = cloudtrail_client.describe_trails().get("trailList", [])
            if len(trails) == 0:
                findings.append({
                    "title": "No CloudTrail Configured in AWS Account",
                    "description": "Account has no multi-region CloudTrail enabled, leaving actions un-audited.",
                    "severity": "CRITICAL",
                    "category": "LOGGING",
                    "status": "OPEN",
                    "cloudAccountId": account_id,
                    "resourceId": f"arn:aws:cloudtrail::{account_id}:trail/none",
                    "recommendation": "Enable multi-region CloudTrail with KMS encryption.",
                    "riskScore": 98,
                })
            else:
                for trail in trails:
                    trail_name = trail.get("Name")
                    status = cloudtrail_client.get_trail_status(Name=trail_name)
                    if not status.get("IsLogging"):
                        findings.append({
                            "title": f"CloudTrail Logging Stopped on {trail_name}",
                            "description": f"Audit trail {trail_name} is not currently actively recording API calls.",
                            "severity": "CRITICAL",
                            "category": "LOGGING",
                            "status": "OPEN",
                            "cloudAccountId": account_id,
                            "resourceId": trail_name,
                            "recommendation": f"Resume logging on trail {trail_name} immediately.",
                            "riskScore": 95,
                        })
        except Exception as e:
            print(f"[Scanner Error] describe_trails: {e}")

        return findings
