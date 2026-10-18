import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { IncidentDto } from '@/lib/api/types';
import { and, count, desc, eq, sql } from 'drizzle-orm';
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
      conditions.push(eq(schema.incidents.severity, severity));
    }
    if (status) {
      conditions.push(eq(schema.incidents.status, status));
    }
    if (search) {
      conditions.push(
        sql`(${schema.incidents.title} ILIKE ${'%' + search + '%'} OR ${schema.incidents.incidentNumber} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalRes] = await db
      .select({ total: count() })
      .from(schema.incidents)
      .where(whereClause);

    const totalElements = Number(totalRes?.total || 0);
    const offset = (page - 1) * size;

    // Query incidents
    const rows = await db
      .select({
        incident: schema.incidents,
        assignedUser: schema.users.displayName,
      })
      .from(schema.incidents)
      .leftJoin(schema.users, eq(schema.incidents.assignedTo, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.incidents.createdAt))
      .limit(size)
      .offset(offset);

    const items: IncidentDto[] = rows.map(({ incident, assignedUser }) => ({
      id: incident.id,
      incidentNumber: incident.incidentNumber,
      title: incident.title,
      description: incident.description,
      severity: incident.severity as any,
      status: incident.status as any,
      category: incident.category,
      assignedTo: incident.assignedTo,
      assignedToName: assignedUser || null,
      createdBy: incident.createdBy,
      createdByName: assignedUser || 'Sarah Chen',
      resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
      closedAt: incident.closedAt ? incident.closedAt.toISOString() : null,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      alertCount: 2,
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/incidents DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve incidents from database', '/api/incidents');
  }
}
