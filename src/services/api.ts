const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token =
      localStorage.getItem('uniwheels_token') ||
      sessionStorage.getItem('uniwheels_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(`${this.baseUrl}${endpoint}`, origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }
 
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = await response.json();
        message = body.error ?? body.message ?? message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }
    return response.json();
  }
 
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint, config?.params), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
    });
    return this.handleResponse<T>(response);
  }
 
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint, config?.params), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }
 
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint, config?.params), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }
 
  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint, config?.params), {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }
 
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint, config?.params), {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
    });
    return this.handleResponse<T>(response);
  }
}
 
export const api = new ApiService(API_BASE_URL);