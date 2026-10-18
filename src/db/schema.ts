import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==========================================
// 1. USERS & RBAC TABLES
// ==========================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 200 }).notNull(),
    department: varchar('department', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    lastLoginIp: varchar('last_login_ip', { length: 45 }),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_username').on(table.username),
    index('idx_users_status').on(table.status),
  ]
);

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resource: varchar('resource', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    description: varchar('description', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_permissions_resource_action').on(table.resource, table.action),
  ]
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
  ]
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ]
);

// ==========================================
// 2. CLOUD INFRASTRUCTURE TABLES
// ==========================================

export const cloudAccounts = pgTable(
  'cloud_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    provider: varchar('provider', { length: 20 }).notNull().default('AWS'),
    accountId: varchar('account_id', { length: 20 }).notNull(),
    externalId: varchar('external_id', { length: 100 }),
    roleArn: varchar('role_arn', { length: 500 }),
    primaryRegion: varchar('primary_region', { length: 30 }).notNull().default('us-east-1'),
    monitoredRegions: text('monitored_regions'),
    status: varchar('status', { length: 20 }).notNull().default('CONNECTED'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    syncError: text('sync_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_cloud_accounts_provider_account').on(table.provider, table.accountId),
    index('idx_cloud_accounts_status').on(table.status),
    index('idx_cloud_accounts_provider').on(table.provider),
  ]
);

export const cloudResources = pgTable(
  'cloud_resources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cloudAccountId: uuid('cloud_account_id').notNull().references(() => cloudAccounts.id, { onDelete: 'cascade' }),
    resourceType: varchar('resource_type', { length: 50 }).notNull(),
    resourceId: varchar('resource_id', { length: 500 }).notNull(),
    resourceName: varchar('resource_name', { length: 300 }),
    region: varchar('region', { length: 30 }).notNull(),
    configuration: jsonb('configuration'),
    tags: jsonb('tags'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_cloud_resources_account_type_id').on(table.cloudAccountId, table.resourceType, table.resourceId),
    index('idx_cloud_resources_type').on(table.resourceType),
    index('idx_cloud_resources_account_type').on(table.cloudAccountId, table.resourceType),
    index('idx_cloud_resources_region').on(table.region),
  ]
);

// ==========================================
// 3. LOG INGESTION & EVENT PIPELINE
// ==========================================

export const rawLogs = pgTable(
  'raw_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cloudAccountId: uuid('cloud_account_id').notNull().references(() => cloudAccounts.id, { onDelete: 'cascade' }),
    source: varchar('source', { length: 50 }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    rawPayload: jsonb('raw_payload').notNull(),
    payloadHash: varchar('payload_hash', { length: 64 }).notNull().unique(),
    processed: boolean('processed').notNull().default(false),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    processingError: text('processing_error'),
  },
  (table) => [
    index('idx_raw_logs_processed_received').on(table.processed, table.receivedAt),
    index('idx_raw_logs_account_source').on(table.cloudAccountId, table.source),
  ]
);

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rawLogId: uuid('raw_log_id').references(() => rawLogs.id, { onDelete: 'set null' }),
    cloudAccountId: uuid('cloud_account_id').notNull().references(() => cloudAccounts.id, { onDelete: 'cascade' }),
    eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventSource: varchar('event_source', { length: 100 }).notNull(),
    sourceIp: varchar('source_ip', { length: 45 }),
    userIdentity: varchar('user_identity', { length: 300 }),
    targetResource: varchar('target_resource', { length: 500 }),
    region: varchar('region', { length: 30 }),
    severity: varchar('severity', { length: 20 }).notNull(),
    requestParameters: jsonb('request_parameters'),
    responseElements: jsonb('response_elements'),
    isError: boolean('is_error').notNull().default(false),
    errorCode: varchar('error_code', { length: 100 }),
    errorMessage: text('error_message'),
    processedByEngine: boolean('processed_by_engine').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_security_events_event_time').on(table.eventTime),
    index('idx_security_events_type').on(table.eventType),
    index('idx_security_events_severity').on(table.severity),
    index('idx_security_events_account_time').on(table.cloudAccountId, table.eventTime),
    index('idx_security_events_source_ip').on(table.sourceIp),
    index('idx_security_events_user_identity').on(table.userIdentity),
    index('idx_security_events_engine').on(table.processedByEngine, table.eventTime),
  ]
);

// ==========================================
// 4. DETECTION ENGINE & RULES
// ==========================================

export const detectionRules = pgTable(
  'detection_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull().unique(),
    description: text('description'),
    ruleType: varchar('rule_type', { length: 30 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(),
    enabled: boolean('enabled').notNull().default(true),
    logicDefinition: jsonb('logic_definition').notNull(),
    triggerDescription: text('trigger_description').notNull(),
    mitreTechniqueId: varchar('mitre_technique_id', { length: 20 }),
    mitreTactic: varchar('mitre_tactic', { length: 50 }),
    cooldownMinutes: integer('cooldown_minutes').notNull().default(0),
    alertCount: integer('alert_count').notNull().default(0),
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_detection_rules_enabled_cat').on(table.enabled, table.category),
    index('idx_detection_rules_severity').on(table.severity),
    index('idx_detection_rules_type').on(table.ruleType),
  ]
);

export const detectionRuleParameters = pgTable(
  'detection_rule_parameters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ruleId: uuid('rule_id').notNull().references(() => detectionRules.id, { onDelete: 'cascade' }),
    paramKey: varchar('param_key', { length: 100 }).notNull(),
    paramValue: varchar('param_value', { length: 500 }).notNull(),
    paramType: varchar('param_type', { length: 20 }).notNull().default('STRING'),
  },
  (table) => [
    uniqueIndex('uq_rule_param_key').on(table.ruleId, table.paramKey),
  ]
);

// ==========================================
// 5. ALERTS & ALERT WORKFLOWS
// ==========================================

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    alertNumber: varchar('alert_number', { length: 20 }).notNull().unique().default(sql`('ALT-' || lpad(nextval('alert_number_seq')::text, 6, '0'))`),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    severity: varchar('severity', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('NEW'),
    source: varchar('source', { length: 50 }).notNull(),
    detectionRuleId: uuid('detection_rule_id').references(() => detectionRules.id, { onDelete: 'set null' }),
    triggerEventId: uuid('trigger_event_id').references(() => securityEvents.id, { onDelete: 'set null' }),
    cloudAccountId: uuid('cloud_account_id').references(() => cloudAccounts.id, { onDelete: 'set null' }),
    sourceIp: varchar('source_ip', { length: 45 }),
    userIdentity: varchar('user_identity', { length: 300 }),
    targetResource: varchar('target_resource', { length: 500 }),
    region: varchar('region', { length: 30 }),
    mitreTechniqueId: varchar('mitre_technique_id', { length: 20 }),
    mitreTactic: varchar('mitre_tactic', { length: 50 }),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_alerts_status_severity').on(table.status, table.severity),
    index('idx_alerts_severity').on(table.severity),
    index('idx_alerts_created_at').on(table.createdAt),
    index('idx_alerts_cloud_account').on(table.cloudAccountId),
    index('idx_alerts_assigned_to').on(table.assignedTo),
    index('idx_alerts_detection_rule').on(table.detectionRuleId),
    index('idx_alerts_alert_number').on(table.alertNumber),
  ]
);

export const alertComments = pgTable(
  'alert_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_alert_comments_alert_created').on(table.alertId, table.createdAt),
  ]
);

export const alertTimeline = pgTable(
  'alert_timeline',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
    eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    description: text('description').notNull(),
    severity: varchar('severity', { length: 20 }),
    actor: varchar('actor', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_alert_timeline_alert_time').on(table.alertId, table.eventTime),
  ]
);

// ==========================================
// 6. INCIDENTS & INCIDENT WORKFLOWS
// ==========================================

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    incidentNumber: varchar('incident_number', { length: 20 }).notNull().unique().default(sql`('INC-' || lpad(nextval('incident_number_seq')::text, 6, '0'))`),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    severity: varchar('severity', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('OPEN'),
    category: varchar('category', { length: 100 }),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_incidents_status_severity').on(table.status, table.severity),
    index('idx_incidents_assigned_to').on(table.assignedTo),
    index('idx_incidents_created_at').on(table.createdAt),
    index('idx_incidents_number').on(table.incidentNumber),
  ]
);

export const incidentAlerts = pgTable(
  'incident_alerts',
  {
    incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
    alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
    linkedBy: uuid('linked_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    primaryKey({ columns: [table.incidentId, table.alertId] }),
  ]
);

export const incidentTimeline = pgTable(
  'incident_timeline',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
    eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    description: text('description').notNull(),
    actor: varchar('actor', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_incident_timeline_inc_time').on(table.incidentId, table.eventTime),
  ]
);

export const incidentNotes = pgTable(
  'incident_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    isPrivate: boolean('is_private').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_incident_notes_inc_created').on(table.incidentId, table.createdAt),
  ]
);

// ==========================================
// 7. SECURITY FINDINGS (SCANNERS)
// ==========================================

export const securityFindings = pgTable(
  'security_findings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    findingNumber: varchar('finding_number', { length: 20 }).notNull().unique().default(sql`('FS-' || lpad(nextval('finding_number_seq')::text, 6, '0'))`),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    severity: varchar('severity', { length: 20 }).notNull(),
    category: varchar('category', { length: 30 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('OPEN'),
    cloudAccountId: uuid('cloud_account_id').notNull().references(() => cloudAccounts.id, { onDelete: 'cascade' }),
    resourceId: varchar('resource_id', { length: 500 }).notNull(),
    region: varchar('region', { length: 30 }),
    recommendation: text('recommendation'),
    riskScore: integer('risk_score').notNull(),
    complianceFrameworks: text('compliance_frameworks').array(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    remediatedAt: timestamp('remediated_at', { withTimezone: true }),
    suppressedBy: uuid('suppressed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_findings_status_severity').on(table.status, table.severity),
    index('idx_findings_category').on(table.category),
    index('idx_findings_cloud_account').on(table.cloudAccountId),
    index('idx_findings_risk_score').on(table.riskScore),
  ]
);

export const iamFindings = pgTable(
  'iam_findings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    findingNumber: varchar('finding_number', { length: 20 }).notNull().unique().default(sql`('IAM-' || lpad(nextval('iam_finding_number_seq')::text, 6, '0'))`),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    severity: varchar('severity', { length: 20 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('OPEN'),
    cloudAccountId: uuid('cloud_account_id').notNull().references(() => cloudAccounts.id, { onDelete: 'cascade' }),
    affectedPrincipal: varchar('affected_principal', { length: 300 }).notNull(),
    principalType: varchar('principal_type', { length: 20 }).notNull(),
    recommendation: text('recommendation'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    remediatedAt: timestamp('remediated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_iam_findings_status_sev').on(table.status, table.severity),
    index('idx_iam_findings_account').on(table.cloudAccountId),
    index('idx_iam_findings_principal').on(table.affectedPrincipal),
  ]
);

// ==========================================
// 8. AUDIT LOGS & NOTIFICATIONS
// ==========================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    userDisplayName: varchar('user_display_name', { length: 200 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 50 }).notNull(),
    resourceId: varchar('resource_id', { length: 100 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    result: varchar('result', { length: 20 }).notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_created_at').on(table.createdAt),
    index('idx_audit_logs_user_created').on(table.userId, table.createdAt),
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_resource').on(table.resourceType, table.resourceId),
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    message: text('message'),
    notificationType: varchar('notification_type', { length: 50 }).notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notifications_user_read').on(table.userId, table.isRead, table.createdAt),
  ]
);
