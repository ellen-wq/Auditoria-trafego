import path from 'path';
import fs from 'fs';
import type { Request, Response } from 'express';

type ExpressAppLike = (req: Request, res: Response) => void;

let initPromise: Promise<void> | null = null;
let appInstance: ExpressAppLike | null = null;

function resolvePublicDist(): string {
  if (typeof (global as any).__PUBLIC_DIST__ === 'string') {
    return (global as any).__PUBLIC_DIST__;
  }
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'public_dist'),
    path.join(cwd, '..', 'public_dist'),
    path.join(__dirname, '..', 'public_dist'),
    path.join(__dirname, '..', '..', 'public_dist'),
    path.join(__dirname, 'public_dist'),
    path.join(process.env.VERCEL_PROJECT_ROOT || cwd, 'public_dist'),
  ];
  for (const dir of candidates) {
    const indexPath = path.join(dir, 'index.html');
    if (fs.existsSync(indexPath)) {
      (global as any).__PUBLIC_DIST__ = dir;
      return dir;
    }
  }
  const fallback = path.join(cwd, 'public_dist');
  if (fs.existsSync(path.join(fallback, 'index.html'))) {
    (global as any).__PUBLIC_DIST__ = fallback;
    return fallback;
  }
  (global as any).__PUBLIC_DIST__ = fallback;
  return fallback;
}

async function getAppInstance(): Promise<ExpressAppLike> {
  if (!appInstance) {
    resolvePublicDist();
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

      // Servir arquivos estáticos (chunks JS/CSS) diretamente para evitar HTML em /assets/* (evita "A página não carregou")
      if (requestPath.startsWith('/assets/')) {
        const publicDir = resolvePublicDist();
        const filePath = path.join(publicDir, requestPath);
        const ext = path.extname(requestPath);
        const contentType =
          ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.svg' ? 'image/svg+xml' : undefined;
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const data = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          });
          res.end(data);
          return;
        }
      }

      // Evita quebrar render de páginas estáticas quando há falha de DB/env.
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
