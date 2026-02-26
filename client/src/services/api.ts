const API_BASE = '';

interface User {
  id: string; // UUID agora
  name: string;
  email: string;
  role: 'MENTORADO' | 'LIDERANCA' | 'PRESTADOR';
  has_seen_tinder_do_fluxo_tutorial?: boolean;
  created_at?: string;
}

class ApiService {
  private token: string | null = this.readToken();

  private safeGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignora bloqueio de storage no navegador.
    }
  }

  private safeRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignora bloqueio de storage no navegador.
    }
  }

  private clearAuthStorage(): void {
    this.safeRemove('token');
    this.safeRemove('user');
  }

  private readToken(): string | null {
    return this.safeGet('token');
  }

  async request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(API_BASE + url, { ...options, headers, credentials: 'include' });
    const raw = await res.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || 'Resposta inválida do servidor.' };
    }
    if (!res.ok) {
      if (res.status === 401) {
        this.clearAuthStorage();
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
    this.safeSet('token', token);
    this.safeSet('user', JSON.stringify(user));
  }

  setUser(user: User) {
    this.safeSet('user', JSON.stringify(user));
  }

  getUser(): User | null {
    try {
      const u = this.safeGet('user');
      if (!u) return null;
      const parsed = JSON.parse(u);
      if (!parsed || typeof parsed !== 'object' || !parsed.role) {
        this.safeRemove('user');
        return null;
      }
      return parsed as User;
    } catch {
      this.clearAuthStorage();
      this.token = null;
      return null;
    }
  }

  getToken(): string | null { return this.token; }

  logout() {
    this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    this.token = null;
    this.clearAuthStorage();
    window.location.href = '/login';
  }
}

export const api = new ApiService();
export type { User };
