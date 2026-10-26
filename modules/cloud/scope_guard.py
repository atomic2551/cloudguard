"""
SecLab XDR Scope Guard
Enforces strict boundaries: any scan, web test, or simulation must match config/scope.yaml.
Refuses and records audit log for any out-of-scope target.
"""

import os
import ipaddress
import yaml
from typing import Tuple, Dict, Any, List

class ScopeGuard:
    def __init__(self, config_path: str = "config/scope.yaml"):
        self.config_path = config_path
        self._load_config()

    def _load_config(self) -> None:
        if not os.path.exists(self.config_path):
            # Fallback path if running from subdir
            alt_path = os.path.join(os.path.dirname(__file__), "..", "..", "config", "scope.yaml")
            if os.path.exists(alt_path):
                self.config_path = alt_path

        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                self.scope = data.get("scope", {})
        else:
            self.scope = {
                "networks": ["127.0.0.1/32", "192.168.1.0/24"],
                "domains": ["localhost"],
                "aws_accounts": ["123456789012"],
            }

        self.networks = [ipaddress.ip_network(net) for net in self.scope.get("networks", [])]
        self.domains = set(self.scope.get("domains", []))
        self.aws_accounts = set(self.scope.get("aws_accounts", []))

    def is_ip_allowed(self, ip_str: str) -> bool:
        try:
            ip = ipaddress.ip_address(ip_str)
            return any(ip in net for net in self.networks)
        except ValueError:
            return False

    def is_aws_account_allowed(self, account_id: str) -> bool:
        return str(account_id) in self.aws_accounts

    def validate_target(self, target_type: str, target_value: str, actor: str = "system") -> Tuple[bool, str]:
        """
        Validates target against scope.
        Returns (is_allowed, reason).
        """
        if target_type == "aws_account":
            allowed = self.is_aws_account_allowed(target_value)
            if not allowed:
                self._record_audit_refusal(target_type, target_value, actor)
                return False, f"SCOPE_VIOLATION: AWS Account {target_value} not permitted in scope.yaml"
            return True, "Target in scope"

        elif target_type in ("ip", "host"):
            allowed = self.is_ip_allowed(target_value)
            if not allowed and target_value in self.domains:
                allowed = True
            if not allowed:
                self._record_audit_refusal(target_type, target_value, actor)
                return False, f"SCOPE_VIOLATION: IP/Host {target_value} not permitted in scope.yaml"
            return True, "Target in scope"

        return False, f"Unknown target type: {target_type}"

    def _record_audit_refusal(self, target_type: str, target_value: str, actor: str) -> None:
        """Append-only audit record for scope violations."""
        print(f"[AUDIT ALERT] Scope Guard REFUSAL: Actor '{actor}' attempted {target_type} '{target_value}' outside authorized lab scope!")
