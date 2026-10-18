import { httpClient } from './client';
import { DashboardSummaryDto } from './types';

export const dashboardApi = {
  getSummary(): Promise<DashboardSummaryDto> {
    return httpClient.get<DashboardSummaryDto>('/dashboard/summary');
  },
};
