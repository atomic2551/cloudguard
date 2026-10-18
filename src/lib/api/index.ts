/**
 * CloudGuard SOC Platform — Central API Client Export
 * Single entry point for all frontend service calls
 */

import { alertsApi } from './alerts';
import { auditApi } from './audit';
import { authApi } from './auth';
import { cloudAccountsApi } from './cloud-accounts';
import { dashboardApi } from './dashboard';
import { detectionRulesApi } from './detection-rules';
import { eventsApi } from './events';
import { findingsApi } from './findings';
import { incidentsApi } from './incidents';
import { reportsApi } from './reports';
import { usersApi } from './users';

export * from './types';
export * from './client';

export const api = {
  auth: authApi,
  dashboard: dashboardApi,
  alerts: alertsApi,
  incidents: incidentsApi,
  events: eventsApi,
  cloudAccounts: cloudAccountsApi,
  detectionRules: detectionRulesApi,
  findings: findingsApi,
  users: usersApi,
  reports: reportsApi,
  audit: auditApi,
};
