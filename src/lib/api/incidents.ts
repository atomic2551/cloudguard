import { httpClient } from './client';
import {
  CreateIncidentDto,
  IncidentDto,
  IncidentNoteDto,
  IncidentTimelineDto,
  PaginatedResponse,
  QueryParams,
  UpdateIncidentDto,
} from './types';

export const incidentsApi = {
  list(params?: QueryParams): Promise<PaginatedResponse<IncidentDto>> {
    return httpClient.get<PaginatedResponse<IncidentDto>>('/incidents', params);
  },

  getById(id: string): Promise<IncidentDto> {
    return httpClient.get<IncidentDto>(`/incidents/${id}`);
  },

  create(payload: CreateIncidentDto): Promise<IncidentDto> {
    return httpClient.post<IncidentDto>('/incidents', payload);
  },

  update(id: string, payload: UpdateIncidentDto): Promise<IncidentDto> {
    return httpClient.patch<IncidentDto>(`/incidents/${id}`, payload);
  },

  addNote(id: string, content: string, isPrivate: boolean = false): Promise<IncidentNoteDto> {
    return httpClient.post<IncidentNoteDto>(`/incidents/${id}/notes`, { content, isPrivate });
  },

  getTimeline(id: string): Promise<IncidentTimelineDto[]> {
    return httpClient.get<IncidentTimelineDto[]>(`/incidents/${id}/timeline`);
  },
};
