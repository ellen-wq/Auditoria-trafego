import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import auditRoutes from './routes/audits';
import adminRoutes from './routes/admin';
import creativesRoutes from './routes/creatives';
import tinderRoutes from './routes/tinder';
import './types';

dotenv.config();

const app = express();
// Caminho para public_dist: no serverless (Vercel) api/index.ts define __PUBLIC_DIST__ (caminho da pasta)
const { rootDir, publicDistDir } = (() => {
  const explicit = typeof (global as any).__PUBLIC_DIST__ === 'string' ? (global as any).__PUBLIC_DIST__ : null;
  if (explicit && fs.existsSync(path.join(explicit, 'index.html'))) {
    return { rootDir: path.dirname(explicit), publicDistDir: explicit };
  }
  const cwd = process.cwd();
  const pd = path.join(cwd, 'public_dist');
  if (fs.existsSync(pd)) return { rootDir: cwd, publicDistDir: pd };
  const parent = path.join(__dirname, '..');
  const pdParent = path.join(parent, 'public_dist');
  if (fs.existsSync(pdParent)) return { rootDir: parent, publicDistDir: pdParent };
  return { rootDir: cwd, publicDistDir: pd };
})();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// API routes must come before static files
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creatives', creativesRoutes);
app.use('/api/tinder-do-fluxo', tinderRoutes);

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(publicDistDir));
app.use(express.static(path.join(rootDir, 'public')));

// Serve index.html for all non-API routes (React Router handles routing)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  const indexPath = path.join(publicDistDir, 'index.html');
  const loginHtmlPath = path.join(rootDir, 'public', 'login.html');
  const spaNotBuilt = !fs.existsSync(indexPath);

  // Quando a SPA não foi buildada (ex.: só backend rodando), servir login legado em / e /login
  if (spaNotBuilt && (req.path === '/' || req.path === '/login') && fs.existsSync(loginHtmlPath)) {
    return res.sendFile(loginHtmlPath);
  }

  if (spaNotBuilt) {
    console.error('index.html not found at:', indexPath);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fluxer</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><p>Carregando aplicação...</p><p><a href="/login">Ir para o login</a></p><script>setTimeout(function(){ window.location.href="/login"; }, 2000);</script></body></html>'
    );
    return;
  }
  // Evita cache do HTML para que o usuário sempre receba a versão atual (evita tela em branco por HTML antigo)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fluxer</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><p>Erro ao carregar. <a href="/login">Fazer login</a></p></body></html>'
      );
    }
  });
});

export default app;
