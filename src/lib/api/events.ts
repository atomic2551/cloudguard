import { httpClient } from './client';
import { PaginatedResponse, QueryParams, SecurityEventDto } from './types';

export const eventsApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<SecurityEventDto>> {
    return httpClient.get<PaginatedResponse<SecurityEventDto>>('/events', params);
  },

  getById(id: string): Promise<SecurityEventDto> {
    return httpClient.get<SecurityEventDto>(`/events/${id}`);
  },
};
