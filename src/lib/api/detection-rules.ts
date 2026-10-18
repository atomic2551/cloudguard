import { httpClient } from './client';
import {
  CreateDetectionRuleDto,
  DetectionRuleDto,
  PaginatedResponse,
  QueryParams,
  UpdateDetectionRuleDto,
} from './types';

export const detectionRulesApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<DetectionRuleDto>> {
    return httpClient.get<PaginatedResponse<DetectionRuleDto>>('/detection-rules', params);
  },

  getById(id: string): Promise<DetectionRuleDto> {
    return httpClient.get<DetectionRuleDto>(`/detection-rules/${id}`);
  },

  create(payload: CreateDetectionRuleDto): Promise<DetectionRuleDto> {
    return httpClient.post<DetectionRuleDto>('/detection-rules', payload);
  },

  update(id: string, payload: UpdateDetectionRuleDto): Promise<DetectionRuleDto> {
    return httpClient.patch<DetectionRuleDto>(`/detection-rules/${id}`, payload);
  },

  delete(id: string): Promise<{ success: boolean }> {
    return httpClient.delete<{ success: boolean }>(`/detection-rules/${id}`);
  },
};
