import { httpClient } from './client';
import {
  AlertCommentDto,
  AlertDto,
  AlertStatus,
  AlertTimelineDto,
  PaginatedResponse,
  QueryParams,
  UpdateAlertStatusDto,
} from './types';

export const alertsApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<AlertDto>> {
    return httpClient.get<PaginatedResponse<AlertDto>>('/alerts', params);
  },

  getById(id: string): Promise<AlertDto> {
    return httpClient.get<AlertDto>(`/alerts/${id}`);
  },

  updateStatus(id: string, status: AlertStatus, comment?: string): Promise<AlertDto> {
    const body: UpdateAlertStatusDto = { status, comment };
    return httpClient.patch<AlertDto>(`/alerts/${id}/status`, body);
  },

  addComment(id: string, content: string): Promise<AlertCommentDto> {
    return httpClient.post<AlertCommentDto>(`/alerts/${id}/comments`, { content });
  },

  getTimeline(id: string): Promise<AlertTimelineDto[]> {
    return httpClient.get<AlertTimelineDto[]>(`/alerts/${id}/timeline`);
  },
};
