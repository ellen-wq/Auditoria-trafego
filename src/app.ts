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
    const isDev = process.env.NODE_ENV !== 'production';
    const viteDevUrl = (process.env.VITE_DEV_URL || 'http://localhost:5174').replace(/\/$/, '');
    // Em desenvolvimento: página com instruções e link para o Vite (evita redirect quebrado se o client não estiver rodando)
    if (isDev) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fluxer - Dev</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;max-width:420px;margin:2rem auto;">
<p style="margin-bottom:1rem;">Backend rodando na porta 3000.</p>
<p style="margin-bottom:1rem;">Para ver a aplicação, use o frontend (Vite) na porta 5174.</p>
<p style="margin-bottom:1.5rem;"><strong>Se ainda não iniciou o frontend</strong>, em outro terminal rode:</p>
<pre style="background:#f0f0f0;padding:1rem;text-align:left;border-radius:6px;">npm run dev</pre>
<p style="margin-top:1.5rem;">Ou só o client: <code>npm run dev:client</code></p>
<p style="margin-top:1.5rem;"><a href="${viteDevUrl}/" style="display:inline-block;background:#2563eb;color:white;padding:0.6rem 1.2rem;text-decoration:none;border-radius:6px;">Abrir app em localhost:5174</a></p>
</body></html>`
      );
      return;
    }
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
