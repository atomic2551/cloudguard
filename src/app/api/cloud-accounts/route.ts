import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonPaginated } from '@/lib/api/response';
import { CloudAccountDto } from '@/lib/api/types';
import { count, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
    const offset = (page - 1) * size;

    const [totalRes] = await db.select({ total: count() }).from(schema.cloudAccounts);
    const totalElements = Number(totalRes?.total || 0);

    const rows = await db
      .select({
        id: schema.cloudAccounts.id,
        name: schema.cloudAccounts.name,
        provider: schema.cloudAccounts.provider,
        accountId: schema.cloudAccounts.accountId,
        roleArn: schema.cloudAccounts.roleArn,
        primaryRegion: schema.cloudAccounts.primaryRegion,
        monitoredRegions: schema.cloudAccounts.monitoredRegions,
        status: schema.cloudAccounts.status,
        lastSyncAt: schema.cloudAccounts.lastSyncAt,
        syncError: schema.cloudAccounts.syncError,
        createdAt: schema.cloudAccounts.createdAt,
        updatedAt: schema.cloudAccounts.updatedAt,
      })
      .from(schema.cloudAccounts)
      .orderBy(desc(schema.cloudAccounts.createdAt))
      .limit(size)
      .offset(offset);

    const items: CloudAccountDto[] = rows.map((acc) => ({
      id: acc.id,
      name: acc.name,
      provider: acc.provider as any,
      accountId: acc.accountId,
      externalId: null, // Exclude externalId for security
      roleArn: acc.roleArn,
      primaryRegion: acc.primaryRegion,
      monitoredRegions: acc.monitoredRegions,
      status: acc.status as any,
      lastSyncAt: acc.lastSyncAt ? acc.lastSyncAt.toISOString() : null,
      syncError: acc.syncError,
      createdAt: acc.createdAt.toISOString(),
      updatedAt: acc.updatedAt.toISOString(),
    }));

    return jsonPaginated(items, page, size, totalElements);
  } catch (error: any) {
    console.error('GET /api/cloud-accounts DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve cloud accounts from database', '/api/cloud-accounts');
  }
}
