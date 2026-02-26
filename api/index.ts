import type { Request, Response } from 'express';

type ExpressAppLike = (req: Request, res: Response) => void;

let initPromise: Promise<void> | null = null;
let appInstance: ExpressAppLike | null = null;

async function getAppInstance(): Promise<ExpressAppLike> {
  if (!appInstance) {
    // Try dist first (production build), fallback to src (dev/Vercel auto-compile)
    try {
      const appModule = await import('../dist/app');
      appInstance = appModule.default as ExpressAppLike;
    } catch (distErr) {
      try {
        const appModule = await import('../src/app');
        appInstance = appModule.default as ExpressAppLike;
      } catch (srcErr) {
        console.error('Failed to import app from dist:', distErr);
        console.error('Failed to import app from src:', srcErr);
        throw new Error(`Cannot import app: ${distErr instanceof Error ? distErr.message : String(distErr)}`);
      }
    }
  }
  return appInstance;
}

async function ensureDbInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      // Try dist first (production build), fallback to src (dev/Vercel auto-compile)
      let dbModule;
      try {
        dbModule = await import('../dist/db/database');
      } catch (distErr) {
        try {
          dbModule = await import('../src/db/database');
        } catch (srcErr) {
          console.error('Failed to import database from dist:', distErr);
          console.error('Failed to import database from src:', srcErr);
          throw new Error(`Cannot import database: ${distErr instanceof Error ? distErr.message : String(distErr)}`);
        }
      }
      await dbModule.initDb({ seedUsers: false, ensureStorageBucket: false });
    })().catch((err) => {
      initPromise = null;
      console.error('DB init error:', err);
      throw err;
    });
  }
  await initPromise;
}

export default function handler(req: Request, res: Response): void {
  void (async () => {
    try {
      if (req.url === '/api/health' || req.url === '/health') {
        res.status(200).json({ ok: true });
        return;
      }
      await ensureDbInit();
      const app = await getAppInstance();
      app(req, res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error('Handler error:', message, stack);
      res.status(500).json({ 
        error: 'Erro ao iniciar aplicação: ' + message,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined
      });
    }
  })();
}
