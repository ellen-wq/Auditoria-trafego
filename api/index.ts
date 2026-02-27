import type { Request, Response } from 'express';

type ExpressAppLike = (req: Request, res: Response) => void;

let initPromise: Promise<void> | null = null;
let appInstance: ExpressAppLike | null = null;

async function getAppInstance(): Promise<ExpressAppLike> {
  if (!appInstance) {
    const appModule = await import('../src/app');
    appInstance = appModule.default as ExpressAppLike;
  }
  return appInstance;
}

async function ensureDbInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const dbModule = await import('../src/db/database');
      await dbModule.initDb({ seedUsers: true, ensureStorageBucket: false });
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

export default function handler(req: Request, res: Response): void {
  void (async () => {
    try {
      const requestPath = (() => {
        try {
          return new URL(req.url || '/', 'http://localhost').pathname;
        } catch {
          return req.url || '/';
        }
      })();
      const search = (() => {
        try {
          return new URL(req.url || '/', 'http://localhost').search;
        } catch {
          return (req.url && req.url.includes('?')) ? '?' + req.url.split('?')[1] : '';
        }
      })();

      if (requestPath === '/api/health' || requestPath === '/health') {
        res.status(200).json({ ok: true });
        return;
      }

      // Evita quebrar render de páginas estáticas quando há falha de DB/env.
      // Inicializamos conexão apenas quando a rota é realmente de API.
      if (requestPath.startsWith('/api/')) {
        await ensureDbInit();
      }

      // Na Vercel, req.url pode vir como URL completa; Express espera path + query.
      const pathAndQuery = requestPath + search;
      if (req.url !== pathAndQuery) {
        req.url = pathAndQuery;
      }

      const app = await getAppInstance();
      app(req, res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Erro ao iniciar aplicação: ' + message });
    }
  })();
}
