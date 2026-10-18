import { httpClient } from './client';
import { AuditLogDto, PaginatedResponse, QueryParams } from './types';

export const auditApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<AuditLogDto>> {
    return httpClient.get<PaginatedResponse<AuditLogDto>>('/audit-logs', params);
  },
};
