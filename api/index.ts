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
      await dbModule.initDb({ seedUsers: false, ensureStorageBucket: false });
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
      if (req.url === '/api/health' || req.url === '/health') {
        res.status(200).json({ ok: true });
        return;
      }
      await ensureDbInit();
      const app = await getAppInstance();
      app(req, res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Erro ao iniciar aplicação: ' + message });
    }
  })();
}
