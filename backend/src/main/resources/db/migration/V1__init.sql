-- CloudGuard Security Operations Platform — Database Migration V1__init.sql
-- Flyway Initial Migration (PostgreSQL 16 Compatible)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- SEQUENCES FOR HUMAN-READABLE IDENTIFIERS
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS alert_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS incident_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS finding_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS iam_finding_number_seq START WITH 1 INCREMENT BY 1;

-- ==========================================
-- 1. USERS & RBAC TABLES
-- ==========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ==========================================
-- 2. CLOUD INFRASTRUCTURE TABLES
-- ==========================================

CREATE TABLE cloud_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(20) NOT NULL DEFAULT 'AWS' CHECK (provider IN ('AWS')),
    account_id VARCHAR(20) NOT NULL,
    external_id VARCHAR(100),
    role_arn VARCHAR(500),
    primary_region VARCHAR(30) NOT NULL DEFAULT 'us-east-1',
    monitored_regions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'CONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING')),
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_cloud_accounts_provider_account UNIQUE (provider, account_id)
);

CREATE INDEX idx_cloud_accounts_status ON cloud_accounts(status);
CREATE INDEX idx_cloud_accounts_provider ON cloud_accounts(provider);

CREATE TABLE cloud_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(500) NOT NULL,
    resource_name VARCHAR(300),
    region VARCHAR(30) NOT NULL,
    configuration JSONB,
    tags JSONB,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cloud_resources_account_type_id UNIQUE (cloud_account_id, resource_type, resource_id)
);

CREATE INDEX idx_cloud_resources_type ON cloud_resources(resource_type);
CREATE INDEX idx_cloud_resources_account_type ON cloud_resources(cloud_account_id, resource_type);
CREATE INDEX idx_cloud_resources_region ON cloud_resources(region);

-- ==========================================
-- 3. LOG INGESTION & EVENT PIPELINE
-- ==========================================

-- Pipeline Step 1: Raw Unprocessed Logs
CREATE TABLE raw_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL CHECK (source IN ('CLOUDTRAIL', 'CLOUDWATCH', 'VPC_FLOW_LOG')),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL UNIQUE,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ,
    processing_error TEXT
);

CREATE INDEX idx_raw_logs_processed_received ON raw_logs(processed, received_at);
CREATE INDEX idx_raw_logs_account_source ON raw_logs(cloud_account_id, source);

-- Pipeline Step 2: Normalized Parsed Security Events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_log_id UUID REFERENCES raw_logs(id) ON DELETE SET NULL,
    cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_source VARCHAR(100) NOT NULL,
    source_ip VARCHAR(45),
    user_identity VARCHAR(300),
    target_resource VARCHAR(500),
    region VARCHAR(30),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    request_parameters JSONB,
    response_elements JSONB,
    is_error BOOLEAN NOT NULL DEFAULT false,
    error_code VARCHAR(100),
    error_message TEXT,
    processed_by_engine BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_event_time ON security_events(event_time);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_account_time ON security_events(cloud_account_id, event_time);
CREATE INDEX idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX idx_security_events_user_identity ON security_events(user_identity);
CREATE INDEX idx_security_events_engine ON security_events(processed_by_engine, event_time);

-- ==========================================
-- 4. DETECTION ENGINE & RULES
-- ==========================================

-- Pipeline Step 3: Configurable Detection Rules
CREATE TABLE detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN ('THRESHOLD', 'PATTERN', 'SEQUENCE', 'ANOMALY', 'CONFIGURATION')),
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    logic_definition JSONB NOT NULL,
    trigger_description TEXT NOT NULL,
    mitre_technique_id VARCHAR(20),
    mitre_tactic VARCHAR(50),
    cooldown_minutes INTEGER NOT NULL DEFAULT 0,
    alert_count INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detection_rules_enabled_cat ON detection_rules(enabled, category);
CREATE INDEX idx_detection_rules_severity ON detection_rules(severity);
CREATE INDEX idx_detection_rules_type ON detection_rules(rule_type);

-- Structured parameters for detection rules (NO executable code)
CREATE TABLE detection_rule_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES detection_rules(id) ON DELETE CASCADE,
    param_key VARCHAR(100) NOT NULL,
    param_value VARCHAR(500) NOT NULL,
    param_type VARCHAR(20) NOT NULL DEFAULT 'STRING' CHECK (param_type IN ('INTEGER', 'STRING', 'BOOLEAN')),
    CONSTRAINT uq_rule_param_key UNIQUE (rule_id, param_key)
);

-- ==========================================
-- 5. ALERTS & ALERT WORKFLOWS
-- ==========================================

-- Pipeline Step 4: Triggered Security Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('ALT-' || lpad(nextval('alert_number_seq')::text, 6, '0')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('DETECTION_ENGINE', 'CONFIG_SCANNER', 'IAM_SCANNER', 'MANUAL')),
    detection_rule_id UUID REFERENCES detection_rules(id) ON DELETE SET NULL,
    trigger_event_id UUID REFERENCES security_events(id) ON DELETE SET NULL,
    cloud_account_id UUID REFERENCES cloud_accounts(id) ON DELETE SET NULL,
    source_ip VARCHAR(45),
    user_identity VARCHAR(300),
    target_resource VARCHAR(500),
    region VARCHAR(30),
    mitre_technique_id VARCHAR(20),
    mitre_tactic VARCHAR(50),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_cloud_account ON alerts(cloud_account_id);
CREATE INDEX idx_alerts_assigned_to ON alerts(assigned_to);
CREATE INDEX idx_alerts_detection_rule ON alerts(detection_rule_id);
CREATE INDEX idx_alerts_alert_number ON alerts(alert_number);

CREATE TABLE alert_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_comments_alert_created ON alert_comments(alert_id, created_at);

CREATE TABLE alert_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20),
    actor VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_timeline_alert_time ON alert_timeline(alert_id, event_time);

-- ==========================================
-- 6. INCIDENTS & INCIDENT WORKFLOWS
-- ==========================================

-- Pipeline Step 5: Incident Management & Escalation
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('INC-' || lpad(nextval('incident_number_seq')::text, 6, '0')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED')),
    category VARCHAR(100),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_status_severity ON incidents(status, severity);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_number ON incidents(incident_number);

CREATE TABLE incident_alerts (
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    linked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (incident_id, alert_id)
);

-- Pipeline Step 6: Incident Event Timeline
CREATE TABLE incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ALERT', 'INCIDENT_CREATED', 'NOTE', 'ACTION', 'STATUS_CHANGE', 'ASSIGNMENT')),
    description TEXT NOT NULL,
    actor VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_timeline_inc_time ON incident_timeline(incident_id, event_time);

CREATE TABLE incident_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_notes_inc_created ON incident_notes(incident_id, created_at);

-- ==========================================
-- 7. SECURITY FINDINGS (SCANNERS)
-- ==========================================

-- SecurityFinding ≠ Alert (Scanners create findings, real-time events trigger alerts)
CREATE TABLE security_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('FS-' || lpad(nextval('finding_number_seq')::text, 6, '0')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('IAM', 'NETWORK', 'STORAGE', 'COMPUTE', 'LOGGING', 'ENCRYPTION')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'REMEDIATED', 'SUPPRESSED')),
    cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    resource_id VARCHAR(500) NOT NULL,
    region VARCHAR(30),
    recommendation TEXT,
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    compliance_frameworks TEXT[],
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    remediated_at TIMESTAMPTZ,
    suppressed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_status_severity ON security_findings(status, severity);
CREATE INDEX idx_findings_category ON security_findings(category);
CREATE INDEX idx_findings_cloud_account ON security_findings(cloud_account_id);
CREATE INDEX idx_findings_risk_score ON security_findings(risk_score);

CREATE TABLE iam_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('IAM-' || lpad(nextval('iam_finding_number_seq')::text, 6, '0')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'REMEDIATED', 'SUPPRESSED')),
    cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    affected_principal VARCHAR(300) NOT NULL,
    principal_type VARCHAR(20) NOT NULL CHECK (principal_type IN ('USER', 'ROLE', 'GROUP', 'ROOT')),
    recommendation TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    remediated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_iam_findings_status_sev ON iam_findings(status, severity);
CREATE INDEX idx_iam_findings_account ON iam_findings(cloud_account_id);
CREATE INDEX idx_iam_findings_principal ON iam_findings(affected_principal);

-- ==========================================
-- 8. AUDIT LOGS & NOTIFICATIONS
-- ==========================================

-- Pipeline Step 7: Platform Audit Trail (Append-only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_display_name VARCHAR(200) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    result VARCHAR(20) NOT NULL CHECK (result IN ('SUCCESS', 'FAILURE')),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('ALERT', 'INCIDENT', 'SYSTEM')),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
