let initPromise = null;
let appInstance = null;

async function ensureApp() {
  if (!appInstance) {
    const appModule = require('./dist/app');
    appInstance = appModule.default || appModule;
  }
  return appInstance;
}

async function ensureDbInit() {
  if (!initPromise) {
    initPromise = (async () => {
      const dbModule = require('./dist/db/database');
      await dbModule.initDb({ seedUsers: false, ensureStorageBucket: false });
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

module.exports = async function handler(req, res) {
  try {
    await ensureDbInit();
    const app = await ensureApp();
    return app(req, res);
  } catch (err) {
    return res.status(500).json({
      error: 'Erro ao iniciar aplicação: ' + (err && err.message ? err.message : String(err))
    });
  }
};
