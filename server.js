const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initDb } = require('./db/database');
const authRoutes = require('./routes/auth');
const auditRoutes = require('./routes/audits');
const adminRoutes = require('./routes/admin');
const creativesRoutes = require('./routes/creatives');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creatives', creativesRoutes);

app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Fluxer Auditoria rodando em http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
