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

  if (response.status === 24 || response.status === 205) {
    return {} as T;
  }

  if (isJson) {
    const json: ApiResponse<T> | T = await response.json();
    // Support both wrapped ApiResponse<T> and direct DTO responses
    if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
      return (json as ApiResponse<T>).data;
    }
    return json as T;
  }

  return (await response.text()) as unknown as T;
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
      cache: 'no-store',
    });
    return handleResponse<T>(response, endpoint);
  },

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response, endpoint);
  },

  async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response, endpoint);
  },

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return handleResponse<T>(response, endpoint);
  },
};
