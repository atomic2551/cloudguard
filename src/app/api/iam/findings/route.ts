import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { IamFindingDto } from '@/lib/api/types';
import { and, count, desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    const conditions = [];

    if (severity) {
      conditions.push(eq(schema.iamFindings.severity, severity));
    }
    if (status) {
      conditions.push(eq(schema.iamFindings.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ total: count() })
      .from(schema.iamFindings)
      .where(whereClause);

    const totalElements = Number(totalRes?.total || 0);
    const offset = (page - 1) * size;

    const rows = await db
      .select()
      .from(schema.iamFindings)
      .where(whereClause)
      .orderBy(desc(schema.iamFindings.detectedAt))
      .limit(size)
      .offset(offset);

    const items: IamFindingDto[] = rows.map((f) => ({
      id: f.id,
      findingNumber: f.findingNumber,
      title: f.title,
      description: f.description,
      severity: f.severity as any,
      category: f.category,
      status: f.status as any,
      cloudAccountId: f.cloudAccountId,
      affectedPrincipal: f.affectedPrincipal,
      principalType: f.principalType as any,
      recommendation: f.recommendation,
      detectedAt: f.detectedAt.toISOString(),
      remediatedAt: f.remediatedAt ? f.remediatedAt.toISOString() : null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/iam/findings DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve IAM findings from database', '/api/iam/findings');
  }
}
