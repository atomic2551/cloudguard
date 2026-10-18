import { httpClient } from './client';
import {
  CloudAccountDto,
  CreateCloudAccountDto,
  PaginatedResponse,
  QueryParams,
  UpdateCloudAccountDto,
} from './types';

export const cloudAccountsApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<CloudAccountDto>> {
    return httpClient.get<PaginatedResponse<CloudAccountDto>>('/cloud-accounts', params);
  },

  getById(id: string): Promise<CloudAccountDto> {
    return httpClient.get<CloudAccountDto>(`/cloud-accounts/${id}`);
  },

  create(payload: CreateCloudAccountDto): Promise<CloudAccountDto> {
    return httpClient.post<CloudAccountDto>('/cloud-accounts', payload);
  },

  update(id: string, payload: UpdateCloudAccountDto): Promise<CloudAccountDto> {
    return httpClient.patch<CloudAccountDto>(`/cloud-accounts/${id}`, payload);
  },

  delete(id: string): Promise<{ success: boolean }> {
    return httpClient.delete<{ success: boolean }>(`/cloud-accounts/${id}`);
  },
};
