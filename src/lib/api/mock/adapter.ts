import {
  alertsTrendData,
  categoryScores as mockCategoryScores,
  mockAlerts,
  mockAuditLogs,
  mockCloudAccounts,
  mockDetectionRules,
  mockFindings,
  mockIAMFindings,
  mockIncidents,
  mockSecurityEvents,
  mockUsers,
  severityDistribution,
} from '@/lib/mock-data';

import {
  AlertDto,
  AuditLogDto,
  AuthUserDto,
  CloudAccountDto,
  DashboardSummaryDto,
  DetectionRuleDto,
  IamFindingDto,
  IncidentDto,
  PaginatedResponse,
  QueryParams,
  SecurityEventDto,
  SecurityFindingDto,
  SecurityReportDto,
  UserDto,
} from '../types';

/**
 * Development Mock Adapter
 * Provides simulated API responses from prototype mock data
 * Useful for local development fallback prior to full REST API route binding.
 */

export function paginateArray<T>(items: T[], params?: QueryParams): PaginatedResponse<T> {
  const page = Number(params?.page || 1);
  const size = Number(params?.size || 20);

  let filtered = [...items];

  // Search filter
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((item: any) =>
      JSON.stringify(item).toLowerCase().includes(q)
    );
  }

  // Severity filter
  if (params?.severity) {
    filtered = filtered.filter((item: any) => item.severity === params.severity);
  }

  // Status filter
  if (params?.status) {
    filtered = filtered.filter((item: any) => item.status === params.status);
  }

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const startIndex = (page - 1) * size;
  const pageItems = filtered.slice(startIndex, startIndex + size);

  return {
    items: pageItems,
    page,
    size,
    totalElements,
    totalPages,
  };
}

export const mockAdapter = {
  getAuthUser(): AuthUserDto {
    return {
      id: 'usr-001',
      username: 'sarah.chen',
      email: 'sarah.chen@acmecorp.io',
      displayName: 'Sarah Chen',
      department: 'SOC Operations',
      status: 'ACTIVE',
      mfaEnabled: true,
      roles: ['ADMIN'],
      permissions: ['alerts:read', 'alerts:write', 'incidents:read', 'incidents:write'],
    };
  },

  getAlerts(params?: QueryParams): PaginatedResponse<AlertDto> {
    const mapped: AlertDto[] = mockAlerts.map((a: any) => ({
      id: a.id,
      alertNumber: a.id.replace('alt-', 'ALT-').replace('ALT-', 'ALT-000'),
      title: a.title,
      description: a.description,
      severity: a.severity as any,
      status: a.status as any,
      source: a.source === 'Detection Engine' ? 'DETECTION_ENGINE' : 'CONFIG_SCANNER',
      detectionRuleId: null,
      triggerEventId: null,
      cloudAccountId: null,
      sourceIp: a.sourceIp,
      userIdentity: a.username,
      targetResource: a.resource,
      region: a.region,
      mitreTechniqueId: a.mitreId,
      mitreTactic: a.mitreTactic,
      assignedTo: a.assignedTo || null,
      assignedToName: a.assignedTo || null,
      resolvedAt: a.status === 'RESOLVED' ? new Date().toISOString() : null,
      resolvedBy: null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    return paginateArray(mapped, params);
  },

  getIncidents(params?: QueryParams): PaginatedResponse<IncidentDto> {
    const mapped: IncidentDto[] = mockIncidents.map((inc: any) => ({
      id: inc.id,
      incidentNumber: inc.id,
      title: inc.title,
      description: inc.description,
      severity: inc.severity as any,
      status: inc.status as any,
      category: inc.category,
      assignedTo: inc.assignedTo,
      assignedToName: inc.assignedTo,
      createdBy: 'Sarah Chen',
      createdByName: 'Sarah Chen',
      resolvedAt: inc.resolvedAt || null,
      closedAt: null,
      createdAt: inc.createdAt,
      updatedAt: inc.updatedAt,
      alertCount: inc.relatedAlerts?.length || 0,
    }));
    return paginateArray(mapped, params);
  },

  getEvents(params?: QueryParams): PaginatedResponse<SecurityEventDto> {
    const mapped: SecurityEventDto[] = mockSecurityEvents.map((evt: any) => ({
      id: evt.id,
      rawLogId: null,
      cloudAccountId: evt.cloudAccount,
      cloudAccountName: evt.cloudAccount,
      eventTime: evt.timestamp,
      eventType: evt.eventType,
      eventSource: evt.source,
      sourceIp: evt.sourceIp,
      userIdentity: evt.username,
      targetResource: evt.resource,
      region: evt.region,
      severity: evt.severity as any,
      requestParameters: evt.rawEvent || null,
      responseElements: null,
      isError: evt.severity === 'CRITICAL' || evt.severity === 'HIGH',
      errorCode: null,
      errorMessage: null,
      processedByEngine: evt.processed,
      createdAt: evt.timestamp,
    }));
    return paginateArray(mapped, params);
  },

  getCloudAccounts(params?: QueryParams): PaginatedResponse<CloudAccountDto> {
    const mapped: CloudAccountDto[] = mockCloudAccounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      provider: 'AWS',
      accountId: acc.accountId,
      externalId: 'ext-' + acc.id,
      roleArn: `arn:aws:iam::${acc.accountId}:role/CloudGuardRole`,
      primaryRegion: acc.region,
      monitoredRegions: acc.region,
      status: acc.status as any,
      lastSyncAt: acc.lastSync,
      syncError: null,
      createdAt: acc.createdAt || new Date().toISOString(),
      updatedAt: acc.lastSync || new Date().toISOString(),
    }));
    return paginateArray(mapped, params);
  },

  getDetectionRules(params?: QueryParams): PaginatedResponse<DetectionRuleDto> {
    const mapped: DetectionRuleDto[] = mockDetectionRules.map((rule: any) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      ruleType: 'THRESHOLD',
      category: rule.category,
      severity: rule.severity as any,
      enabled: rule.enabled,
      logicDefinition: { condition: 'threshold > 5' },
      triggerDescription: rule.description,
      mitreTechniqueId: rule.mitreId,
      mitreTactic: rule.mitreTactic,
      cooldownMinutes: 15,
      alertCount: rule.alertCount,
      lastTriggeredAt: rule.lastTriggered,
      createdBy: 'Sarah Chen',
      createdByName: 'Sarah Chen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return paginateArray(mapped, params);
  },

  getSecurityFindings(params?: QueryParams): PaginatedResponse<SecurityFindingDto> {
    const mapped: SecurityFindingDto[] = mockFindings.map((f: any) => ({
      id: f.id,
      findingNumber: f.id.replace('FIND-', 'FS-'),
      title: f.title,
      description: f.description,
      severity: f.severity as any,
      category: f.category as any,
      status: f.status as any,
      cloudAccountId: f.cloudAccount,
      resourceId: f.resource,
      region: f.region,
      recommendation: f.recommendation,
      riskScore: f.severity === 'CRITICAL' ? 95 : f.severity === 'HIGH' ? 80 : 50,
      complianceFrameworks: ['CIS AWS 1.4', 'NIST SP 800-53'],
      detectedAt: f.detectedAt,
      remediatedAt: null,
      suppressedBy: null,
      createdAt: f.detectedAt,
      updatedAt: f.detectedAt,
    }));
    return paginateArray(mapped, params);
  },

  getIamFindings(params?: QueryParams): PaginatedResponse<IamFindingDto> {
    const mapped: IamFindingDto[] = mockIAMFindings.map((f: any) => ({
      id: f.id,
      findingNumber: f.id,
      title: f.title,
      description: f.description,
      severity: f.severity as any,
      category: f.category,
      status: f.status as any,
      cloudAccountId: 'AWS Production',
      affectedPrincipal: f.affectedUser,
      principalType: f.affectedUser.includes('Role') ? 'ROLE' : 'USER',
      recommendation: f.recommendation,
      detectedAt: f.detectedAt,
      remediatedAt: null,
      createdAt: f.detectedAt,
      updatedAt: f.detectedAt,
    }));
    return paginateArray(mapped, params);
  },

  getDashboardSummary(): DashboardSummaryDto {
    return {
      overallSecurityScore: 82,
      categoryScores: mockCategoryScores,
      metrics: {
        totalAlerts: 28,
        criticalAlerts: 4,
        highAlerts: 12,
        openIncidents: 5,
        investigatingIncidents: 2,
        criticalFindings: 6,
        openFindings: 18,
        activeCloudAccounts: 3,
      },
      alertsTrend: alertsTrendData,
      severityDistribution: severityDistribution,
      topRecommendations: [
        { priority: 'CRITICAL', text: 'Revoke AdministratorAccess policy from user jsmith', effort: 'Low' },
        { priority: 'CRITICAL', text: 'Remove public SSH (port 22) access from Security Groups', effort: 'Medium' },
        { priority: 'HIGH', text: 'Enable Block Public Access on bucket acme-prod-backups-2024', effort: 'Low' },
      ],
    };
  },

  getUsers(params?: QueryParams): PaginatedResponse<UserDto> {
    const mapped: UserDto[] = mockUsers.map((u: any) => ({
      id: u.id,
      username: u.email.split('@')[0],
      email: u.email,
      displayName: u.name,
      department: u.department,
      status: u.status as any,
      mfaEnabled: u.mfaEnabled,
      lastLoginAt: u.lastLogin,
      lastLoginIp: '192.168.1.10',
      createdAt: u.createdAt,
      roles: [u.role],
    }));
    return paginateArray(mapped, params);
  },

  getAuditLogs(params?: QueryParams): PaginatedResponse<AuditLogDto> {
    const mapped: AuditLogDto[] = mockAuditLogs.map((log: any) => ({
      id: log.id,
      userId: null,
      userDisplayName: log.user,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resource,
      ipAddress: log.ip,
      result: log.result === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
      details: log.metadata ? log.metadata : null,
      createdAt: log.timestamp,
    }));
    return paginateArray(mapped, params);
  },

  getReport(): SecurityReportDto {
    return {
      id: 'REP-2024-001',
      title: 'Cloud Security Posture Assessment Report',
      periodStart: '2024-01-01T00:00:00Z',
      periodEnd: '2024-01-15T23:59:59Z',
      overallScore: 82,
      categoryScores: mockCategoryScores,
      summary: {
        totalAlerts: 28,
        resolvedAlerts: 14,
        openIncidents: 5,
        resolvedIncidents: 8,
        criticalFindings: 6,
        openFindings: 18,
      },
      topRecommendations: [
        { priority: 'CRITICAL', text: 'Revoke AdministratorAccess policy from user jsmith', effort: 'Low' },
        { priority: 'CRITICAL', text: 'Remove public SSH (port 22) access from Security Groups', effort: 'Medium' },
      ],
      generatedAt: new Date().toISOString(),
    };
  },
};
