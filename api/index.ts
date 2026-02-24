import type { Request, Response } from 'express';
import app from '../src/app';
import { initDb } from '../src/db/database';

let initPromise: Promise<void> | null = null;

function ensureDbInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initDb().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default function handler(req: Request, res: Response): void {
  void ensureDbInit()
    .then(() => {
      app(req, res);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Erro ao iniciar aplicação: ' + message });
    });
}
