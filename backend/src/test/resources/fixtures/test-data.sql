-- Test Fixtures for CloudGuard Test Database
-- Populates isolated test data via test setup

-- 1. Roles
INSERT INTO roles (id, name, description)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Full system administrator'),
  ('a0000000-0000-0000-0000-000000000002', 'ANALYST', 'SOC security analyst'),
  ('a0000000-0000-0000-0000-000000000003', 'VIEWER', 'Read-only viewer')
ON CONFLICT (name) DO NOTHING;

-- 2. Users (bcrypt hash for "CloudGuard2026!")
INSERT INTO users (id, username, email, password_hash, display_name, department, status, mfa_enabled)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'sarah.chen', 'sarah.chen@acmecorp.io', '$2a$10$RDRrvArf6XPOW0wNW/Caq.Dx9nQ4Ro7bfgJqXQYQmy1HWPY9qM6/y', 'Sarah Chen', 'SOC Operations', 'ACTIVE', true),
  ('b0000000-0000-0000-0000-000000000002', 'alex.rivera', 'alex.rivera@acmecorp.io', '$2a$10$RDRrvArf6XPOW0wNW/Caq.Dx9nQ4Ro7bfgJqXQYQmy1HWPY9qM6/y', 'Alex Rivera', 'Security Engineering', 'ACTIVE', false),
  ('b0000000-0000-0000-0000-000000000003', 'john.doe', 'john.doe@acmecorp.io', '$2a$10$RDRrvArf6XPOW0wNW/Caq.Dx9nQ4Ro7bfgJqXQYQmy1HWPY9qM6/y', 'John Doe', 'Compliance', 'ACTIVE', false)
ON CONFLICT (username) DO NOTHING;

-- 3. User Roles
INSERT INTO user_roles (user_id, role_id)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- 4. Cloud Accounts
INSERT INTO cloud_accounts (id, name, provider, account_id, primary_region, status)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'AWS-Production', 'AWS', '123456789012', 'us-east-1', 'CONNECTED')
ON CONFLICT (provider, account_id) DO NOTHING;

-- 5. Detection Rules
INSERT INTO detection_rules (id, name, description, rule_type, category, severity, enabled, logic_definition, trigger_description)
VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'IAM Root Login Without MFA', 'Alerts when root account signs in without MFA', 'PATTERN', 'IAM', 'CRITICAL', true, '{"event": "ConsoleLogin", "mfa": false}'::jsonb, 'Root login without MFA detected')
ON CONFLICT (name) DO NOTHING;

-- 6. Alerts
INSERT INTO alerts (id, alert_number, title, description, severity, status, source, detection_rule_id, cloud_account_id)
VALUES 
  ('e0000000-0000-0000-0000-000000000001', 'ALT-000001', 'Critical AWS Root Activity', 'Root account logged in without MFA', 'CRITICAL', 'NEW', 'DETECTION_ENGINE', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000002', 'ALT-000002', 'High S3 Bucket Public Exposure', 'Bucket policy allows public read access', 'HIGH', 'INVESTIGATING', 'DETECTION_ENGINE', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (alert_number) DO NOTHING;

-- 7. Incidents
INSERT INTO incidents (id, incident_number, title, description, severity, status)
VALUES 
  ('f0000000-0000-0000-0000-000000000001', 'INC-000001', 'Potential Credential Compromise', 'Multiple critical alerts tied to IAM principal root', 'CRITICAL', 'INVESTIGATING')
ON CONFLICT (incident_number) DO NOTHING;

-- 8. Incident Alert Link
INSERT INTO incident_alerts (incident_id, alert_id)
VALUES 
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 9. Security Findings
INSERT INTO security_findings (id, finding_number, title, severity, category, status, cloud_account_id, resource_id, risk_score)
VALUES 
  ('90000000-0000-0000-0000-000000000001', 'FS-000001', 'S3 Bucket Public Access Not Blocked', 'CRITICAL', 'STORAGE', 'OPEN', 'c0000000-0000-0000-0000-000000000001', 'arn:aws:s3:::cloudguard-sec-reports', 95)
ON CONFLICT (finding_number) DO NOTHING;
