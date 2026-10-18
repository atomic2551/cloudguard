import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid, jsonError, jsonSingle } from '@/lib/api/response';
import { AlertDto } from '@/lib/api/types';
import { eq, or } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedId = '';
  try {
    const { id } = await params;
    resolvedId = id;

    const condition = isUuid(id)
      ? or(eq(schema.alerts.id, id), eq(schema.alerts.alertNumber, id))
      : eq(schema.alerts.alertNumber, id.toUpperCase());

    const rows = await db
      .select({
        alert: schema.alerts,
        assignedUser: schema.users.displayName,
      })
      .from(schema.alerts)
      .leftJoin(schema.users, eq(schema.alerts.assignedTo, schema.users.id))
      .where(condition)
      .limit(1);

    if (rows.length === 0) {
      return jsonError(404, 'ALERT_NOT_FOUND', `Alert with identifier '${id}' not found`, `/api/alerts/${id}`);
    }

    const { alert, assignedUser } = rows[0];

    const dto: AlertDto = {
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
    };

    return jsonSingle(dto);
  } catch (error: any) {
    console.error(`GET /api/alerts/${resolvedId} DB error:`, error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve alert details', `/api/alerts/${resolvedId}`);
  }
}
