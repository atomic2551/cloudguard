import { httpClient } from './client';
import { SecurityReportDto } from './types';

export const reportsApi = {
  getLatestReport(): Promise<SecurityReportDto> {
    return httpClient.get<SecurityReportDto>('/reports');
  },
};
