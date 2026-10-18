import { NextResponse } from 'next/server';

/**
 * CloudGuard Standardized API Response Utilities
 * Compatible with Spring Boot REST response conventions
 */

export function jsonSingle<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      data,
    },
    { status }
  );
}

export function jsonPaginated<T>(
  items: T[],
  page: number,
  size: number,
  totalElements: number,
  status: number = 200
) {
  const totalPages = Math.ceil(totalElements / Math.max(1, size)) || 1;
  return NextResponse.json(
    {
      data: items,
      page,
      size,
      totalElements,
      totalPages,
    },
    { status }
  );
}

export function jsonError(
  status: number,
  error: string,
  message: string,
  path: string
) {
  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      status,
      error,
      message,
      path,
    },
    { status }
  );
}

export function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
