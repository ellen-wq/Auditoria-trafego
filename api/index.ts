let initPromise: Promise<void> | null = null;
let appInstance: any = null;

async function getAppInstance() {
  if (!appInstance) {
    const path = await import('path');
    const cwd = process.cwd();
    
    // Try dist first (production build)
    try {
      const distPath = path.join(cwd, 'dist', 'app.js');
      console.log('Trying to import from:', distPath);
      const appModule = await import(distPath);
      appInstance = appModule.default;
      console.log('Successfully imported app from dist');
    } catch (distErr) {
      console.error('Failed to import app from dist:', distErr);
      // Try relative path as fallback
      try {
        console.log('Trying relative path: ../dist/app');
        const appModule = await import('../dist/app');
        appInstance = appModule.default;
        console.log('Successfully imported app from relative dist path');
      } catch (relErr) {
        console.error('Failed to import app from relative dist:', relErr);
        throw new Error(`Cannot import app. Dist error: ${distErr instanceof Error ? distErr.message : String(distErr)}. Rel error: ${relErr instanceof Error ? relErr.message : String(relErr)}`);
      }
    }
  }
  return appInstance;
}

async function ensureDbInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const path = await import('path');
      const cwd = process.cwd();
      
      // Try dist first (production build)
      let dbModule;
      try {
        const distPath = path.join(cwd, 'dist', 'db', 'database.js');
        console.log('Trying to import database from:', distPath);
        dbModule = await import(distPath);
        console.log('Successfully imported database from dist');
      } catch (distErr) {
        console.error('Failed to import database from dist:', distErr);
        // Try relative path as fallback
        try {
          console.log('Trying relative path: ../dist/db/database');
          dbModule = await import('../dist/db/database');
          console.log('Successfully imported database from relative dist path');
        } catch (relErr) {
          console.error('Failed to import database from relative dist:', relErr);
          throw new Error(`Cannot import database. Dist error: ${distErr instanceof Error ? distErr.message : String(distErr)}. Rel error: ${relErr instanceof Error ? relErr.message : String(relErr)}`);
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

export default async function handler(req: any, res: any): Promise<void> {
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
      
      // Try to list dist directory
      let distFiles: string[] = [];
      try {
        distFiles = fs.readdirSync(path.join(cwd, 'dist'));
      } catch (e) {
        distFiles = ['error reading dist'];
      }
      
      res.status(200).json({
        cwd,
        distExists,
        srcExists,
        distFiles: distFiles.slice(0, 10),
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV
      });
      return;
    }
    
    // Test import endpoint
    if (req.url === '/api/test-import') {
      try {
        const path = await import('path');
        const cwd = process.cwd();
        const distPath = path.join(cwd, 'dist', 'app.js');
        const appModule = await import(distPath);
        res.status(200).json({
          success: true,
          hasDefault: !!appModule.default,
          keys: Object.keys(appModule),
          type: typeof appModule.default
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err.message,
          stack: err.stack
        });
      }
      return;
    }
    
    // Test DB init endpoint
    if (req.url === '/api/test-db') {
      try {
        await ensureDbInit();
        res.status(200).json({ success: true, message: 'DB initialized' });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err.message,
          stack: err.stack
        });
      }
      return;
    }
    
    // Initialize DB and app
    console.log('Initializing DB...');
    await ensureDbInit();
    console.log('DB initialized, getting app instance...');
    const app = await getAppInstance();
    console.log('App instance obtained, calling Express app...');
    
    // Call Express app directly - Vercel req/res should be compatible
    return new Promise<void>((resolve, reject) => {
      // Ensure response ends properly
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        originalEnd.apply(this, args);
        resolve();
      };
      
      // Call Express app
      app(req, res, (err?: any) => {
        if (err) {
          console.error('Express app error:', err);
          reject(err);
        } else if (!res.headersSent) {
          // If Express didn't send a response, resolve anyway
          resolve();
        }
      });
      
      // Timeout safety
      setTimeout(() => {
        if (!res.headersSent) {
          console.warn('Request timeout - response not sent');
          if (!res.headersSent) {
            res.status(500).json({ error: 'Request timeout' });
          }
          resolve();
        }
      }, 25000);
    });
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
