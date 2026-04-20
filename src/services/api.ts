// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
 
interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}
 
class ApiService {
  private baseUrl: string;
 
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
 
  /**
   * La autenticación funciona con cookies HttpOnly (set por el gateway en el login).
   * Se envía credentials:'include' en cada request para que el navegador adjunte
   * la cookie automáticamente. El Bearer token de localStorage es fallback por si
   * algún flujo lo almacena explícitamente.
   */
  private getAuthHeaders(): HeadersInit {
    const token =
      localStorage.getItem('uniwheels_token') ||
      sessionStorage.getItem('uniwheels_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
 
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
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