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
    let res: Response;
    try {
      res = await fetch(API_BASE + url, { ...options, headers, credentials: 'include' });
    } catch (err: any) {
      const msg = err?.message || '';
      if (/failed to fetch|network|connection|refused/i.test(msg)) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando (npm run dev na pasta do projeto).');
      }
      throw new Error(msg || 'Erro de conexão.');
    }
    const raw = await res.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw ? raw.slice(0, 200) : 'Resposta inválida do servidor.' };
    }
    if (!res.ok) {
      if (res.status === 401) {
        const isLoginRequest = url.includes('/api/auth/login');
        const isAuthMeRequest = url.includes('/api/auth/me');
        const isOnMatchesPage = (typeof window !== 'undefined' && window.location.pathname.includes('/tinder-do-fluxo/matches'));
        const isTinderDoFluxoRequest = url.includes('/api/tinder-do-fluxo/');
        // Não desloga nem redireciona em 401 em rotas do Tinder (evita redirect em cold start / falha transitória)
        if (!isLoginRequest && !isAuthMeRequest && !isOnMatchesPage && !isTinderDoFluxoRequest) {
          this.clearAuthStorage();
          window.location.href = '/login';
        }
        throw new Error(data.error || 'Email ou senha inválidos.');
      }
      if (res.status === 502 || res.status === 503) {
        throw new Error('Servidor indisponível. Inicie o backend com: npm run dev');
      }
      throw new Error(data.error || `Erro do servidor (${res.status}). Tente novamente.`);
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

  patch<T = any>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  delete<T = any>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
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
