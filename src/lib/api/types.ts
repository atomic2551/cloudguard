/**
 * CloudGuard SOC Platform — API Contract Types & Data Transfer Objects (DTOs)
 * Compatible with Spring Boot 3 / Spring Security REST Backend Contract
 */

// ==========================================
// 1. STANDARDIZED RESPONSE & ERROR WRAPPERS
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface QueryParams {
  page?: number;
  size?: number;
  status?: string;
  severity?: string;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: string;
}

// ==========================================
// 2. AUTHENTICATION DTOs
// ==========================================

export interface AuthUserDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  department: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
}

export interface LoginRequestDto {
  username: string;
  password?: string;
}

export interface LoginResponseDto {
  token: string;
  tokenType: string;
  user: AuthUserDto;
}

// ==========================================
// 3. ALERTS DTOs
// ==========================================

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
export type AlertSource = 'DETECTION_ENGINE' | 'CONFIG_SCANNER' | 'IAM_SCANNER' | 'MANUAL';

export interface AlertDto {
  id: string;
  alertNumber: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  source: AlertSource;
  detectionRuleId: string | null;
  triggerEventId: string | null;
  cloudAccountId: string | null;
  sourceIp: string | null;
  userIdentity: string | null;
  targetResource: string | null;
  region: string | null;
  mitreTechniqueId: string | null;
  mitreTactic: string | null;
  assignedTo: string | null;
  assignedToName?: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertCommentDto {
  id: string;
  alertId: string;
  authorId: string | null;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AlertTimelineDto {
  id: string;
  alertId: string;
  eventTime: string;
  eventType: string;
  description: string;
  severity: string | null;
  actor: string | null;
  createdAt: string;
}

export interface UpdateAlertStatusDto {
  status: AlertStatus;
  comment?: string;
}

// ==========================================
// 4. INCIDENTS DTOs
// ==========================================

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';

export interface IncidentDto {
  id: string;
  incidentNumber: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  status: IncidentStatus;
  category: string | null;
  assignedTo: string | null;
  assignedToName?: string | null;
  createdBy: string | null;
  createdByName?: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  alertCount?: number;
  alerts?: AlertDto[];
}

export interface CreateIncidentDto {
  title: string;
  description?: string;
  severity: AlertSeverity;
  category?: string;
  alertIds?: string[];
  assignedTo?: string;
}

export interface UpdateIncidentDto {
  title?: string;
  description?: string;
  severity?: AlertSeverity;
  status?: IncidentStatus;
  category?: string;
  assignedTo?: string;
}

export interface IncidentTimelineDto {
  id: string;
  incidentId: string;
  eventTime: string;
  eventType: 'ALERT' | 'INCIDENT_CREATED' | 'NOTE' | 'ACTION' | 'STATUS_CHANGE' | 'ASSIGNMENT';
  description: string;
  actor: string | null;
  createdAt: string;
}

export interface IncidentNoteDto {
  id: string;
  incidentId: string;
  authorId: string | null;
  authorName: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

// ==========================================
// 5. SECURITY EVENTS & RAW LOGS DTOs
// ==========================================

export interface SecurityEventDto {
  id: string;
  rawLogId: string | null;
  cloudAccountId: string;
  cloudAccountName?: string;
  eventTime: string;
  eventType: string;
  eventSource: string;
  sourceIp: string | null;
  userIdentity: string | null;
  targetResource: string | null;
  region: string | null;
  severity: AlertSeverity | 'INFO';
  requestParameters: Record<string, any> | null;
  responseElements: Record<string, any> | null;
  isError: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  processedByEngine: boolean;
  createdAt: string;
}

export interface RawLogDto {
  id: string;
  cloudAccountId: string;
  source: 'CLOUDTRAIL' | 'CLOUDWATCH' | 'VPC_FLOW_LOG';
  receivedAt: string;
  rawPayload: Record<string, any>;
  payloadHash: string;
  processed: boolean;
  processedAt: string | null;
  processingError: string | null;
}

// ==========================================
// 6. CLOUD ACCOUNTS & RESOURCES DTOs
// ==========================================

export type CloudProviderType = 'AWS';
export type AccountStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';

export interface CloudAccountDto {
  id: string;
  name: string;
  provider: CloudProviderType;
  accountId: string;
  externalId: string | null;
  roleArn: string | null;
  primaryRegion: string;
  monitoredRegions: string | null;
  status: AccountStatus;
  lastSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCloudAccountDto {
  name: string;
  accountId: string;
  roleArn?: string;
  externalId?: string;
  primaryRegion: string;
  monitoredRegions?: string[];
}

export interface UpdateCloudAccountDto {
  name?: string;
  roleArn?: string;
  externalId?: string;
  primaryRegion?: string;
  monitoredRegions?: string[];
  status?: AccountStatus;
}

export interface CloudResourceDto {
  id: string;
  cloudAccountId: string;
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  region: string;
  configuration: Record<string, any> | null;
  tags: Record<string, any> | null;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
}

// ==========================================
// 7. DETECTION RULES DTOs
// ==========================================

export type RuleType = 'THRESHOLD' | 'PATTERN' | 'SEQUENCE' | 'ANOMALY' | 'CONFIGURATION';

export interface DetectionRuleParameterDto {
  id: string;
  ruleId: string;
  paramKey: string;
  paramValue: string;
  paramType: 'INTEGER' | 'STRING' | 'BOOLEAN';
}

export interface DetectionRuleDto {
  id: string;
  name: string;
  description: string | null;
  ruleType: RuleType;
  category: string;
  severity: AlertSeverity;
  enabled: boolean;
  logicDefinition: Record<string, any>;
  triggerDescription: string;
  mitreTechniqueId: string | null;
  mitreTactic: string | null;
  cooldownMinutes: number;
  alertCount: number;
  lastTriggeredAt: string | null;
  createdBy: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
  parameters?: DetectionRuleParameterDto[];
}

export interface CreateDetectionRuleDto {
  name: string;
  description?: string;
  ruleType: RuleType;
  category: string;
  severity: AlertSeverity;
  enabled?: boolean;
  triggerDescription: string;
  logicDefinition: Record<string, any>;
  mitreTechniqueId?: string;
  mitreTactic?: string;
  cooldownMinutes?: number;
  parameters?: Array<{ paramKey: string; paramValue: string; paramType?: 'INTEGER' | 'STRING' | 'BOOLEAN' }>;
}

export interface UpdateDetectionRuleDto {
  name?: string;
  description?: string;
  severity?: AlertSeverity;
  enabled?: boolean;
  logicDefinition?: Record<string, any>;
  triggerDescription?: string;
  cooldownMinutes?: number;
}

// ==========================================
// 8. SECURITY FINDINGS DTOs (SCANNERS)
// ==========================================

export type FindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATED' | 'SUPPRESSED';
export type FindingCategory = 'IAM' | 'NETWORK' | 'STORAGE' | 'COMPUTE' | 'LOGGING' | 'ENCRYPTION';

export interface SecurityFindingDto {
  id: string;
  findingNumber: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  category: FindingCategory;
  status: FindingStatus;
  cloudAccountId: string;
  resourceId: string;
  region: string | null;
  recommendation: string | null;
  riskScore: number;
  complianceFrameworks: string[] | null;
  detectedAt: string;
  remediatedAt: string | null;
  suppressedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IamFindingDto {
  id: string;
  findingNumber: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  category: string;
  status: FindingStatus;
  cloudAccountId: string;
  affectedPrincipal: string;
  principalType: 'USER' | 'ROLE' | 'GROUP' | 'ROOT';
  recommendation: string | null;
  detectedAt: string;
  remediatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFindingStatusDto {
  status: FindingStatus;
}

// ==========================================
// 9. DASHBOARD DTOs
// ==========================================

export interface DashboardSummaryDto {
  overallSecurityScore: number;
  categoryScores: {
    iam: number;
    network: number;
    storage: number;
    logging: number;
    compute: number;
  };
  metrics: {
    totalAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    openIncidents: number;
    investigatingIncidents: number;
    criticalFindings: number;
    openFindings: number;
    activeCloudAccounts: number;
  };
  alertsTrend: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  severityDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topRecommendations: Array<{
    priority: AlertSeverity;
    text: string;
    effort: 'Low' | 'Medium' | 'High';
  }>;
}

// ==========================================
// 10. USERS DTOs
// ==========================================

export interface UserDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  department: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  roles: string[];
}

export interface CreateUserDto {
  username: string;
  email: string;
  displayName: string;
  department?: string;
  roles: string[];
}

export interface UpdateUserDto {
  displayName?: string;
  department?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  mfaEnabled?: boolean;
  roles?: string[];
}

// ==========================================
// 11. AUDIT LOG DTOs
// ==========================================

export interface AuditLogDto {
  id: string;
  userId: string | null;
  userDisplayName: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  result: 'SUCCESS' | 'FAILURE';
  details: Record<string, any> | null;
  createdAt: string;
}

// ==========================================
// 12. REPORTS DTOs
// ==========================================

export interface SecurityReportDto {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  summary: {
    totalAlerts: number;
    resolvedAlerts: number;
    openIncidents: number;
    resolvedIncidents: number;
    criticalFindings: number;
    openFindings: number;
  };
  topRecommendations: Array<{
    priority: AlertSeverity;
    text: string;
    effort: string;
  }>;
  generatedAt: string;
}
