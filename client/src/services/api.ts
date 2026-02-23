const API_BASE = '';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'MENTORADO' | 'LIDERANCA';
  created_at?: string;
}

class ApiService {
  private token: string | null = localStorage.getItem('token');

  async request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(API_BASE + url, { ...options, headers, credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error(data.error || 'Não autenticado');
      }
      throw new Error(data.error || 'Erro desconhecido');
    }
    return data as T;
  }

  get<T = any>(url: string): Promise<T> { return this.request<T>(url); }

  post<T = any>(url: string, body?: any): Promise<T> {
    if (body instanceof FormData) {
      return this.request<T>(url, { method: 'POST', body });
    }
    return this.request<T>(url, { method: 'POST', body: JSON.stringify(body) });
  }

  setAuth(token: string, user: User) {
    this.token = token;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getToken(): string | null { return this.token; }

  logout() {
    this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

export const api = new ApiService();
export type { User };
