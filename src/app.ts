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
const rootDir = process.cwd();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API routes must come before static files
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creatives', creativesRoutes);

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(rootDir, 'public_dist')));
app.use(express.static(path.join(rootDir, 'public')));

// Serve index.html for all non-API routes (React Router handles routing)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  const indexPath = path.join(rootDir, 'public_dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

export default app;
