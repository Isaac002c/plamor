const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { autenticar } = require('../middleware/auth');

const gerarTokens = async (usuario) => {
  const accessToken = jwt.sign(
    { sub: usuario.id, role: usuario.role, igreja_id: usuario.igreja_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = uuidv4();
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  await db.query(
    'INSERT INTO refresh_tokens (usuario_id, token, expira_em) VALUES ($1, $2, $3)',
    [usuario.id, refreshToken, expiraEm]
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  const { rows } = await db.query(
    `SELECT u.*, i.nome AS igreja_nome
     FROM usuarios u
     JOIN igrejas i ON i.id = u.igreja_id
     WHERE u.email = $1`,
    [email.toLowerCase().trim()]
  );

  const usuario = rows[0];
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }
  if (usuario.status !== 'ativo') {
    return res.status(401).json({ erro: 'Usuário inativo' });
  }

  const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaOk) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  await db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [usuario.id]);

  const { accessToken, refreshToken } = await gerarTokens(usuario);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    accessToken,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      igreja_id: usuario.igreja_id,
      igreja_nome: usuario.igreja_nome,
      avatar_url: usuario.avatar_url,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ erro: 'Refresh token não fornecido' });

  const { rows } = await db.query(
    `SELECT rt.*, u.id AS uid, u.nome, u.email, u.role, u.igreja_id, u.status
     FROM refresh_tokens rt
     JOIN usuarios u ON u.id = rt.usuario_id
     WHERE rt.token = $1 AND rt.expira_em > NOW()`,
    [token]
  );

  if (!rows.length) {
    return res.status(401).json({ erro: 'Refresh token inválido ou expirado' });
  }

  const row = rows[0];
  if (row.status !== 'ativo') {
    return res.status(401).json({ erro: 'Usuário inativo' });
  }

  // Rotaciona o refresh token (one-time use)
  await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);

  const usuario = { id: row.uid, nome: row.nome, email: row.email, role: row.role, igreja_id: row.igreja_id };
  const { accessToken, refreshToken: novoRefresh } = await gerarTokens(usuario);

  res.cookie('refreshToken', novoRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ accessToken });
});

// POST /api/auth/logout
router.post('/logout', autenticar, async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }
  res.clearCookie('refreshToken');
  return res.json({ mensagem: 'Logout realizado com sucesso' });
});

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.nome, u.email, u.role, u.avatar_url, u.ultimo_login,
            u.igreja_id, i.nome AS igreja_nome
     FROM usuarios u
     JOIN igrejas i ON i.id = u.igreja_id
     WHERE u.id = $1`,
    [req.usuario.id]
  );
  return res.json(rows[0]);
});

// PUT /api/auth/senha
router.put('/senha', autenticar, async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ erro: 'senha_atual e nova_senha são obrigatórios' });
  }
  if (nova_senha.length < 8) {
    return res.status(400).json({ erro: 'Nova senha deve ter ao menos 8 caracteres' });
  }

  const { rows } = await db.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
  const ok = await bcrypt.compare(senha_atual, rows[0].senha_hash);
  if (!ok) return res.status(400).json({ erro: 'Senha atual incorreta' });

  const hash = await bcrypt.hash(nova_senha, 12);
  await db.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, req.usuario.id]);
  // Invalida todos os refresh tokens
  await db.query('DELETE FROM refresh_tokens WHERE usuario_id = $1', [req.usuario.id]);

  return res.json({ mensagem: 'Senha alterada com sucesso' });
});

module.exports = router;
