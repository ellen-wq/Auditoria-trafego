import { initDb } from './db/database';
import app from './app';
const PORT = process.env.PORT || 3000;

async function start(): Promise<void> {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Fluxer Auditoria rodando em http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
