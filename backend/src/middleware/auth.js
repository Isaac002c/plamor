const jwt = require('jsonwebtoken');
const db = require('../db');

// Verifica access token
const autenticar = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, nome, email, role, igreja_id, status FROM usuarios WHERE id = $1',
      [payload.sub]
    );
    if (!rows.length || rows[0].status !== 'ativo') {
      return res.status(401).json({ erro: 'Usuário inativo ou não encontrado' });
    }
    req.usuario = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ erro: 'Token inválido' });
  }
};

// Verifica se usuário pertence à mesma igreja do recurso
const mesmaIgreja = (req, res, next) => {
  const igrejId = req.params.igreja_id || req.body.igreja_id;
  if (igrejId && req.usuario.role !== 'admin' && igrejId !== req.usuario.igreja_id) {
    return res.status(403).json({ erro: 'Acesso negado a esta igreja' });
  }
  next();
};

// Fábrica de middleware de roles
const exigirRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.role)) {
    return res.status(403).json({
      erro: `Acesso negado. Requer role: ${roles.join(' ou ')}`,
    });
  }
  next();
};

module.exports = { autenticar, mesmaIgreja, exigirRole };
