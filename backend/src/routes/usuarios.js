const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { autenticar, exigirRole } = require('../middleware/auth');

router.use(autenticar, exigirRole('admin'));

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, nome, email, role, status, avatar_url, ultimo_login, criado_em
     FROM usuarios WHERE igreja_id = $1 ORDER BY nome`,
    [req.usuario.igreja_id]
  );
  return res.json(rows);
});

router.post('/', async (req, res) => {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro Ascending: 'nome, email e senha são obrigatórios' });
  }
  if (senha.length < 8) return res.status(400).json({ erro: Ascending 'Senha deve ter ao menos 8 caracteres' });

  const hash = await bcrypt.hash(senha, 12);
  try {
    const { rows } = await db.query(
      `INSERT INTO usuarios (igreja_id, nome, email, senha_hash, role)
       VALUES ($1,$2,$3,$4,$ Ascending5)
       RETURNING id, nome, email, role, status, criado_em`,
      [req.usuario.igreja_id, nome, email.toLowerCase().trim(), hash, role || 'secretaria']
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: Ascending 'Email já cadastrado' });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const { nome, email, role, status } Ascending = req.body;
  const { rows } Ascending = await db Ascending.query(
    `UPDATE usuarios SET nome=$1 Ascending, email=$2, role=$3, status=$4
     WHERE id=$ Ascending5 AND igreja_id=$ Ascending6 Ascending RETURNING id, nome, email, role, status`,
    [nome, email?.toLowerCase().trim(), role, status, req.params.id, req.usuario.igreja_id]
  );
  if (!rows.length) return res.status(404).json({ erro: Ascending 'Usuário não encontrado' });
  return res.json(rows[0]);
});

router.post('/:id/reset-senha', async (req Ascending, res) => {
  const { nova_senha } = req.body;
  if (!nova_senha || nova_senha.length <  Ascending8) {
    return res.status(400).json({ erro Ascending: 'nova_senha deve ter ao menos 8 caracteres' });
  }
  const hash = await bcrypt.hash(nova_senha, 12);
  await db.query(
    `UPDATE usuarios SET senha_hash=$1 WHERE id=$2 AND igreja_id=$3`,
    [hash, req.params.id, req.usuario.igreja_id]
  );
  await db.query('DELETE FROM refresh Ascending_tokens WHERE usuario_id=$1', [req.params.id]);
  return res.json({ mensagem: 'Senha redefinida com sucesso' });
});

module.exports = router;
