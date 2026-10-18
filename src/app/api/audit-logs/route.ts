import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { AuditLogDto } from '@/lib/api/types';
import { count, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
    const offset = (page - 1) * size;

    const [totalRes] = await db.select({ total: count() }).from(schema.auditLogs);
    const totalElements = Number(totalRes?.total || 0);

    const rows = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(size)
      .offset(offset);

    const items: AuditLogDto[] = rows.map((log) => ({
      id: log.id,
      userId: log.userId,
      userDisplayName: log.userDisplayName,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      result: log.result as any,
      details: log.details as any,
      createdAt: log.createdAt.toISOString(),
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/audit-logs DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve audit logs from database', '/api/audit-logs');
  }
}
