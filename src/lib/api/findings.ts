import { httpClient } from './client';
import {
  IamFindingDto,
  PaginatedResponse,
  QueryParams,
  SecurityFindingDto,
} from './types';

export const findingsApi = {
  listSecurityFindings(params?: QueryParams): Promise<PaginatedResponse<SecurityFindingDto>> {
    return httpClient.get<PaginatedResponse<SecurityFindingDto>>('/scanner/findings', params);
  },

  triggerScannerRun(cloudAccountId?: string): Promise<{ success: boolean; findingsFound: number }> {
    return httpClient.post<{ success: boolean; findingsFound: number }>('/scanner/run', { cloudAccountId });
  },

  listIamFindings(params?: QueryParams): Promise<PaginatedResponse<IamFindingDto>> {
    return httpClient.get<PaginatedResponse<IamFindingDto>>('/iam/findings', params);
  },

  triggerIamScan(cloudAccountId?: string): Promise<{ success: boolean; findingsFound: number }> {
    return httpClient.post<{ success: boolean; findingsFound: number }>('/iam/scan', { cloudAccountId });
  },

  updateSecurityFindingStatus(idOrNumber: string, status: string): Promise<SecurityFindingDto> {
    return httpClient.patch<SecurityFindingDto>(`/scanner/findings/${idOrNumber}/status`, { status });
  },

  updateIamFindingStatus(idOrNumber: string, status: string): Promise<IamFindingDto> {
    return httpClient.patch<IamFindingDto>(`/iam/findings/${idOrNumber}/status`, { status });
  },
};
