import type { Request, Response } from 'express';

let initPromise: Promise<void> | null = null;
let appInstance: any = null;

async function getAppInstance() {
  if (!appInstance) {
    // Try dist first (production build), fallback to src (dev/Vercel auto-compile)
    try {
      const appModule = await import('../dist/app');
      appInstance = appModule.default;
    } catch (distErr) {
      try {
        const appModule = await import('../src/app');
        appInstance = appModule.default;
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

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    // Health check endpoint
    if (req.url === '/api/health' || req.url === '/health') {
      res.status(200).json({ ok: true, env: !!process.env.SUPABASE_URL });
      return;
    }

    // Debug endpoint
    if (req.url === '/api/debug') {
      const cwd = process.cwd();
      const fs = await import('fs');
      const path = await import('path');
      const distExists = fs.existsSync(path.join(cwd, 'dist', 'app.js'));
      const srcExists = fs.existsSync(path.join(cwd, 'src', 'app.ts'));
      res.status(200).json({
        cwd,
        distExists,
        srcExists,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV
      });
      return;
    }

    await ensureDbInit();
    const app = await getAppInstance();
    
    // Convert Vercel request/response to Express-like format
    app(req as any, res as any);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('Handler error:', message);
    console.error('Stack:', stack);
    res.status(500).json({ 
      error: 'Erro ao iniciar aplicação: ' + message,
      details: process.env.NODE_ENV === 'development' ? stack : undefined
    });
  }
}
