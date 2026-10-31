import { ApiError, ApiResponse, QueryParams } from './types';

/**
 * Base HTTP Client for CloudGuard SOC Platform
 * Environment Variable: NEXT_PUBLIC_API_BASE_URL
 * Default: "/api" (Next.js Thin Bridge) -> "http://localhost:8080/api" (Future Spring Boot Backend)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class HttpClientError extends Error implements ApiError {
  timestamp: string;
  status: number;
  error: string;
  path: string;

  constructor(status: number, error: string, message: string, path: string, timestamp?: string) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
    this.error = error;
    this.path = path;
    this.timestamp = timestamp || new Date().toISOString();
  }
}

function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Checks whether an object matches com.cloudguard.common.response.ApiResponse.
 * ApiResponse.success(data) returns a Map containing strictly a single "data" key.
 */
function isBackendApiResponse<T>(obj: unknown): obj is { data: T } {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === 'data';
}

async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorData: any = null;
    if (isJson) {
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
    }

    const message = errorData?.message || errorData?.error || `HTTP ${response.status}: ${response.statusText}`;
    throw new HttpClientError(
      response.status,
      response.statusText || 'API_ERROR',
      message,
      endpoint,
      errorData?.timestamp
    );
  }

  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  if (isJson) {
    const json: unknown = await response.json();
    if (isBackendApiResponse<T>(json)) {
      return json.data;
    }
    return json as T;
  }

  return (await response.text()) as unknown as T;
}

function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureXsrfToken(): Promise<string | null> {
  let token = getXsrfToken();
  if (!token && typeof window !== 'undefined') {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        token = getXsrfToken() || body?.csrfToken || null;
      }
    } catch {
      // ignore network errors during csrf bootstrap
    }
  }
  return token;
}

async function getMutatingHeaders(headers?: Record<string, string>): Promise<Record<string, string>> {
  const merged: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  const xsrf = await ensureXsrfToken();
  if (xsrf) {
    merged['X-XSRF-TOKEN'] = xsrf;
  }
  return merged;
}

export const httpClient = {
  async get<T>(endpoint: string, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}${buildQueryString(params)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'same-origin',
      cache: 'no-store',
    });
    return handleResponse<T>(response, endpoint);
  },

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const mutatingHeaders = await getMutatingHeaders(headers);
    const response = await fetch(url, {
      method: 'POST',
      headers: mutatingHeaders,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response, endpoint);
  },

  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const mutatingHeaders = await getMutatingHeaders(headers);
    const response = await fetch(url, {
      method: 'PUT',
      headers: mutatingHeaders,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response, endpoint);
  },

  async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const mutatingHeaders = await getMutatingHeaders(headers);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: mutatingHeaders,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response, endpoint);
  },

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const mutatingHeaders = await getMutatingHeaders(headers);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: mutatingHeaders,
      credentials: 'same-origin',
    });
    return handleResponse<T>(response, endpoint);
  },
};
