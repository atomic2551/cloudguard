import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { SecurityEventDto } from '@/lib/api/types';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
    const severity = searchParams.get('severity');
    const search = searchParams.get('search');

    const conditions = [];

    if (severity) {
      conditions.push(eq(schema.securityEvents.severity, severity));
    }
    if (search) {
      conditions.push(
        sql`(${schema.securityEvents.eventType} ILIKE ${'%' + search + '%'} OR ${schema.securityEvents.sourceIp} ILIKE ${'%' + search + '%'} OR ${schema.securityEvents.userIdentity} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ total: count() })
      .from(schema.securityEvents)
      .where(whereClause);

    const totalElements = Number(totalRes?.total || 0);
    const offset = (page - 1) * size;

    const rows = await db
      .select({
        event: schema.securityEvents,
        accountName: schema.cloudAccounts.name,
      })
      .from(schema.securityEvents)
      .leftJoin(schema.cloudAccounts, eq(schema.securityEvents.cloudAccountId, schema.cloudAccounts.id))
      .where(whereClause)
      .orderBy(desc(schema.securityEvents.eventTime))
      .limit(size)
      .offset(offset);

    const items: SecurityEventDto[] = rows.map(({ event, accountName }) => ({
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
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/events DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve security events from database', '/api/events');
  }
}
