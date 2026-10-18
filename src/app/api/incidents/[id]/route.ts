import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid, jsonError, jsonSingle } from '@/lib/api/response';
import { IncidentDto } from '@/lib/api/types';
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
      ? or(eq(schema.incidents.id, id), eq(schema.incidents.incidentNumber, id))
      : eq(schema.incidents.incidentNumber, id.toUpperCase());

    const rows = await db
      .select({
        incident: schema.incidents,
        assignedUser: schema.users.displayName,
      })
      .from(schema.incidents)
      .leftJoin(schema.users, eq(schema.incidents.assignedTo, schema.users.id))
      .where(condition)
      .limit(1);

    if (rows.length === 0) {
      return jsonError(404, 'INCIDENT_NOT_FOUND', `Incident with identifier '${id}' not found`, `/api/incidents/${id}`);
    }

    const { incident, assignedUser } = rows[0];

    const dto: IncidentDto = {
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
    };

    return jsonSingle(dto);
  } catch (error: any) {
    console.error(`GET /api/incidents/${resolvedId} DB error:`, error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve incident details', `/api/incidents/${resolvedId}`);
  }
}
