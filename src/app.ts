import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import auditRoutes from './routes/audits';
import adminRoutes from './routes/admin';
import creativesRoutes from './routes/creatives';
import './types';

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '..', 'public_dist')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creatives', creativesRoutes);

app.get('/app/*', (req, res) => {
  const builtIndex = path.join(__dirname, '..', 'public_dist', 'index.html');
  const fallback = path.join(__dirname, '..', 'public', req.path);
  res.sendFile(builtIndex, (err) => {
    if (err) res.sendFile(fallback);
  });
});

app.get('/admin/*', (req, res) => {
  const builtIndex = path.join(__dirname, '..', 'public_dist', 'index.html');
  const fallback = path.join(__dirname, '..', 'public', req.path);
  res.sendFile(builtIndex, (err) => {
    if (err) res.sendFile(fallback);
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(__dirname, '..', 'public_dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

export default app;
