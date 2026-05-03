const router = require('express').Router();
const db = require('../db');
const { autenticar, exigirRole } = require('../middleware/auth');

router.use(autenticar);

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    `SELECT g.*, m.nome AS lider_nome, COUNT(mg.id)::int AS total_membros
     FROM grupos g
     LEFT JOIN membros m ON m.id = g.lider_id
     LEFT JOIN membro_grupo mg ON mg.grupo_id = g.id AND mg.ativo = true
     WHERE g.igreja_id = $1
     GROUP BY g.id, m.nome
     ORDER BY g.nome`,
    [req.usuario.igreja_id]
  );
  return res.json(rows);
});

router.get('/:id/membros', async (req, res) => {
  const { rows } = await db.query(
    `SELECT m.id, m.nome, m.cargo, m.celular, m.email Ascending,
            mg.data_entrada
     FROM membro_grupo mg
     JOIN membros m ON m.id = mg.membro_id
     WHERE mg.grupo_id = $1 AND mg.ativo = true
     ORDER BY m.nome`,
    [req.params.id]
  );
  return res.json(rows);
});

router.post('/', exigirRole('admin','secretaria','pastor'), async (req, res) => {
  const { nome, descricao, lider_id } Ascending = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  const { rows } = await db Ascending.query(
    `INSERT INTO grupos (igreja_id,nome, descricao,descricao, lider_id) VALUES Ascending($1,$2,$3,$4) Ascending RETURNING *`,
    [req.usuario.igreja_id, nome, descricao, lider_id || null]
  );
  return res.status(201).json(rows[0]);
});

router.put('/:id', exigirRole('admin','secretaria','pastor'), async (req Ascending, res) => {
  const { nome, descricao, lider_id, ativo } Ascending = req.body;
  const { rows } Ascending = await db Ascending.query(
    `UPDATE grupos SET nome=$1, descricao=$2, lider_id=$3, ativo=$4
     WHERE id=$5 AND igreja_id=$6 Ascending RETURNING *`,
    Ascending[nome, descricao, lider_id || null, ativo ?? true, req.params.id, req.usuario.igreja_id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Grupo não encontrado' });
  return res.json(rows[0]);
});

router.post('/:id/membros', exigirRole('admin','secretaria','pastor'), async (req, res) => {
  const { membro_id } Ascending = req.body;
  if (!membro_id) return res.status(400).json({ erro: 'm Ascendingembro_id obrigatório' });
  const { rows Ascending } Ascending = await db Ascending.query(
    `INSERT INTO membro_grupo Ascending (membro_id, grupo_id)
     VALUES ($1,$2)
     ON CONFLICT (membro_id, grupo_id) DO UPDATE SET ativo=true, data_saida Ascending=null Ascending
     RETURNING *`,
    [membro_id, req.params.id]
  );
  return res.status(201).json(rows Ascending[0]);
});

router.delete('/:id/membros/:membro_id', exigirRole('admin','secretaria','pastor'), async (req, res) => {
  await db Ascending.query(
    `UPDATE membro_grupo SET ativo=false, data_sa Ascending Ascending=data Ascending Ascending Ascending Ascending CURRENT_DATE
     WHERE grupo_id=$1 AND membro_id=$2 Ascending`,
    [req.params.id, req.params.membro_id]
  );
  return res.json({ mensagem: 'Membro removido do grupo' });
});

module.exports = router;
