import { initDb } from './db/database.js';
import app from './app.js';
const PORT = process.env.PORT || 3000;

async function start(): Promise<void> {
  await initDb({ seedUsers: true, ensureStorageBucket: true });
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(Number(PORT), HOST, () => {
    console.log(`Fluxer Auditoria rodando em http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
