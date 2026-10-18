import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { SecurityFindingDto } from '@/lib/api/types';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const conditions = [];

    if (severity) {
      conditions.push(eq(schema.securityFindings.severity, severity));
    }
    if (category) {
      conditions.push(eq(schema.securityFindings.category, category));
    }
    if (status) {
      conditions.push(eq(schema.securityFindings.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ total: count() })
      .from(schema.securityFindings)
      .where(whereClause);

    const totalElements = Number(totalRes?.total || 0);
    const offset = (page - 1) * size;

    const rows = await db
      .select()
      .from(schema.securityFindings)
      .where(whereClause)
      .orderBy(desc(schema.securityFindings.riskScore))
      .limit(size)
      .offset(offset);

    const items: SecurityFindingDto[] = rows.map((f) => ({
      id: f.id,
      findingNumber: f.findingNumber,
      title: f.title,
      description: f.description,
      severity: f.severity as any,
      category: f.category as any,
      status: f.status as any,
      cloudAccountId: f.cloudAccountId,
      resourceId: f.resourceId,
      region: f.region,
      recommendation: f.recommendation,
      riskScore: f.riskScore,
      complianceFrameworks: f.complianceFrameworks,
      detectedAt: f.detectedAt.toISOString(),
      remediatedAt: f.remediatedAt ? f.remediatedAt.toISOString() : null,
      suppressedBy: f.suppressedBy,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/scanner/findings DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve security findings from database', '/api/scanner/findings');
  }
}
