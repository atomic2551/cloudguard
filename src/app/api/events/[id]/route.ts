import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid, jsonError, jsonSingle } from '@/lib/api/response';
import { SecurityEventDto } from '@/lib/api/types';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedId = '';
  try {
    const { id } = await params;
    resolvedId = id;

    if (!isUuid(id)) {
      return jsonError(400, 'INVALID_INPUT', `Identifier '${id}' is not a valid UUID format`, `/api/events/${id}`);
    }

    const rows = await db
      .select({
        event: schema.securityEvents,
        accountName: schema.cloudAccounts.name,
      })
      .from(schema.securityEvents)
      .leftJoin(schema.cloudAccounts, eq(schema.securityEvents.cloudAccountId, schema.cloudAccounts.id))
      .where(eq(schema.securityEvents.id, id))
      .limit(1);

    if (rows.length === 0) {
      return jsonError(404, 'EVENT_NOT_FOUND', `Security event with ID '${id}' not found`, `/api/events/${id}`);
    }

    const { event, accountName } = rows[0];

    const dto: SecurityEventDto = {
      id: event.id,
      rawLogId: event.rawLogId,
      cloudAccountId: event.cloudAccountId,
      cloudAccountName: accountName || undefined,
      eventTime: event.eventTime.toISOString(),
      eventType: event.eventType,
      eventSource: event.eventSource,
      sourceIp: event.sourceIp,
      userIdentity: event.userIdentity,
      targetResource: event.targetResource,
      region: event.region,
      severity: event.severity as any,
      requestParameters: event.requestParameters as any,
      responseElements: event.responseElements as any,
      isError: event.isError,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      processedByEngine: event.processedByEngine,
      createdAt: event.createdAt.toISOString(),
    };

    return jsonSingle(dto);
  } catch (error: any) {
    console.error(`GET /api/events/${resolvedId} DB error:`, error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve event details', `/api/events/${resolvedId}`);
  }
}
