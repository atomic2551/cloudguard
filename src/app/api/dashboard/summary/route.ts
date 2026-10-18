import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonSingle } from '@/lib/api/response';
import { DashboardSummaryDto } from '@/lib/api/types';
import { count, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Alert Counts
    const [totalAlertsRes] = await db.select({ count: count() }).from(schema.alerts);
    const [criticalAlertsRes] = await db
      .select({ count: count() })
      .from(schema.alerts)
      .where(eq(schema.alerts.severity, 'CRITICAL'));
    const [highAlertsRes] = await db
      .select({ count: count() })
      .from(schema.alerts)
      .where(eq(schema.alerts.severity, 'HIGH'));

    // 2. Incident Counts
    const [openIncidentsRes] = await db
      .select({ count: count() })
      .from(schema.incidents)
      .where(eq(schema.incidents.status, 'OPEN'));
    const [investigatingIncidentsRes] = await db
      .select({ count: count() })
      .from(schema.incidents)
      .where(eq(schema.incidents.status, 'INVESTIGATING'));

    // 3. Security Finding Counts
    const [criticalFindingsRes] = await db
      .select({ count: count() })
      .from(schema.securityFindings)
      .where(eq(schema.securityFindings.severity, 'CRITICAL'));
    const [openFindingsRes] = await db
      .select({ count: count() })
      .from(schema.securityFindings)
      .where(eq(schema.securityFindings.status, 'OPEN'));

    // 4. Cloud Accounts Count
    const [activeAccountsRes] = await db
      .select({ count: count() })
      .from(schema.cloudAccounts)
      .where(eq(schema.cloudAccounts.status, 'CONNECTED'));

    // Construct Dashboard Summary DTO
    const summary: DashboardSummaryDto = {
      overallSecurityScore: 82,
      categoryScores: {
        iam: 74,
        network: 68,
        storage: 88,
        logging: 92,
        compute: 80,
      },
      metrics: {
        totalAlerts: Number(totalAlertsRes?.count || 0),
        criticalAlerts: Number(criticalAlertsRes?.count || 0),
        highAlerts: Number(highAlertsRes?.count || 0),
        openIncidents: Number(openIncidentsRes?.count || 0),
        investigatingIncidents: Number(investigatingIncidentsRes?.count || 0),
        criticalFindings: Number(criticalFindingsRes?.count || 0),
        openFindings: Number(openFindingsRes?.count || 0),
        activeCloudAccounts: Number(activeAccountsRes?.count || 0),
      },
      alertsTrend: [
        { date: 'Jan 9', critical: 1, high: 3, medium: 2, low: 5 },
        { date: 'Jan 10', critical: 2, high: 4, medium: 3, low: 3 },
        { date: 'Jan 11', critical: 0, high: 2, medium: 5, low: 4 },
        { date: 'Jan 12', critical: 3, high: 5, medium: 2, low: 2 },
        { date: 'Jan 13', critical: 1, high: 3, medium: 4, low: 6 },
        { date: 'Jan 14', critical: 2, high: 6, medium: 3, low: 3 },
        { date: 'Jan 15', critical: 4, high: 7, medium: 5, low: 4 },
      ],
      severityDistribution: [
        { name: 'Critical', value: Number(criticalAlertsRes?.count || 0), color: '#ef4444' },
        { name: 'High', value: Number(highAlertsRes?.count || 0), color: '#f97316' },
        { name: 'Medium', value: 8, color: '#eab308' },
        { name: 'Low', value: 5, color: '#22c55e' },
      ],
      topRecommendations: [
        { priority: 'CRITICAL', text: 'Revoke AdministratorAccess policy attached directly to IAM user backdoor-svc', effort: 'Low' },
        { priority: 'CRITICAL', text: 'Restrict PostgreSQL port 5432 exposed to 0.0.0.0/0 on Security Group sg-database-prod', effort: 'Medium' },
        { priority: 'HIGH', text: 'Enable Block Public Access on S3 bucket acme-prod-backups-2024', effort: 'Low' },
      ],
    };

    return jsonSingle(summary);
  } catch (error: any) {
    console.error('GET /api/dashboard/summary DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to generate dashboard metrics from database', '/api/dashboard/summary');
  }
}
