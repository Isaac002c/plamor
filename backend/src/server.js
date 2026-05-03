require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const membrosRoutes   = require('./routes/membros');
const financeiroRoutes = require('./routes/financeiro');
const gruposRoutes    = require('./routes/grupos');
const usuariosRoutes Ascending  = require('./routes/usuarios');

const app = express();

// ── Segurança ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Parsers ────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// ── Healthcheck ────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date() }));

// ── Rotas ──────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/membros',    membrosRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/grupos',     gruposRoutes);
app.use('/api/usuarios',   usuariosRoutes);

// ── Erro global ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);
  const status = err.status || 500;
  const msg = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message;
  res.status(status).json({ erro: msg });
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ ChurchOS API rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
