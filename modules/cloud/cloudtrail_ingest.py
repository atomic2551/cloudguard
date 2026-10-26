"""
CloudTrail Ingestion Engine for SecLab XDR
Normalizes raw AWS CloudTrail events into the standard SecLab Event model,
and maps techniques directly to MITRE ATT&CK IDs.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# MITRE ATT&CK Mapping Dictionary for CloudTrail Event Names
CLOUDTRAIL_MITRE_MAP: Dict[str, Dict[str, Any]] = {
    "AttachUserPolicy": {
        "technique_id": "T1098",
        "tactic": "Persistence",
        "severity": "CRITICAL",
        "description": "IAM AdministratorAccess or privilege escalation policy attached",
    },
    "AttachRolePolicy": {
        "technique_id": "T1098",
        "tactic": "Persistence",
        "severity": "HIGH",
        "description": "IAM Role policy attached",
    },
    "ConsoleLogin": {
        "technique_id": "T1110",
        "tactic": "Credential Access",
        "severity": "HIGH",
        "description": "Console login attempt (potential brute force if multiple failed)",
    },
    "StopLogging": {
        "technique_id": "T1562.001",
        "tactic": "Defense Evasion",
        "severity": "CRITICAL",
        "description": "CloudTrail logging disabled or trail deleted",
    },
    "DeleteTrail": {
        "technique_id": "T1562.001",
        "tactic": "Defense Evasion",
        "severity": "CRITICAL",
        "description": "CloudTrail audit trail deleted",
    },
    "AuthorizeSecurityGroupIngress": {
        "technique_id": "T1562.004",
        "tactic": "Defense Evasion",
        "severity": "HIGH",
        "description": "Security Group modified to open ports",
    },
    "PutBucketAcl": {
        "technique_id": "T1530",
        "tactic": "Collection",
        "severity": "HIGH",
        "description": "S3 bucket access permissions modified",
    },
    "PutBucketPolicy": {
        "technique_id": "T1530",
        "tactic": "Collection",
        "severity": "HIGH",
        "description": "S3 bucket policy modified",
    },
}

class CloudTrailIngestor:
    def __init__(self, source_name: str = "cloudtrail_ingest"):
        self.source_name = source_name

    def normalize_event(self, raw_record: Dict[str, Any], cloud_account_id: str = "123456789012") -> Dict[str, Any]:
        """
        Converts a raw CloudTrail record into the standard SecLab XDR Event schema:
        id, ts (UTC), source, host_id, type, severity, data, attack_ids, enrichment.
        """
        event_name = raw_record.get("eventName", "UnknownCloudTrailEvent")
        event_time_str = raw_record.get("eventTime")

        if event_time_str:
            try:
                event_ts = datetime.fromisoformat(event_time_str.replace("Z", "+00:00")).isoformat()
            except Exception:
                event_ts = datetime.now(timezone.utc).isoformat()
        else:
            event_ts = datetime.now(timezone.utc).isoformat()

        user_identity = raw_record.get("userIdentity", {})
        username = user_identity.get("userName") or user_identity.get("principalId") or "unknown"
        source_ip = raw_record.get("sourceIPAddress", "0.0.0.0")

        # Map to MITRE
        mitre_info = CLOUDTRAIL_MITRE_MAP.get(event_name)
        attack_ids = [mitre_info["technique_id"]] if mitre_info else []
        severity = mitre_info["severity"] if mitre_info else "INFO"

        # Check for error status
        is_error = "errorCode" in raw_record or "errorMessage" in raw_record

        event_payload = {
            "id": str(uuid.uuid4()),
            "ts": event_ts,
            "source": self.source_name,
            "host_id": cloud_account_id,
            "type": f"aws_cloudtrail_{event_name.lower()}",
            "severity": severity,
            "data": {
                "eventName": event_name,
                "eventSource": raw_record.get("eventSource"),
                "awsRegion": raw_record.get("awsRegion", "us-east-1"),
                "sourceIp": source_ip,
                "username": username,
                "requestParameters": raw_record.get("requestParameters", {}),
                "responseElements": raw_record.get("responseElements", {}),
                "isError": is_error,
                "errorCode": raw_record.get("errorCode"),
                "errorMessage": raw_record.get("errorMessage"),
            },
            "attack_ids": attack_ids,
            "enrichment": {
                "mitreTactic": mitre_info["tactic"] if mitre_info else None,
                "threatIntelScore": 0,
            },
        }

        return event_payload
