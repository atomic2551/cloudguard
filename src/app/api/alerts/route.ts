import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { AlertDto } from '@/lib/api/types';
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const conditions = [];

    if (severity) {
      conditions.push(eq(schema.alerts.severity, severity));
    }
    if (status) {
      conditions.push(eq(schema.alerts.status, status));
    }
    if (search) {
      conditions.push(
        sql`(${schema.alerts.title} ILIKE ${'%' + search + '%'} OR ${schema.alerts.alertNumber} ILIKE ${'%' + search + '%'} OR ${schema.alerts.sourceIp} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalRes] = await db
      .select({ total: count() })
      .from(schema.alerts)
      .where(whereClause);

    const totalElements = Number(totalRes?.total || 0);
    const offset = (page - 1) * size;

    // Query paginated alerts with assigned user join
    const rows = await db
      .select({
        alert: schema.alerts,
        assignedUser: schema.users.displayName,
      })
      .from(schema.alerts)
      .leftJoin(schema.users, eq(schema.alerts.assignedTo, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.alerts.createdAt))
      .limit(size)
      .offset(offset);

    const items: AlertDto[] = rows.map(({ alert, assignedUser }) => ({
      id: alert.id,
      alertNumber: alert.alertNumber,
      title: alert.title,
      description: alert.description,
      severity: alert.severity as any,
      status: alert.status as any,
      source: alert.source as any,
      detectionRuleId: alert.detectionRuleId,
      triggerEventId: alert.triggerEventId,
      cloudAccountId: alert.cloudAccountId,
      sourceIp: alert.sourceIp,
      userIdentity: alert.userIdentity,
      targetResource: alert.targetResource,
      region: alert.region,
      mitreTechniqueId: alert.mitreTechniqueId,
      mitreTactic: alert.mitreTactic,
      assignedTo: alert.assignedTo,
      assignedToName: assignedUser || null,
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
      resolvedBy: alert.resolvedBy,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/alerts DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve alerts from database', '/api/alerts');
  }
}
