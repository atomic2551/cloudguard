// CloudGuard Mock Data — Realistic cybersecurity simulation data

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
export type FindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATED' | 'SUPPRESSED';
export type UserRole = 'ADMIN' | 'SOC_ANALYST' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type CloudProvider = 'AWS' | 'AZURE' | 'GCP';
export type AccountStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  sourceIp: string;
  username: string;
  resource: string;
  region: string;
  detectionRule: string;
  mitreId: string;
  mitreTactic: string;
  cloudAccount: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  timeline: TimelineEvent[];
  comments: AlertComment[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  severity?: Severity;
}

export interface AlertComment {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  assignedTo: string;
  relatedAlerts: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  category: string;
  timeline: IncidentTimelineEvent[];
  notes: IncidentNote[];
  evidence: string[];
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: string;
}

export interface IncidentNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  source: string;
  sourceIp: string;
  username: string;
  resource: string;
  region: string;
  severity: Severity;
  cloudAccount: string;
  rawEvent: Record<string, unknown>;
  processed: boolean;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: Severity;
  enabled: boolean;
  trigger: string;
  threshold?: number;
  timeWindow?: string;
  mitreId: string;
  mitreTactic: string;
  alertCount: number;
  lastTriggered?: string;
  createdAt: string;
}

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: 'IAM' | 'NETWORK' | 'STORAGE' | 'COMPUTE' | 'LOGGING' | 'ENCRYPTION';
  status: FindingStatus;
  resource: string;
  region: string;
  cloudAccount: string;
  recommendation: string;
  riskScore: number;
  detectedAt: string;
  remediatedAt?: string;
  compliance: string[];
}

export interface IAMFinding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  affectedUser: string;
  recommendation: string;
  status: FindingStatus;
  detectedAt: string;
  category: string;
}

export interface CloudAccount {
  id: string;
  name: string;
  provider: CloudProvider;
  accountId: string;
  region: string;
  status: AccountStatus;
  lastSync: string;
  securityScore: number;
  resourceCount: number;
  criticalFindings: number;
  highFindings: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  department: string;
  mfaEnabled: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  resource: string;
  resourceType: string;
  ip: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, unknown>;
}

// ─── MOCK ALERTS ───────────────────────────────────────────────────────────────
export const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    title: 'Privilege Escalation Detected',
    description: 'AdministratorAccess policy was attached to IAM user jsmith. This grants full AWS account access and represents a critical security risk.',
    severity: 'CRITICAL',
    status: 'NEW',
    source: 'AWS_CLOUDTRAIL',
    sourceIp: '185.220.101.47',
    username: 'terraform-deploy',
    resource: 'arn:aws:iam::123456789012:user/jsmith',
    region: 'us-east-1',
    detectionRule: 'Privilege Escalation — Admin Policy Attach',
    mitreId: 'T1098',
    mitreTactic: 'Persistence',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-15T10:24:02Z',
    updatedAt: '2024-01-15T10:24:02Z',
    timeline: [
      { id: 't1', timestamp: '2024-01-15T10:18:44Z', type: 'IAM_EVENT', description: 'IAM user jsmith created', severity: 'HIGH' },
      { id: 't2', timestamp: '2024-01-15T10:21:12Z', type: 'IAM_EVENT', description: 'AttachUserPolicy called on arn:aws:iam::aws:policy/AdministratorAccess', severity: 'CRITICAL' },
      { id: 't3', timestamp: '2024-01-15T10:24:02Z', type: 'ALERT', description: 'Alert generated by Detection Engine', severity: 'CRITICAL' },
    ],
    comments: [
      { id: 'c1', author: 'Sarah Chen', role: 'SOC_ANALYST', content: 'Investigating — confirmed this was not an authorized change. Escalating to ADMIN.', createdAt: '2024-01-15T10:30:00Z' },
    ],
  },
  {
    id: 'ALT-002',
    title: 'Possible Brute Force Attack',
    description: '14 consecutive failed login attempts detected from IP 45.33.32.156 against AWS Console account in under 5 minutes.',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    source: 'AWS_CLOUDTRAIL',
    sourceIp: '45.33.32.156',
    username: 'admin@acmecorp.io',
    resource: 'AWS Console',
    region: 'us-east-1',
    detectionRule: 'Brute Force Login Detection',
    mitreId: 'T1110',
    mitreTactic: 'Credential Access',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-15T09:45:00Z',
    updatedAt: '2024-01-15T10:01:00Z',
    assignedTo: 'Sarah Chen',
    timeline: [
      { id: 't1', timestamp: '2024-01-15T09:41:03Z', type: 'AUTH', description: 'Failed login attempt #1', severity: 'LOW' },
      { id: 't2', timestamp: '2024-01-15T09:41:28Z', type: 'AUTH', description: 'Failed login attempt #2', severity: 'LOW' },
      { id: 't3', timestamp: '2024-01-15T09:42:01Z', type: 'AUTH', description: 'Failed login attempt #5', severity: 'MEDIUM' },
      { id: 't4', timestamp: '2024-01-15T09:43:15Z', type: 'AUTH', description: 'Failed login attempt #10 — threshold reached', severity: 'HIGH' },
      { id: 't5', timestamp: '2024-01-15T09:44:52Z', type: 'AUTH', description: 'Failed login attempt #14', severity: 'HIGH' },
      { id: 't6', timestamp: '2024-01-15T09:45:00Z', type: 'ALERT', description: 'Brute Force alert generated', severity: 'HIGH' },
    ],
    comments: [],
  },
  {
    id: 'ALT-003',
    title: 'Public S3 Bucket Detected',
    description: 'S3 bucket "acme-prod-backups-2024" has public read access enabled. This may expose sensitive backup data to the internet.',
    severity: 'HIGH',
    status: 'NEW',
    source: 'CONFIG_SCANNER',
    sourceIp: 'N/A',
    username: 'devops-automation',
    resource: 'arn:aws:s3:::acme-prod-backups-2024',
    region: 'us-east-1',
    detectionRule: 'Public S3 Bucket Detection',
    mitreId: 'T1530',
    mitreTactic: 'Collection',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
    timeline: [
      { id: 't1', timestamp: '2024-01-15T08:25:00Z', type: 'CONFIG', description: 'S3 bucket ACL changed to public-read', severity: 'HIGH' },
      { id: 't2', timestamp: '2024-01-15T08:30:00Z', type: 'ALERT', description: 'Public S3 bucket alert generated', severity: 'HIGH' },
    ],
    comments: [],
  },
  {
    id: 'ALT-004',
    title: 'SSH Port 22 Open to Internet',
    description: 'Security Group sg-0a1b2c3d4e5f allows inbound TCP port 22 from 0.0.0.0/0 (all IPv4). This exposes EC2 instances to brute force and exploitation attacks.',
    severity: 'CRITICAL',
    status: 'ACKNOWLEDGED',
    source: 'CONFIG_SCANNER',
    sourceIp: 'N/A',
    username: 'terraform-ci',
    resource: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-0a1b2c3d4e5f',
    region: 'us-east-1',
    detectionRule: 'Public SSH Access Detection',
    mitreId: 'T1190',
    mitreTactic: 'Initial Access',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-15T07:15:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    assignedTo: 'Marcus Williams',
    timeline: [
      { id: 't1', timestamp: '2024-01-15T07:10:00Z', type: 'CONFIG', description: 'Security Group rule added: TCP 22 from 0.0.0.0/0', severity: 'CRITICAL' },
      { id: 't2', timestamp: '2024-01-15T07:15:00Z', type: 'ALERT', description: 'Public SSH alert generated', severity: 'CRITICAL' },
      { id: 't3', timestamp: '2024-01-15T09:00:00Z', type: 'STATUS', description: 'Alert acknowledged by Marcus Williams', severity: 'INFO' },
    ],
    comments: [
      { id: 'c1', author: 'Marcus Williams', role: 'SOC_ANALYST', content: 'Confirmed with DevOps team — temporary access for maintenance. Will be remediated by EOD.', createdAt: '2024-01-15T09:05:00Z' },
    ],
  },
  {
    id: 'ALT-005',
    title: 'AWS Root Account Login',
    description: 'AWS root account was used to log in to the AWS Management Console. Root account usage should be avoided and is a critical security indicator.',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    source: 'AWS_CLOUDTRAIL',
    sourceIp: '203.0.113.42',
    username: 'root',
    resource: 'AWS Management Console',
    region: 'us-east-1',
    detectionRule: 'Root Account Usage Detection',
    mitreId: 'T1078.004',
    mitreTactic: 'Defense Evasion',
    cloudAccount: 'AWS Development',
    createdAt: '2024-01-14T22:11:00Z',
    updatedAt: '2024-01-15T08:45:00Z',
    assignedTo: 'Sarah Chen',
    timeline: [
      { id: 't1', timestamp: '2024-01-14T22:11:00Z', type: 'AUTH', description: 'Root account console login from 203.0.113.42', severity: 'CRITICAL' },
      { id: 't2', timestamp: '2024-01-14T22:11:05Z', type: 'ALERT', description: 'Root account login alert generated', severity: 'CRITICAL' },
      { id: 't3', timestamp: '2024-01-15T08:45:00Z', type: 'STATUS', description: 'Alert resolved — confirmed authorized access by account owner', severity: 'INFO' },
    ],
    comments: [
      { id: 'c1', author: 'Sarah Chen', role: 'SOC_ANALYST', content: 'Contacted account owner — confirmed authorized emergency access. Reminding team about root account policy.', createdAt: '2024-01-15T08:40:00Z' },
    ],
  },
  {
    id: 'ALT-006',
    title: 'Database Port 5432 Exposed to Internet',
    description: 'Security Group allows PostgreSQL port 5432 from 0.0.0.0/0. Production database directly exposed to internet is a critical data breach risk.',
    severity: 'CRITICAL',
    status: 'NEW',
    source: 'CONFIG_SCANNER',
    sourceIp: 'N/A',
    username: 'manual-config',
    resource: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-database-prod',
    region: 'us-east-1',
    detectionRule: 'Database Port Exposure Detection',
    mitreId: 'T1190',
    mitreTactic: 'Initial Access',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-15T11:02:00Z',
    updatedAt: '2024-01-15T11:02:00Z',
    timeline: [
      { id: 't1', timestamp: '2024-01-15T10:58:00Z', type: 'CONFIG', description: 'Security Group rule added: TCP 5432 from 0.0.0.0/0', severity: 'CRITICAL' },
      { id: 't2', timestamp: '2024-01-15T11:02:00Z', type: 'ALERT', description: 'Database exposure alert generated', severity: 'CRITICAL' },
    ],
    comments: [],
  },
  {
    id: 'ALT-007',
    title: 'IAM Access Key Not Rotated (120 Days)',
    description: 'IAM user maria.santos has an active access key (AKIA...) that has not been rotated for 120 days. Stale credentials increase breach risk.',
    severity: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    source: 'IAM_SCANNER',
    sourceIp: 'N/A',
    username: 'maria.santos',
    resource: 'arn:aws:iam::123456789012:user/maria.santos',
    region: 'global',
    detectionRule: 'Access Key Rotation Policy',
    mitreId: 'T1098',
    mitreTactic: 'Persistence',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-13T06:00:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
    timeline: [
      { id: 't1', timestamp: '2024-01-13T06:00:00Z', type: 'SCAN', description: 'IAM key rotation check identified stale key', severity: 'MEDIUM' },
      { id: 't2', timestamp: '2024-01-14T09:30:00Z', type: 'STATUS', description: 'Alert acknowledged — rotation in progress', severity: 'INFO' },
    ],
    comments: [],
  },
  {
    id: 'ALT-008',
    title: 'CloudTrail Logging Disabled',
    description: 'CloudTrail trail "prod-audit-trail" was stopped. This disables audit logging and represents a defense evasion technique.',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    source: 'AWS_CLOUDTRAIL',
    sourceIp: '10.0.0.5',
    username: 'svc-cloudops',
    resource: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/prod-audit-trail',
    region: 'us-east-1',
    detectionRule: 'CloudTrail Disabled Detection',
    mitreId: 'T1562.008',
    mitreTactic: 'Defense Evasion',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-12T15:20:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
    timeline: [
      { id: 't1', timestamp: '2024-01-12T15:20:00Z', type: 'API', description: 'StopLogging API call on prod-audit-trail', severity: 'CRITICAL' },
      { id: 't2', timestamp: '2024-01-12T15:20:30Z', type: 'ALERT', description: 'CloudTrail disabled alert generated', severity: 'CRITICAL' },
      { id: 't3', timestamp: '2024-01-12T16:00:00Z', type: 'STATUS', description: 'Resolved — svc-cloudops authorized rotation', severity: 'INFO' },
    ],
    comments: [],
  },
  {
    id: 'ALT-009',
    title: 'Suspicious IAM User Activity',
    description: 'IAM user created and AdministratorAccess policy attached within 8 minutes. Pattern matches account takeover or insider threat.',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    source: 'AWS_CLOUDTRAIL',
    sourceIp: '91.108.4.188',
    username: 'devops-prod',
    resource: 'arn:aws:iam::123456789012:user/backdoor-svc',
    region: 'eu-west-1',
    detectionRule: 'Suspicious IAM Creation + Admin Access',
    mitreId: 'T1136',
    mitreTactic: 'Persistence',
    cloudAccount: 'AWS Production',
    createdAt: '2024-01-15T06:30:00Z',
    updatedAt: '2024-01-15T07:15:00Z',
    assignedTo: 'Sarah Chen',
    timeline: [
      { id: 't1', timestamp: '2024-01-15T06:22:00Z', type: 'IAM_EVENT', description: 'CreateUser: backdoor-svc', severity: 'HIGH' },
      { id: 't2', timestamp: '2024-01-15T06:30:00Z', type: 'IAM_EVENT', description: 'AttachUserPolicy: AdministratorAccess to backdoor-svc', severity: 'CRITICAL' },
      { id: 't3', timestamp: '2024-01-15T06:30:15Z', type: 'ALERT', description: 'Suspicious IAM activity alert generated', severity: 'CRITICAL' },
    ],
    comments: [],
  },
  {
    id: 'ALT-010',
    title: 'Multi-Region API Activity',
    description: 'User account devops-prod performed API calls across 5 AWS regions within 1 hour. Unusual geographic access pattern detected.',
    severity: 'MEDIUM',
    status: 'FALSE_POSITIVE',
    source: 'AWS_CLOUDTRAIL',
    sourceIp: '10.0.0.12',
    username: 'devops-prod',
    resource: 'Multiple AWS Resources',
    region: 'Multiple',
    detectionRule: 'Multi-Region Unusual Activity',
    mitreId: 'T1078',
    mitreTactic: 'Valid Accounts',
    cloudAccount: 'AWS Development',
    createdAt: '2024-01-14T14:00:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    timeline: [
      { id: 't1', timestamp: '2024-01-14T14:00:00Z', type: 'API', description: 'API calls in us-east-1, eu-west-1, ap-southeast-1, us-west-2, sa-east-1', severity: 'MEDIUM' },
      { id: 't2', timestamp: '2024-01-14T14:01:00Z', type: 'ALERT', description: 'Multi-region activity alert generated', severity: 'MEDIUM' },
      { id: 't3', timestamp: '2024-01-14T15:30:00Z', type: 'STATUS', description: 'Marked false positive — global deployment job', severity: 'INFO' },
    ],
    comments: [],
  },
];

// ─── MOCK INCIDENTS ────────────────────────────────────────────────────────────
export const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: 'Suspected Account Compromise — Production IAM',
    description: 'Multiple indicators suggest IAM account compromise in production environment. A new IAM user was created with administrator access, followed by privilege escalation attempts. Immediate containment required.',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    assignedTo: 'Sarah Chen',
    relatedAlerts: ['ALT-001', 'ALT-009'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T11:45:00Z',
    category: 'Account Compromise',
    timeline: [
      { id: 'tl1', timestamp: '2024-01-15T10:18:44Z', type: 'ALERT', description: 'IAM user backdoor-svc created', actor: 'System' },
      { id: 'tl2', timestamp: '2024-01-15T10:24:02Z', type: 'ALERT', description: 'AdministratorAccess policy attached to backdoor-svc', actor: 'System' },
      { id: 'tl3', timestamp: '2024-01-15T10:30:00Z', type: 'INCIDENT_CREATED', description: 'Incident INC-001 created', actor: 'Sarah Chen' },
      { id: 'tl4', timestamp: '2024-01-15T10:45:00Z', type: 'NOTE', description: 'Initial triage completed — confirmed malicious activity', actor: 'Sarah Chen' },
      { id: 'tl5', timestamp: '2024-01-15T11:00:00Z', type: 'ACTION', description: 'IAM user backdoor-svc disabled', actor: 'Admin' },
      { id: 'tl6', timestamp: '2024-01-15T11:45:00Z', type: 'NOTE', description: 'Forensic analysis in progress', actor: 'Sarah Chen' },
    ],
    notes: [
      { id: 'n1', author: 'Sarah Chen', content: 'Initial triage: Confirmed that IAM user "backdoor-svc" was created by "devops-prod" from IP 91.108.4.188 (Telegram datacenter — suspicious). User creation was not in any scheduled deployment job. Escalating to ADMIN for immediate containment.', createdAt: '2024-01-15T10:45:00Z', isPrivate: false },
      { id: 'n2', author: 'Alex Rodriguez', content: 'IAM user has been disabled. Running CloudTrail analysis to determine what actions were taken with the compromised account.', createdAt: '2024-01-15T11:10:00Z', isPrivate: false },
    ],
    evidence: ['CloudTrail log showing CreateUser event', 'AttachUserPolicy API call from 91.108.4.188', 'IAM user creation timestamp vs policy attachment timeline'],
  },
  {
    id: 'INC-002',
    title: 'Public Database Exposure — Production PostgreSQL',
    description: 'Production PostgreSQL database is directly accessible from the internet via Security Group misconfiguration. Immediate remediation required to prevent data breach.',
    severity: 'CRITICAL',
    status: 'CONTAINED',
    assignedTo: 'Marcus Williams',
    relatedAlerts: ['ALT-006'],
    createdAt: '2024-01-15T11:10:00Z',
    updatedAt: '2024-01-15T12:30:00Z',
    category: 'Data Exposure',
    timeline: [
      { id: 'tl1', timestamp: '2024-01-15T11:02:00Z', type: 'ALERT', description: 'Database port 5432 exposed to 0.0.0.0/0 detected', actor: 'System' },
      { id: 'tl2', timestamp: '2024-01-15T11:10:00Z', type: 'INCIDENT_CREATED', description: 'Incident INC-002 created', actor: 'Marcus Williams' },
      { id: 'tl3', timestamp: '2024-01-15T11:25:00Z', type: 'ACTION', description: 'Security Group rule removed — port 5432 closed', actor: 'DevOps Team' },
      { id: 'tl4', timestamp: '2024-01-15T12:30:00Z', type: 'STATUS_CHANGE', description: 'Status changed to CONTAINED', actor: 'Marcus Williams' },
    ],
    notes: [
      { id: 'n1', author: 'Marcus Williams', content: 'Security Group sg-database-prod had rule added manually — not via Terraform. DevOps team notified. Rule removed at 11:25. Checking database logs for unauthorized access attempts.', createdAt: '2024-01-15T11:30:00Z', isPrivate: false },
    ],
    evidence: ['Security Group rule change in CloudTrail', 'Database access logs showing connection attempts from external IPs'],
  },
  {
    id: 'INC-003',
    title: 'Brute Force Attack — AWS Console',
    description: 'Sustained brute force attack against AWS Management Console. 47 failed login attempts over 20 minutes from known malicious IP range.',
    severity: 'HIGH',
    status: 'RESOLVED',
    assignedTo: 'Sarah Chen',
    relatedAlerts: ['ALT-002'],
    createdAt: '2024-01-15T09:50:00Z',
    updatedAt: '2024-01-15T10:45:00Z',
    resolvedAt: '2024-01-15T10:45:00Z',
    category: 'Brute Force',
    timeline: [
      { id: 'tl1', timestamp: '2024-01-15T09:41:03Z', type: 'ALERT', description: 'First failed login detected', actor: 'System' },
      { id: 'tl2', timestamp: '2024-01-15T09:45:00Z', type: 'ALERT', description: 'Brute force threshold exceeded', actor: 'System' },
      { id: 'tl3', timestamp: '2024-01-15T09:50:00Z', type: 'INCIDENT_CREATED', description: 'Incident INC-003 created', actor: 'Sarah Chen' },
      { id: 'tl4', timestamp: '2024-01-15T10:00:00Z', type: 'ACTION', description: 'IP 45.33.32.156 blocked at WAF', actor: 'Sarah Chen' },
      { id: 'tl5', timestamp: '2024-01-15T10:45:00Z', type: 'STATUS_CHANGE', description: 'Incident resolved — attack ceased', actor: 'Sarah Chen' },
    ],
    notes: [
      { id: 'n1', author: 'Sarah Chen', content: 'IP 45.33.32.156 is listed on multiple threat intelligence feeds as known attack infrastructure. Added to blocklist. Attack stopped after WAF block. No successful logins occurred.', createdAt: '2024-01-15T10:05:00Z', isPrivate: false },
    ],
    evidence: ['CloudTrail failed login events', 'IP threat intelligence report for 45.33.32.156'],
  },
  {
    id: 'INC-004',
    title: 'Unauthorized S3 Data Access',
    description: 'Multiple objects downloaded from sensitive S3 bucket by an IAM role not typically associated with data access. Potential data exfiltration.',
    severity: 'HIGH',
    status: 'OPEN',
    assignedTo: 'Unassigned',
    relatedAlerts: ['ALT-003'],
    createdAt: '2024-01-15T08:35:00Z',
    updatedAt: '2024-01-15T08:35:00Z',
    category: 'Data Exfiltration',
    timeline: [
      { id: 'tl1', timestamp: '2024-01-15T08:30:00Z', type: 'ALERT', description: 'Public S3 bucket detected', actor: 'System' },
      { id: 'tl2', timestamp: '2024-01-15T08:35:00Z', type: 'INCIDENT_CREATED', description: 'Incident INC-004 created', actor: 'System Auto' },
    ],
    notes: [],
    evidence: ['S3 access logs', 'CloudTrail GetObject events'],
  },
  {
    id: 'INC-005',
    title: 'SSH Infrastructure Misconfiguration',
    description: 'Multiple EC2 instances exposed to internet via SSH on Security Group sg-0a1b2c3d4e5f. Risk of automated scanning and exploitation.',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    assignedTo: 'Marcus Williams',
    relatedAlerts: ['ALT-004'],
    createdAt: '2024-01-15T07:20:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
    category: 'Misconfiguration',
    timeline: [
      { id: 'tl1', timestamp: '2024-01-15T07:15:00Z', type: 'ALERT', description: 'SSH open to internet detected', actor: 'System' },
      { id: 'tl2', timestamp: '2024-01-15T07:20:00Z', type: 'INCIDENT_CREATED', description: 'Incident INC-005 created', actor: 'Marcus Williams' },
    ],
    notes: [],
    evidence: [],
  },
];

// ─── MOCK SECURITY EVENTS ──────────────────────────────────────────────────────
export const mockSecurityEvents: SecurityEvent[] = [
  { id: 'EVT-001', timestamp: '2024-01-15T10:42:00Z', eventType: 'ConsoleLogin', source: 'AWS_CLOUDTRAIL', sourceIp: '185.220.101.47', username: 'terraform-deploy', resource: 'AWS Management Console', region: 'us-east-1', severity: 'HIGH', cloudAccount: 'AWS Production', rawEvent: { eventVersion: '1.08', eventName: 'ConsoleLogin', responseElements: { ConsoleLogin: 'Failure' } }, processed: true },
  { id: 'EVT-002', timestamp: '2024-01-15T10:38:00Z', eventType: 'AttachUserPolicy', source: 'AWS_CLOUDTRAIL', sourceIp: '91.108.4.188', username: 'devops-prod', resource: 'arn:aws:iam::aws:policy/AdministratorAccess', region: 'us-east-1', severity: 'CRITICAL', cloudAccount: 'AWS Production', rawEvent: { eventName: 'AttachUserPolicy', requestParameters: { policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess', userName: 'backdoor-svc' } }, processed: true },
  { id: 'EVT-003', timestamp: '2024-01-15T10:31:00Z', eventType: 'PutBucketAcl', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.5', username: 'devops-automation', resource: 'arn:aws:s3:::acme-prod-backups-2024', region: 'us-east-1', severity: 'HIGH', cloudAccount: 'AWS Production', rawEvent: { eventName: 'PutBucketAcl', requestParameters: { bucketName: 'acme-prod-backups-2024', accessControlPolicy: { grantList: [{ grantee: { type: 'Group', uri: 'AllUsers' } }] } } }, processed: true },
  { id: 'EVT-004', timestamp: '2024-01-15T10:24:00Z', eventType: 'AuthorizeSecurityGroupIngress', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.1.15', username: 'terraform-ci', resource: 'sg-0a1b2c3d4e5f', region: 'us-east-1', severity: 'CRITICAL', cloudAccount: 'AWS Production', rawEvent: { eventName: 'AuthorizeSecurityGroupIngress', requestParameters: { ipPermissions: [{ ipProtocol: 'tcp', fromPort: 22, toPort: 22, ipRanges: ['0.0.0.0/0'] }] } }, processed: true },
  { id: 'EVT-005', timestamp: '2024-01-15T10:18:00Z', eventType: 'CreateUser', source: 'AWS_CLOUDTRAIL', sourceIp: '91.108.4.188', username: 'devops-prod', resource: 'arn:aws:iam::123456789012:user/backdoor-svc', region: 'global', severity: 'HIGH', cloudAccount: 'AWS Production', rawEvent: { eventName: 'CreateUser', requestParameters: { userName: 'backdoor-svc' } }, processed: true },
  { id: 'EVT-006', timestamp: '2024-01-15T09:45:00Z', eventType: 'ConsoleLogin', source: 'AWS_CLOUDTRAIL', sourceIp: '45.33.32.156', username: 'admin@acmecorp.io', resource: 'AWS Management Console', region: 'us-east-1', severity: 'HIGH', cloudAccount: 'AWS Production', rawEvent: { eventName: 'ConsoleLogin', responseElements: { ConsoleLogin: 'Failure' } }, processed: true },
  { id: 'EVT-007', timestamp: '2024-01-15T09:30:00Z', eventType: 'DetachRolePolicy', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.8', username: 'svc-cloudops', resource: 'arn:aws:iam::123456789012:role/ECSTaskRole', region: 'us-east-1', severity: 'MEDIUM', cloudAccount: 'AWS Production', rawEvent: { eventName: 'DetachRolePolicy', requestParameters: { roleName: 'ECSTaskRole', policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess' } }, processed: true },
  { id: 'EVT-008', timestamp: '2024-01-15T09:15:00Z', eventType: 'StopLogging', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.5', username: 'svc-cloudops', resource: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/dev-audit', region: 'us-east-1', severity: 'CRITICAL', cloudAccount: 'AWS Development', rawEvent: { eventName: 'StopLogging', requestParameters: { name: 'dev-audit' } }, processed: true },
  { id: 'EVT-009', timestamp: '2024-01-15T08:55:00Z', eventType: 'ModifyDBInstance', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.20', username: 'dba-automation', resource: 'arn:aws:rds:us-east-1:123456789012:db:prod-postgres', region: 'us-east-1', severity: 'MEDIUM', cloudAccount: 'AWS Production', rawEvent: { eventName: 'ModifyDBInstance', requestParameters: { dBInstanceIdentifier: 'prod-postgres', publiclyAccessible: true } }, processed: true },
  { id: 'EVT-010', timestamp: '2024-01-15T08:30:00Z', eventType: 'RunInstances', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.15', username: 'devops-prod', resource: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0a1b2c3d4e5f', region: 'us-east-1', severity: 'LOW', cloudAccount: 'AWS Production', rawEvent: { eventName: 'RunInstances', requestParameters: { instanceType: 't3.medium', imageId: 'ami-12345678' } }, processed: true },
  { id: 'EVT-011', timestamp: '2024-01-15T08:10:00Z', eventType: 'DeleteAccessKey', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.5', username: 'admin', resource: 'arn:aws:iam::123456789012:user/john.doe', region: 'global', severity: 'MEDIUM', cloudAccount: 'AWS Production', rawEvent: { eventName: 'DeleteAccessKey', requestParameters: { userName: 'john.doe', accessKeyId: 'AKIA...' } }, processed: true },
  { id: 'EVT-012', timestamp: '2024-01-15T07:50:00Z', eventType: 'GetSecretValue', source: 'AWS_CLOUDTRAIL', sourceIp: '10.0.0.50', username: 'lambda-execution-role', resource: 'arn:aws:secretsmanager:us-east-1:123456789012:secret/prod/db-password', region: 'us-east-1', severity: 'INFO', cloudAccount: 'AWS Production', rawEvent: { eventName: 'GetSecretValue', requestParameters: { secretId: 'prod/db-password' } }, processed: true },
];

// ─── MOCK DETECTION RULES ──────────────────────────────────────────────────────
export const mockDetectionRules: DetectionRule[] = [
  {
    id: 'RULE-001',
    name: 'Brute Force Login Detection',
    description: 'Detects multiple consecutive failed login attempts from the same IP address, indicating a possible brute force attack.',
    category: 'BRUTE_FORCE',
    severity: 'HIGH',
    enabled: true,
    trigger: '10+ failed logins from same IP within 5 minutes',
    threshold: 10,
    timeWindow: '5 minutes',
    mitreId: 'T1110',
    mitreTactic: 'Credential Access',
    alertCount: 23,
    lastTriggered: '2024-01-15T09:45:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-002',
    name: 'Privilege Escalation — Admin Policy Attach',
    description: 'Detects when AdministratorAccess or equivalent high-privilege IAM policy is attached to any user or role.',
    category: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'AttachUserPolicy/AttachRolePolicy with AdministratorAccess policy ARN',
    mitreId: 'T1098',
    mitreTactic: 'Persistence',
    alertCount: 7,
    lastTriggered: '2024-01-15T10:38:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-003',
    name: 'Public SSH Access Detection',
    description: 'Detects Security Group rules that allow inbound TCP port 22 (SSH) from 0.0.0.0/0 or ::/0, exposing instances to the internet.',
    category: 'NETWORK_EXPOSURE',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'Security Group rule: TCP 22 from 0.0.0.0/0 or ::/0',
    mitreId: 'T1190',
    mitreTactic: 'Initial Access',
    alertCount: 5,
    lastTriggered: '2024-01-15T07:15:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-004',
    name: 'Public S3 Bucket Detection',
    description: 'Detects S3 buckets with public read or public read-write ACL permissions, or overly permissive bucket policies.',
    category: 'DATA_EXPOSURE',
    severity: 'HIGH',
    enabled: true,
    trigger: 'S3 bucket ACL set to public-read or public-read-write',
    mitreId: 'T1530',
    mitreTactic: 'Collection',
    alertCount: 11,
    lastTriggered: '2024-01-15T08:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-005',
    name: 'Database Port Exposure Detection',
    description: 'Detects Security Group rules that expose database ports (3306, 5432, 27017, 1433) to the internet.',
    category: 'NETWORK_EXPOSURE',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'TCP 3306/5432/27017/1433 from 0.0.0.0/0',
    mitreId: 'T1190',
    mitreTactic: 'Initial Access',
    alertCount: 3,
    lastTriggered: '2024-01-15T11:02:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-006',
    name: 'AWS Root Account Usage',
    description: 'Detects any login or API activity using the AWS root account. Root account usage should be avoided per AWS best practices.',
    category: 'PRIVILEGE_ABUSE',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'Any ConsoleLogin or API call from root account',
    mitreId: 'T1078.004',
    mitreTactic: 'Defense Evasion',
    alertCount: 2,
    lastTriggered: '2024-01-14T22:11:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-007',
    name: 'CloudTrail Logging Disabled',
    description: 'Detects when CloudTrail logging is stopped or trails are deleted. This is a common defense evasion technique used by attackers.',
    category: 'DEFENSE_EVASION',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'StopLogging or DeleteTrail API call',
    mitreId: 'T1562.008',
    mitreTactic: 'Defense Evasion',
    alertCount: 1,
    lastTriggered: '2024-01-12T15:20:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-008',
    name: 'Suspicious IAM User Creation',
    description: 'Detects when a new IAM user is created and immediately granted administrative privileges within a short time window.',
    category: 'SUSPICIOUS_IAM',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'CreateUser followed by AttachUserPolicy(AdministratorAccess) within 15 minutes',
    timeWindow: '15 minutes',
    mitreId: 'T1136',
    mitreTactic: 'Persistence',
    alertCount: 4,
    lastTriggered: '2024-01-15T06:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-009',
    name: 'IAM Access Key Not Rotated',
    description: 'Detects IAM access keys that have not been rotated for more than 90 days, violating credential hygiene best practices.',
    category: 'CREDENTIAL_HYGIENE',
    severity: 'MEDIUM',
    enabled: true,
    trigger: 'Active access key older than 90 days',
    threshold: 90,
    mitreId: 'T1098',
    mitreTactic: 'Persistence',
    alertCount: 8,
    lastTriggered: '2024-01-13T06:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-010',
    name: 'RDP Port Open to Internet',
    description: 'Detects Security Group rules that allow inbound TCP port 3389 (RDP) from 0.0.0.0/0, exposing Windows instances to attack.',
    category: 'NETWORK_EXPOSURE',
    severity: 'CRITICAL',
    enabled: true,
    trigger: 'Security Group rule: TCP 3389 from 0.0.0.0/0 or ::/0',
    mitreId: 'T1190',
    mitreTactic: 'Initial Access',
    alertCount: 1,
    lastTriggered: '2024-01-12T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'RULE-011',
    name: 'Multi-Region Unusual Activity',
    description: 'Detects when an IAM user or role performs API calls across more than 3 AWS regions within a 1-hour window.',
    category: 'ANOMALY',
    severity: 'MEDIUM',
    enabled: false,
    trigger: 'API calls in 3+ regions within 1 hour from same principal',
    threshold: 3,
    timeWindow: '1 hour',
    mitreId: 'T1078',
    mitreTactic: 'Valid Accounts',
    alertCount: 6,
    lastTriggered: '2024-01-14T14:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'RULE-012',
    name: 'IAM User Without MFA',
    description: 'Detects IAM users with console access that do not have MFA (Multi-Factor Authentication) enabled.',
    category: 'CONFIGURATION_WEAKNESS',
    severity: 'HIGH',
    enabled: true,
    trigger: 'IAM user with console access and MFA disabled',
    mitreId: 'T1556',
    mitreTactic: 'Credential Access',
    alertCount: 15,
    lastTriggered: '2024-01-15T06:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// ─── MOCK SECURITY FINDINGS ────────────────────────────────────────────────────
export const mockFindings: SecurityFinding[] = [
  { id: 'FIND-001', title: 'SSH Port Open to 0.0.0.0/0', description: 'Security Group sg-0a1b2c3d4e5f allows unrestricted inbound access on TCP port 22 from all IPv4 addresses.', severity: 'CRITICAL', category: 'NETWORK', status: 'OPEN', resource: 'sg-0a1b2c3d4e5f', region: 'us-east-1', cloudAccount: 'AWS Production', recommendation: 'Remove the inbound rule allowing 0.0.0.0/0 on port 22. Restrict SSH access to specific IP ranges or use AWS Systems Manager Session Manager instead.', riskScore: 95, detectedAt: '2024-01-15T07:15:00Z', compliance: ['CIS AWS 4.1', 'NIST AC-17'] },
  { id: 'FIND-002', title: 'RDP Port Open to 0.0.0.0/0', description: 'Security Group sg-windows-prod allows unrestricted inbound access on TCP port 3389 (RDP).', severity: 'CRITICAL', category: 'NETWORK', status: 'OPEN', resource: 'sg-windows-prod', region: 'us-east-1', cloudAccount: 'AWS Production', recommendation: 'Remove inbound rule for port 3389 from 0.0.0.0/0. Use RDP only through a bastion host or VPN.', riskScore: 93, detectedAt: '2024-01-12T10:00:00Z', compliance: ['CIS AWS 4.2'] },
  { id: 'FIND-003', title: 'PostgreSQL Port Exposed to Internet', description: 'Security Group allows TCP 5432 (PostgreSQL) from 0.0.0.0/0. Production database directly accessible from internet.', severity: 'CRITICAL', category: 'NETWORK', status: 'OPEN', resource: 'sg-database-prod', region: 'us-east-1', cloudAccount: 'AWS Production', recommendation: 'Immediately remove the inbound rule. Database should only be accessible from application subnet security groups.', riskScore: 97, detectedAt: '2024-01-15T11:02:00Z', compliance: ['CIS AWS 4.1', 'PCI-DSS 1.3'] },
  { id: 'FIND-004', title: 'Public S3 Bucket — Production Backups', description: 'S3 bucket acme-prod-backups-2024 has a public ACL allowing anyone to read its contents.', severity: 'HIGH', category: 'STORAGE', status: 'OPEN', resource: 'acme-prod-backups-2024', region: 'us-east-1', cloudAccount: 'AWS Production', recommendation: 'Remove public ACL. Enable S3 Block Public Access. Review bucket contents for sensitive data exposure.', riskScore: 88, detectedAt: '2024-01-15T08:30:00Z', compliance: ['CIS AWS 2.1', 'NIST SI-12'] },
  { id: 'FIND-005', title: 'IAM User with AdministratorAccess', description: 'IAM user jsmith has AdministratorAccess policy attached directly. This grants unrestricted access to all AWS services.', severity: 'CRITICAL', category: 'IAM', status: 'OPEN', resource: 'arn:aws:iam::123456789012:user/jsmith', region: 'global', cloudAccount: 'AWS Production', recommendation: 'Remove AdministratorAccess policy. Grant only the minimum permissions required. Use IAM roles instead of user-level policies.', riskScore: 92, detectedAt: '2024-01-15T10:24:00Z', compliance: ['CIS AWS 1.16', 'NIST AC-6'] },
  { id: 'FIND-006', title: 'MFA Not Enabled for Console Users', description: '3 IAM users with console access do not have MFA enabled: jsmith, david.kim, sarah.ops.', severity: 'HIGH', category: 'IAM', status: 'ACKNOWLEDGED', resource: 'Multiple IAM Users', region: 'global', cloudAccount: 'AWS Production', recommendation: 'Enable MFA for all IAM users with console access. Enforce MFA via IAM policy.', riskScore: 78, detectedAt: '2024-01-13T06:00:00Z', compliance: ['CIS AWS 1.10', 'NIST IA-5'] },
  { id: 'FIND-007', title: 'Access Key Not Rotated — 120 Days', description: 'IAM user maria.santos has an active access key that has not been rotated for 120 days.', severity: 'MEDIUM', category: 'IAM', status: 'ACKNOWLEDGED', resource: 'arn:aws:iam::123456789012:user/maria.santos', region: 'global', cloudAccount: 'AWS Production', recommendation: 'Rotate access key immediately. Implement a 90-day rotation policy. Consider using IAM roles instead.', riskScore: 62, detectedAt: '2024-01-13T06:00:00Z', compliance: ['CIS AWS 1.14'] },
  { id: 'FIND-008', title: 'CloudTrail Not Enabled in All Regions', description: 'CloudTrail is not configured to log events in eu-central-1 and ap-southeast-2 regions.', severity: 'HIGH', category: 'LOGGING', status: 'OPEN', resource: 'AWS CloudTrail', region: 'eu-central-1, ap-southeast-2', cloudAccount: 'AWS Production', recommendation: 'Enable CloudTrail in all active regions. Use an organization trail for comprehensive coverage.', riskScore: 75, detectedAt: '2024-01-10T12:00:00Z', compliance: ['CIS AWS 3.1', 'NIST AU-2'] },
  { id: 'FIND-009', title: 'S3 Bucket Versioning Disabled', description: 'S3 bucket acme-app-assets-cdn does not have versioning enabled. Cannot recover from accidental deletion.', severity: 'LOW', category: 'STORAGE', status: 'OPEN', resource: 'acme-app-assets-cdn', region: 'us-east-1', cloudAccount: 'AWS Development', recommendation: 'Enable versioning on S3 buckets containing important data.', riskScore: 30, detectedAt: '2024-01-10T12:00:00Z', compliance: ['CIS AWS 2.2'] },
  { id: 'FIND-010', title: 'EC2 Instance with Public IP', description: 'EC2 instance i-0abc123 (prod-web-01) has a public IP address assigned and is in a public subnet without clear security justification.', severity: 'MEDIUM', category: 'COMPUTE', status: 'OPEN', resource: 'i-0abc123 (prod-web-01)', region: 'us-east-1', cloudAccount: 'AWS Production', recommendation: 'Move instance behind load balancer. Use NAT gateway for outbound. Remove direct public IP if not required.', riskScore: 55, detectedAt: '2024-01-14T06:00:00Z', compliance: ['NIST SC-7'] },
];

// ─── MOCK IAM FINDINGS ─────────────────────────────────────────────────────────
export const mockIAMFindings: IAMFinding[] = [
  { id: 'IAM-001', title: 'User Has AdministratorAccess Policy', description: 'IAM user jsmith has the AdministratorAccess managed policy attached directly, granting unrestricted access to all AWS services and resources.', severity: 'CRITICAL', affectedUser: 'jsmith', recommendation: 'Remove the AdministratorAccess policy. Create a custom policy with only the permissions required for jsmith\'s role.', status: 'OPEN', detectedAt: '2024-01-15T10:24:00Z', category: 'Excessive Permissions' },
  { id: 'IAM-002', title: 'Inactive IAM User — No Activity for 90 Days', description: 'IAM user david.kim has not performed any AWS API calls for the past 90 days. Account may be orphaned.', severity: 'HIGH', affectedUser: 'david.kim', recommendation: 'Deactivate or remove the IAM user. If needed, review and confirm required access.', status: 'OPEN', detectedAt: '2024-01-15T06:00:00Z', category: 'Unused Credentials' },
  { id: 'IAM-003', title: 'Access Key Not Rotated (120+ Days)', description: 'IAM user maria.santos has an active access key that was created 120 days ago and has not been rotated.', severity: 'MEDIUM', affectedUser: 'maria.santos', recommendation: 'Rotate the access key immediately. Enforce a 90-day rotation policy. Use IAM roles where possible.', status: 'ACKNOWLEDGED', detectedAt: '2024-01-13T06:00:00Z', category: 'Key Rotation' },
  { id: 'IAM-004', title: 'MFA Not Enabled for Console Access', description: 'IAM user jsmith has console access enabled but does not have MFA configured. Single-factor authentication increases compromise risk.', severity: 'HIGH', affectedUser: 'jsmith', recommendation: 'Enforce MFA for all IAM users with console access using an IAM policy condition.', status: 'OPEN', detectedAt: '2024-01-13T06:00:00Z', category: 'MFA' },
  { id: 'IAM-005', title: 'IAM Role with Wildcard Permissions', description: 'IAM role ECSDataRole has an inline policy with Action: "*" and Resource: "*". This grants full admin access via the role.', severity: 'CRITICAL', affectedUser: 'ECSDataRole (Role)', recommendation: 'Replace wildcard permissions with specific actions and resources required for the ECS task.', status: 'OPEN', detectedAt: '2024-01-12T12:00:00Z', category: 'Excessive Permissions' },
  { id: 'IAM-006', title: 'Root Account No MFA', description: 'The AWS root account does not have MFA enabled. Root account access without MFA is a critical security risk.', severity: 'CRITICAL', affectedUser: 'root', recommendation: 'Enable hardware MFA or virtual MFA on the root account immediately. Lock root account credentials in a vault.', status: 'OPEN', detectedAt: '2024-01-10T06:00:00Z', category: 'MFA' },
];

// ─── MOCK CLOUD ACCOUNTS ───────────────────────────────────────────────────────
export const mockCloudAccounts: CloudAccount[] = [
  { id: 'ACC-001', name: 'AWS Production', provider: 'AWS', accountId: '123456789012', region: 'us-east-1', status: 'CONNECTED', lastSync: '2024-01-15T11:00:00Z', securityScore: 72, resourceCount: 156, criticalFindings: 4, highFindings: 7, createdAt: '2023-06-01T00:00:00Z' },
  { id: 'ACC-002', name: 'AWS Development', provider: 'AWS', accountId: '987654321098', region: 'eu-central-1', status: 'CONNECTED', lastSync: '2024-01-15T10:30:00Z', securityScore: 88, resourceCount: 43, criticalFindings: 0, highFindings: 2, createdAt: '2023-07-15T00:00:00Z' },
  { id: 'ACC-003', name: 'AWS Staging', provider: 'AWS', accountId: '456789012345', region: 'us-west-2', status: 'SYNCING', lastSync: '2024-01-15T08:00:00Z', securityScore: 81, resourceCount: 67, criticalFindings: 1, highFindings: 3, createdAt: '2023-09-01T00:00:00Z' },
];

// ─── MOCK USERS ────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'USR-001', name: 'Alex Rodriguez', email: 'alex.rodriguez@acmecorp.io', role: 'ADMIN', status: 'ACTIVE', lastLogin: '2024-01-15T10:00:00Z', createdAt: '2023-01-10T00:00:00Z', department: 'Security Engineering', mfaEnabled: true },
  { id: 'USR-002', name: 'Sarah Chen', email: 'sarah.chen@acmecorp.io', role: 'SOC_ANALYST', status: 'ACTIVE', lastLogin: '2024-01-15T09:30:00Z', createdAt: '2023-03-15T00:00:00Z', department: 'SOC Team', mfaEnabled: true },
  { id: 'USR-003', name: 'Marcus Williams', email: 'marcus.williams@acmecorp.io', role: 'SOC_ANALYST', status: 'ACTIVE', lastLogin: '2024-01-15T08:15:00Z', createdAt: '2023-05-20T00:00:00Z', department: 'SOC Team', mfaEnabled: true },
  { id: 'USR-004', name: 'Priya Patel', email: 'priya.patel@acmecorp.io', role: 'VIEWER', status: 'ACTIVE', lastLogin: '2024-01-14T16:00:00Z', createdAt: '2023-08-01T00:00:00Z', department: 'Management', mfaEnabled: false },
  { id: 'USR-005', name: 'James Thornton', email: 'james.thornton@acmecorp.io', role: 'SOC_ANALYST', status: 'INACTIVE', lastLogin: '2023-12-01T12:00:00Z', createdAt: '2023-02-28T00:00:00Z', department: 'SOC Team', mfaEnabled: true },
  { id: 'USR-006', name: 'Nina Okafor', email: 'nina.okafor@acmecorp.io', role: 'VIEWER', status: 'ACTIVE', lastLogin: '2024-01-15T07:45:00Z', createdAt: '2023-11-15T00:00:00Z', department: 'Compliance', mfaEnabled: false },
];

// ─── MOCK AUDIT LOGS ───────────────────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'AUD-001', timestamp: '2024-01-15T11:45:00Z', user: 'Sarah Chen', userRole: 'SOC_ANALYST', action: 'ALERT_STATUS_CHANGED', resource: 'ALT-001', resourceType: 'Alert', ip: '10.0.0.25', result: 'SUCCESS', metadata: { oldStatus: 'NEW', newStatus: 'INVESTIGATING' } },
  { id: 'AUD-002', timestamp: '2024-01-15T11:10:00Z', user: 'Marcus Williams', userRole: 'SOC_ANALYST', action: 'INCIDENT_CREATED', resource: 'INC-002', resourceType: 'Incident', ip: '10.0.0.30', result: 'SUCCESS' },
  { id: 'AUD-003', timestamp: '2024-01-15T11:00:00Z', user: 'Alex Rodriguez', userRole: 'ADMIN', action: 'IAM_USER_DISABLED', resource: 'arn:aws:iam::123456789012:user/backdoor-svc', resourceType: 'IAM User', ip: '10.0.0.5', result: 'SUCCESS' },
  { id: 'AUD-004', timestamp: '2024-01-15T10:30:00Z', user: 'Sarah Chen', userRole: 'SOC_ANALYST', action: 'INCIDENT_CREATED', resource: 'INC-001', resourceType: 'Incident', ip: '10.0.0.25', result: 'SUCCESS' },
  { id: 'AUD-005', timestamp: '2024-01-15T10:00:00Z', user: 'Alex Rodriguez', userRole: 'ADMIN', action: 'USER_LOGIN', resource: 'CloudGuard', resourceType: 'System', ip: '10.0.0.5', result: 'SUCCESS' },
  { id: 'AUD-006', timestamp: '2024-01-15T09:30:00Z', user: 'Sarah Chen', userRole: 'SOC_ANALYST', action: 'USER_LOGIN', resource: 'CloudGuard', resourceType: 'System', ip: '10.0.0.25', result: 'SUCCESS' },
  { id: 'AUD-007', timestamp: '2024-01-15T09:05:00Z', user: 'Marcus Williams', userRole: 'SOC_ANALYST', action: 'ALERT_COMMENT_ADDED', resource: 'ALT-004', resourceType: 'Alert', ip: '10.0.0.30', result: 'SUCCESS' },
  { id: 'AUD-008', timestamp: '2024-01-15T09:00:00Z', user: 'Marcus Williams', userRole: 'SOC_ANALYST', action: 'ALERT_STATUS_CHANGED', resource: 'ALT-004', resourceType: 'Alert', ip: '10.0.0.30', result: 'SUCCESS', metadata: { oldStatus: 'NEW', newStatus: 'ACKNOWLEDGED' } },
  { id: 'AUD-009', timestamp: '2024-01-15T08:15:00Z', user: 'Marcus Williams', userRole: 'SOC_ANALYST', action: 'USER_LOGIN', resource: 'CloudGuard', resourceType: 'System', ip: '10.0.0.30', result: 'SUCCESS' },
  { id: 'AUD-010', timestamp: '2024-01-14T17:00:00Z', user: 'Alex Rodriguez', userRole: 'ADMIN', action: 'DETECTION_RULE_TOGGLED', resource: 'RULE-011', resourceType: 'DetectionRule', ip: '10.0.0.5', result: 'SUCCESS', metadata: { ruleName: 'Multi-Region Unusual Activity', enabled: false } },
  { id: 'AUD-011', timestamp: '2024-01-14T15:30:00Z', user: 'Sarah Chen', userRole: 'SOC_ANALYST', action: 'ALERT_STATUS_CHANGED', resource: 'ALT-010', resourceType: 'Alert', ip: '10.0.0.25', result: 'SUCCESS', metadata: { oldStatus: 'INVESTIGATING', newStatus: 'FALSE_POSITIVE' } },
  { id: 'AUD-012', timestamp: '2024-01-14T14:00:00Z', user: 'Alex Rodriguez', userRole: 'ADMIN', action: 'CLOUD_ACCOUNT_ADDED', resource: 'ACC-003', resourceType: 'CloudAccount', ip: '10.0.0.5', result: 'SUCCESS', metadata: { accountName: 'AWS Staging' } },
  { id: 'AUD-013', timestamp: '2024-01-14T10:00:00Z', user: 'Unknown', userRole: '-', action: 'USER_LOGIN_FAILED', resource: 'CloudGuard', resourceType: 'System', ip: '91.108.4.188', result: 'FAILURE' },
  { id: 'AUD-014', timestamp: '2024-01-13T12:00:00Z', user: 'Alex Rodriguez', userRole: 'ADMIN', action: 'USER_CREATED', resource: 'USR-006', resourceType: 'User', ip: '10.0.0.5', result: 'SUCCESS', metadata: { userName: 'Nina Okafor', role: 'VIEWER' } },
];

// ─── DASHBOARD CHART DATA ──────────────────────────────────────────────────────
export const alertsTrendData = [
  { date: 'Jan 9', critical: 1, high: 3, medium: 2, low: 5 },
  { date: 'Jan 10', critical: 2, high: 4, medium: 3, low: 3 },
  { date: 'Jan 11', critical: 0, high: 2, medium: 5, low: 4 },
  { date: 'Jan 12', critical: 3, high: 5, medium: 2, low: 2 },
  { date: 'Jan 13', critical: 1, high: 3, medium: 4, low: 6 },
  { date: 'Jan 14', critical: 2, high: 6, medium: 3, low: 3 },
  { date: 'Jan 15', critical: 4, high: 7, medium: 5, low: 4 },
];

export const severityDistribution = [
  { name: 'Critical', value: 4, color: '#ef4444' },
  { name: 'High', value: 12, color: '#f97316' },
  { name: 'Medium', value: 8, color: '#eab308' },
  { name: 'Low', value: 5, color: '#22c55e' },
];

export const incidentsByCategory = [
  { category: 'Account Compromise', count: 2 },
  { category: 'Data Exposure', count: 3 },
  { category: 'Brute Force', count: 4 },
  { category: 'Misconfiguration', count: 5 },
  { category: 'Privilege Escalation', count: 3 },
];

export const securityScoreHistory = [
  { date: 'Jan 9', score: 79 },
  { date: 'Jan 10', score: 81 },
  { date: 'Jan 11', score: 83 },
  { date: 'Jan 12', score: 80 },
  { date: 'Jan 13', score: 78 },
  { date: 'Jan 14', score: 80 },
  { date: 'Jan 15', score: 82 },
];

export const categoryScores = {
  iam: 74,
  network: 68,
  storage: 88,
  logging: 92,
  compute: 80,
};
