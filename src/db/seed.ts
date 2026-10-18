import 'dotenv/config';
import { db } from './index';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting CloudGuard database seed process...');

  // Clean existing tables in reverse dependency order
  console.log('🧹 Cleaning existing records...');
  await db.execute(sql`
    TRUNCATE TABLE
      notifications,
      audit_logs,
      iam_findings,
      security_findings,
      incident_notes,
      incident_timeline,
      incident_alerts,
      incidents,
      alert_timeline,
      alert_comments,
      alerts,
      detection_rule_parameters,
      detection_rules,
      security_events,
      raw_logs,
      cloud_resources,
      cloud_accounts,
      role_permissions,
      user_roles,
      permissions,
      roles,
      users
    CASCADE;
  `);

  // Reset sequences
  await db.execute(sql`
    ALTER SEQUENCE alert_number_seq RESTART WITH 1;
    ALTER SEQUENCE incident_number_seq RESTART WITH 1;
    ALTER SEQUENCE finding_number_seq RESTART WITH 1;
    ALTER SEQUENCE iam_finding_number_seq RESTART WITH 1;
  `);

  console.log('👥 Seeding RBAC & Users...');

  // Roles
  const [adminRole] = await db.insert(schema.roles).values({
    name: 'ADMIN',
    description: 'Full platform administration rights',
  }).returning();

  const [analystRole] = await db.insert(schema.roles).values({
    name: 'SOC_ANALYST',
    description: 'SOC operations, alert investigation, incident handling',
  }).returning();

  const [viewerRole] = await db.insert(schema.roles).values({
    name: 'VIEWER',
    description: 'Read-only dashboard and reports access',
  }).returning();

  // Permissions
  const permissionsData = [
    { resource: 'alerts', action: 'read', description: 'View security alerts' },
    { resource: 'alerts', action: 'write', description: 'Modify alert status and comments' },
    { resource: 'incidents', action: 'read', description: 'View incidents' },
    { resource: 'incidents', action: 'write', description: 'Manage incidents and notes' },
    { resource: 'detection_rules', action: 'manage', description: 'Configure detection rules' },
    { resource: 'users', action: 'manage', description: 'Manage platform users' },
    { resource: 'audit_logs', action: 'read', description: 'View platform audit trail' },
  ];

  const insertedPermissions = await db.insert(schema.permissions).values(permissionsData).returning();

  // Role Permissions
  for (const perm of insertedPermissions) {
    await db.insert(schema.rolePermissions).values({ roleId: adminRole.id, permissionId: perm.id });
    if (perm.resource !== 'users' && perm.resource !== 'detection_rules') {
      await db.insert(schema.rolePermissions).values({ roleId: analystRole.id, permissionId: perm.id });
    }
    if (perm.action === 'read') {
      await db.insert(schema.rolePermissions).values({ roleId: viewerRole.id, permissionId: perm.id });
    }
  }

  // Users (password_hash is bcrypt for "CloudGuard2026!")
  const dummyPasswordHash = '$2a$10$RDRrvArf6XPOW0wNW/Caq.Dx9nQ4Ro7bfgJqXQYQmy1HWPY9qM6/y';

  const [sarah] = await db.insert(schema.users).values({
    username: 'sarah.chen',
    email: 'sarah.chen@acmecorp.io',
    passwordHash: dummyPasswordHash,
    displayName: 'Sarah Chen',
    department: 'SOC Operations',
    status: 'ACTIVE',
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 3600000),
    lastLoginIp: '192.168.1.45',
  }).returning();

  const [alex] = await db.insert(schema.users).values({
    username: 'alex.rivera',
    email: 'alex.rivera@acmecorp.io',
    passwordHash: dummyPasswordHash,
    displayName: 'Alex Rivera',
    department: 'Incident Response',
    status: 'ACTIVE',
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 86400000),
    lastLoginIp: '192.168.1.88',
  }).returning();

  const [john] = await db.insert(schema.users).values({
    username: 'john.doe',
    email: 'john.doe@acmecorp.io',
    passwordHash: dummyPasswordHash,
    displayName: 'John Doe',
    department: 'Compliance',
    status: 'ACTIVE',
    mfaEnabled: false,
    lastLoginAt: new Date(Date.now() - 172800000),
    lastLoginIp: '192.168.1.102',
  }).returning();

  await db.insert(schema.userRoles).values([
    { userId: sarah.id, roleId: adminRole.id },
    { userId: alex.id, roleId: analystRole.id },
    { userId: john.id, roleId: viewerRole.id },
  ]);

  console.log('☁️ Seeding Cloud Accounts & Resources...');

  const [prodAccount] = await db.insert(schema.cloudAccounts).values({
    name: 'AWS Production Primary',
    provider: 'AWS',
    accountId: '123456789012',
    roleArn: 'arn:aws:iam::123456789012:role/CloudGuardSOCReadRole',
    externalId: 'cloudguard-ext-prod-8841',
    primaryRegion: 'us-east-1',
    monitoredRegions: 'us-east-1,us-west-2,eu-central-1',
    status: 'CONNECTED',
    lastSyncAt: new Date(),
  }).returning();

  const [stagingAccount] = await db.insert(schema.cloudAccounts).values({
    name: 'AWS Staging Environment',
    provider: 'AWS',
    accountId: '987654321098',
    roleArn: 'arn:aws:iam::987654321098:role/CloudGuardSOCReadRole',
    externalId: 'cloudguard-ext-stg-9923',
    primaryRegion: 'us-west-2',
    monitoredRegions: 'us-west-2',
    status: 'CONNECTED',
    lastSyncAt: new Date(),
  }).returning();

  // Cloud resources
  await db.insert(schema.cloudResources).values([
    {
      cloudAccountId: prodAccount.id,
      resourceType: 'EC2_INSTANCE',
      resourceId: 'i-0a1b2c3d4e5f6g7h8',
      resourceName: 'prod-api-gateway-01',
      region: 'us-east-1',
      configuration: { instanceType: 't3.large', state: 'running', publicIp: '54.210.12.44' },
    },
    {
      cloudAccountId: prodAccount.id,
      resourceType: 'S3_BUCKET',
      resourceId: 'arn:aws:s3:::acme-prod-backups-2024',
      resourceName: 'acme-prod-backups-2024',
      region: 'us-east-1',
      configuration: { publicAccessBlock: false, encryption: 'AES256' },
    },
    {
      cloudAccountId: prodAccount.id,
      resourceType: 'SECURITY_GROUP',
      resourceId: 'sg-0123456789abcdef0',
      resourceName: 'sg-database-prod',
      region: 'us-east-1',
      configuration: { inboundRulesCount: 4, allowsPublicPostgres: true },
    },
    {
      cloudAccountId: stagingAccount.id,
      resourceType: 'EC2_INSTANCE',
      resourceId: 'i-0987654321fedcba0',
      resourceName: 'stg-k8s-node-01',
      region: 'us-west-2',
      configuration: { instanceType: 't3.medium', state: 'running' },
    },
  ]);

  console.log('📜 Seeding Ingestion & Event Pipeline (RawLog -> SecurityEvent)...');

  // Pipeline Step 1: Raw Unprocessed Logs
  const [rawLog1] = await db.insert(schema.rawLogs).values({
    cloudAccountId: prodAccount.id,
    source: 'CLOUDTRAIL',
    rawPayload: {
      eventVersion: '1.08',
      userIdentity: { type: 'IAMUser', userName: 'jsmith', arn: 'arn:aws:iam::123456789012:user/jsmith' },
      eventTime: new Date(Date.now() - 7200000).toISOString(),
      eventSource: 'signin.amazonaws.com',
      eventName: 'ConsoleLogin',
      awsRegion: 'us-east-1',
      sourceIPAddress: '198.51.100.42',
      errorMessage: 'Failed authentication',
      responseElements: { ConsoleLogin: 'Failure' },
    },
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    processed: true,
    processedAt: new Date(),
  }).returning();

  const [rawLog2] = await db.insert(schema.rawLogs).values({
    cloudAccountId: prodAccount.id,
    source: 'CLOUDTRAIL',
    rawPayload: {
      eventVersion: '1.08',
      userIdentity: { type: 'IAMUser', userName: 'root', arn: 'arn:aws:iam::123456789012:root' },
      eventTime: new Date(Date.now() - 3600000).toISOString(),
      eventSource: 'iam.amazonaws.com',
      eventName: 'AttachUserPolicy',
      awsRegion: 'us-east-1',
      sourceIPAddress: '203.0.113.195',
      requestParameters: { userName: 'backdoor-svc', policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' },
    },
    payloadHash: '4a8a08f09d37b73795649038408b5f33fe65c158147a0b50302fb06709848a60',
    processed: true,
    processedAt: new Date(),
  }).returning();

  // Pipeline Step 2: Normalized Security Events
  const [event1] = await db.insert(schema.securityEvents).values({
    rawLogId: rawLog1.id,
    cloudAccountId: prodAccount.id,
    eventTime: new Date(Date.now() - 7200000),
    eventType: 'ConsoleLogin',
    eventSource: 'signin.amazonaws.com',
    sourceIp: '198.51.100.42',
    userIdentity: 'jsmith',
    targetResource: 'arn:aws:iam::123456789012:root',
    region: 'us-east-1',
    severity: 'HIGH',
    isError: true,
    errorCode: 'AUTH_FAILURE',
    errorMessage: 'Failed authentication attempt from untrusted IP',
    processedByEngine: true,
  }).returning();

  const [event2] = await db.insert(schema.securityEvents).values({
    rawLogId: rawLog2.id,
    cloudAccountId: prodAccount.id,
    eventTime: new Date(Date.now() - 3600000),
    eventType: 'AttachUserPolicy',
    eventSource: 'iam.amazonaws.com',
    sourceIp: '203.0.113.195',
    userIdentity: 'root',
    targetResource: 'arn:aws:iam::123456789012:user/backdoor-svc',
    region: 'us-east-1',
    severity: 'CRITICAL',
    requestParameters: { policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' },
    processedByEngine: true,
  }).returning();

  console.log('⚡ Seeding Detection Engine & Configurable Rules...');

  // Pipeline Step 3: Detection Rules
  const [rule1] = await db.insert(schema.detectionRules).values({
    name: 'Brute Force Console Login Attempts',
    description: 'Detects multiple failed AWS Management Console login attempts from a single source IP address within a short window.',
    ruleType: 'THRESHOLD',
    category: 'BRUTE_FORCE',
    severity: 'HIGH',
    enabled: true,
    logicDefinition: {
      eventType: 'ConsoleLogin',
      condition: 'is_error == true',
      threshold: 10,
      timeWindowSeconds: 300,
      groupBy: ['sourceIp'],
    },
    triggerDescription: 'Triggered when > 10 failed logins occur from the same IP within 5 minutes.',
    mitreTechniqueId: 'T1110',
    mitreTactic: 'Credential Access',
    cooldownMinutes: 15,
    alertCount: 14,
    lastTriggeredAt: new Date(Date.now() - 7200000),
    createdBy: sarah.id,
  }).returning();

  const [rule2] = await db.insert(schema.detectionRules).values({
    name: 'Privilege Escalation via AdministratorAccess Policy',
    description: 'Detects attaching AdministratorAccess policy to IAM users or roles outside change control windows.',
    ruleType: 'PATTERN',
    category: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    enabled: true,
    logicDefinition: {
      eventType: 'AttachUserPolicy',
      match: { 'requestParameters.policyArn': 'arn:aws:iam::aws:policy/AdministratorAccess' },
    },
    triggerDescription: 'Triggered when AdministratorAccess policy is attached to any user.',
    mitreTechniqueId: 'T1098',
    mitreTactic: 'Persistence',
    cooldownMinutes: 0,
    alertCount: 3,
    lastTriggeredAt: new Date(Date.now() - 3600000),
    createdBy: sarah.id,
  }).returning();

  // Structured Rule Parameters
  await db.insert(schema.detectionRuleParameters).values([
    { ruleId: rule1.id, paramKey: 'threshold', paramValue: '10', paramType: 'INTEGER' },
    { ruleId: rule1.id, paramKey: 'timeWindowSeconds', paramValue: '300', paramType: 'INTEGER' },
    { ruleId: rule1.id, paramKey: 'groupBy', paramValue: 'sourceIp', paramType: 'STRING' },
    { ruleId: rule1.id, paramKey: 'targetEventType', paramValue: 'ConsoleLogin', paramType: 'STRING' },

    { ruleId: rule2.id, paramKey: 'targetPolicyArn', paramValue: 'arn:aws:iam::aws:policy/AdministratorAccess', paramType: 'STRING' },
    { ruleId: rule2.id, paramKey: 'targetEventType', paramValue: 'AttachUserPolicy', paramType: 'STRING' },
  ]);

  console.log('🚨 Seeding Alerts & SOC Workflows...');

  // Pipeline Step 4: Alerts
  const [alert1] = await db.insert(schema.alerts).values({
    title: 'Multiple Failed Console Login Attempts',
    description: '14 failed login attempts detected from IP 198.51.100.42 targeting account root/jsmith in us-east-1.',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    source: 'DETECTION_ENGINE',
    detectionRuleId: rule1.id,
    triggerEventId: event1.id,
    cloudAccountId: prodAccount.id,
    sourceIp: '198.51.100.42',
    userIdentity: 'jsmith',
    targetResource: 'AWS Management Console',
    region: 'us-east-1',
    mitreTechniqueId: 'T1110',
    mitreTactic: 'Credential Access',
    assignedTo: alex.id,
  }).returning();

  const [alert2] = await db.insert(schema.alerts).values({
    title: 'Unauthorized AdministratorAccess Attached to User',
    description: 'AdministratorAccess policy was attached to user backdoor-svc by root from external IP 203.0.113.195.',
    severity: 'CRITICAL',
    status: 'NEW',
    source: 'DETECTION_ENGINE',
    detectionRuleId: rule2.id,
    triggerEventId: event2.id,
    cloudAccountId: prodAccount.id,
    sourceIp: '203.0.113.195',
    userIdentity: 'root',
    targetResource: 'arn:aws:iam::123456789012:user/backdoor-svc',
    region: 'us-east-1',
    mitreTechniqueId: 'T1098',
    mitreTactic: 'Persistence',
    assignedTo: sarah.id,
  }).returning();

  // Alert Comments
  await db.insert(schema.alertComments).values([
    {
      alertId: alert1.id,
      authorId: alex.id,
      content: 'Initiated IP lookup on 198.51.100.42. Source resolves to a known TOR exit node. Recommending immediate MFA enforcement.',
    },
    {
      alertId: alert2.id,
      authorId: sarah.id,
      content: 'Critical threat detected. Escalating to Incident Response immediately.',
    },
  ]);

  // Alert Timeline
  await db.insert(schema.alertTimeline).values([
    {
      alertId: alert1.id,
      eventTime: new Date(Date.now() - 7200000),
      eventType: 'ALERT',
      description: 'Alert generated by detection rule: Brute Force Console Login Attempts',
      severity: 'HIGH',
      actor: 'Detection Engine',
    },
    {
      alertId: alert1.id,
      eventTime: new Date(Date.now() - 5400000),
      eventType: 'STATUS_CHANGE',
      description: 'Status changed from NEW to INVESTIGATING',
      severity: 'INFO',
      actor: 'Alex Rivera',
    },
  ]);

  console.log('🔥 Seeding Incidents & Incident Escalation...');

  // Pipeline Step 5: Incidents
  const [incident1] = await db.insert(schema.incidents).values({
    title: 'Privilege Escalation & Unauthorized Persistence Activity',
    description: 'Suspicious administrator privilege escalation detected on user backdoor-svc following unauthorized console access.',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    category: 'Privilege Escalation',
    assignedTo: sarah.id,
    createdBy: sarah.id,
  }).returning();

  // Link Alert to Incident
  await db.insert(schema.incidentAlerts).values([
    { incidentId: incident1.id, alertId: alert2.id, linkedBy: sarah.id },
    { incidentId: incident1.id, alertId: alert1.id, linkedBy: sarah.id },
  ]);

  // Incident Timeline
  await db.insert(schema.incidentTimeline).values([
    {
      incidentId: incident1.id,
      eventTime: new Date(Date.now() - 3600000),
      eventType: 'INCIDENT_CREATED',
      description: 'Incident INC-000001 declared from critical alert ALT-000002',
      actor: 'Sarah Chen',
    },
    {
      incidentId: incident1.id,
      eventTime: new Date(Date.now() - 1800000),
      eventType: 'NOTE',
      description: 'Isolated IAM user backdoor-svc and revoked active sessions.',
      actor: 'Sarah Chen',
    },
  ]);

  // Incident Notes
  await db.insert(schema.incidentNotes).values([
    {
      incidentId: incident1.id,
      authorId: sarah.id,
      content: 'Confirmed backdoor user account created at 2024-01-15 04:12:00 UTC. Policy AdministratorAccess detached.',
      isPrivate: false,
    },
  ]);

  console.log('🔍 Seeding Security Findings (Config & IAM Scanners)...');

  // Security Findings (Scanner - Separate from Alert)
  await db.insert(schema.securityFindings).values([
    {
      title: 'S3 Bucket Accessible to Public Internet',
      description: 'S3 bucket acme-prod-backups-2024 has public read access enabled via bucket ACL.',
      severity: 'CRITICAL',
      category: 'STORAGE',
      status: 'OPEN',
      cloudAccountId: prodAccount.id,
      resourceId: 'arn:aws:s3:::acme-prod-backups-2024',
      region: 'us-east-1',
      recommendation: 'Enable Block Public Access setting on bucket acme-prod-backups-2024.',
      riskScore: 92,
      complianceFrameworks: ['CIS AWS 2.1.1', 'NIST SP 800-53 AC-3'],
    },
    {
      title: 'PostgreSQL Database Port 5432 Exposed to 0.0.0.0/0',
      description: 'Security group sg-database-prod allows unrestricted inbound TCP traffic on port 5432.',
      severity: 'CRITICAL',
      category: 'NETWORK',
      status: 'OPEN',
      cloudAccountId: prodAccount.id,
      resourceId: 'sg-0123456789abcdef0',
      region: 'us-east-1',
      recommendation: 'Restrict inbound port 5432 access to application VPC CIDR range only.',
      riskScore: 95,
      complianceFrameworks: ['PCI-DSS 1.3', 'CIS AWS 5.2'],
    },
  ]);

  // IAM Findings
  await db.insert(schema.iamFindings).values([
    {
      title: 'IAM User Console Access Without MFA',
      description: 'User jsmith has active management console access without MFA enabled.',
      severity: 'HIGH',
      category: 'MFA Enforcement',
      status: 'OPEN',
      cloudAccountId: prodAccount.id,
      affectedPrincipal: 'arn:aws:iam::123456789012:user/jsmith',
      principalType: 'USER',
      recommendation: 'Enforce virtual MFA or FIDO security key registration.',
    },
  ]);

  console.log('📋 Seeding Append-Only Platform Audit Trail...');

  // Pipeline Step 7: Platform Audit Logs
  await db.insert(schema.auditLogs).values([
    {
      userId: sarah.id,
      userDisplayName: 'Sarah Chen',
      action: 'INCIDENT_CREATED',
      resourceType: 'Incident',
      resourceId: incident1.id,
      ipAddress: '192.168.1.45',
      result: 'SUCCESS',
      details: { incidentNumber: 'INC-000001', severity: 'CRITICAL' },
    },
    {
      userId: alex.id,
      userDisplayName: 'Alex Rivera',
      action: 'ALERT_STATUS_CHANGED',
      resourceType: 'Alert',
      resourceId: alert1.id,
      ipAddress: '192.168.1.88',
      result: 'SUCCESS',
      details: { oldStatus: 'NEW', newStatus: 'INVESTIGATING' },
    },
  ]);

  console.log('✅ CloudGuard seed completed successfully!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
