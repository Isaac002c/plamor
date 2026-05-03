const router = require('express').Router();
const db = require('../db');
const { autenticar, exigirRole } = require('../middleware/auth');

router.use(autenticar);

// GET /api/membros
router.get('/', async (req, res) => {
  const { status, cargo, grupo_id, busca, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const params = [req.usuario.igreja_id];
  const filtros = ['m.igreja_id = $1'];

  if (status) { params.push(status); filtros.push(`m.status = $${params.length}`); }
  if (cargo)  { params.push(cargo);  filtros.push(`m.cargo = $${params.length}`); }
  if (busca)  { params.push(`%${busca}%`); filtros.push(`(m.nome ILIKE $${params.length} OR m.cpf ILIKE $${params.length} OR m.email ILIKE $${params.length})`); }
  if (grupo_id) {
    params.push(grupo_id);
    filtros.push(`EXISTS (SELECT 1 FROM membro_grupo mg WHERE mg.membro_id = m.id AND mg.grupo_id = $${params.length} AND mg.ativo = true)`);
  }

  const where = filtros.join(' AND ');
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT m.*,
            t.nome AS titular_nome,
            COUNT(*) OVER() AS total
     FROM membros m
     LEFT JOIN titulares t ON t.id = m.titular_id
     WHERE ${where}
     ORDER BY m.nome
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = rows[0]?.total ?? 0;
  return res.json({ dados: rows, total: Number(total), page: Number(page), limit: Number(limit) });
});

// GET /api/membros/aniversariantes
router.get('/aniversariantes', async (req, res) => {
  const { periodo = 'mes' } = req.query;
  let filtroData = '';
  if (periodo === 'hoje') {
    filtroData = `EXTRACT(DOY FROM data_nascimento) = EXTRACT(DOY FROM CURRENT_DATE)`;
  } else if (periodo === 'semana') {
    filtroData = `EXTRACT(DOY FROM data_nascimento) BETWEEN EXTRACT(DOY FROM CURRENT_DATE) AND EXTRACT(DOY FROM CURRENT_DATE) + 7`;
  } else {
    filtroData = `EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)`;
  }

  const { rows } = await db.query(
    `SELECT id, nome, data_nascimento, cargo, celular, email,
            EXTRACT(YEAR FROM AGE(data_nascimento))::int AS idade
     FROM membros
     WHERE igreja_id = $1 AND status = 'Ativo' AND data_nascimento IS NOT NULL
       AND ${filtroData}
     ORDER BY EXTRACT(DOY FROM data_nascimento)`,
    [req.usuario.igreja_id]
  );
  return res.json(rows);
});

// GET /api/membros/stats
router.get('/stats', async (req, res) => {
  const igId = req.usuario.igreja_id;
  const [totais, porCargo, porSexo, faixaEtaria, dizimistas] = await Promise.all([
    db.query(`SELECT status, COUNT(*) AS total FROM membros WHERE igreja_id=$1 GROUP BY status`, [igId]),
    db.query(`SELECT cargo, COUNT(*) AS total FROM membros WHERE igreja_id=$1 AND status='Ativo' GROUP BY cargo ORDER BY total DESC`, [igId]),
    db.query(`SELECT sexo, COUNT(*) AS total FROM membros WHERE igreja_id=$1 AND status='Ativo' GROUP BY sexo`, [igId]),
    db.query(`
      SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 18  THEN '0-17'
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 30  THEN '18-29'
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 45  THEN '30-44'
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 60  THEN '45-59'
          ELSE '60+'
        END AS faixa,
        COUNT(*) AS total
      FROM membros
      WHERE igreja_id=$1 AND status='Ativo' AND data_nascimento IS NOT NULL
      GROUP BY faixa ORDER BY faixa`, [igId]),
    db.query(`SELECT COUNT(*) AS total FROM membros WHERE igreja_id=$1 AND dizimista=true AND status='Ativo'`, [igId]),
  ]);

  return res.json({
    totais: totais.rows,
    porCargo: porCargo.rows,
    porSexo: porSexo.rows,
    faixaEtaria: faixaEtaria.rows,
    dizimistas: Number(dizimistas.rows[0].total),
  });
});

// GET /api/membros/:id
router.get('/:id', async (req, res) => {
  const { rows } = await db.query(
    `SELECT m.*,
            t.nome AS titular_nome,
            ARRAY(
              SELECT json_build_object('id', g.id, 'nome', g.nome)
              FROM grupos g
              JOIN membro_grupo mg ON mg.grupo_id = g.id
              WHERE mg.membro_id = m.id AND mg.ativo = true
            ) AS grupos
     FROM membros m
     LEFT JOIN titulares t ON t.id = m.titular_id
     WHERE m.id = $1 AND m.igreja_id = $2`,
    [req.params.id, req.usuario.igreja_id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Membro não encontrado' });
  return res.json(rows[0]);
});

// POST /api/membros
router.post('/', exigirRole('admin', 'secretaria', 'pastor'), async (req, res) => {
  const {
    nome, cpf, rg, email, telefone, celular, endereco, cidade, estado, cep,
    data_nascimento, sexo, estado_civil, profissao, cargo, status, data_batismo,
    data_ingresso, dizimista, foto_url, observacoes, titular_id
  } = req.body;

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

  const { rows } = await db.query(
    `INSERT INTO membros
      (igreja_id, titular_id, nome, cpf, rg, email, telefone, celular, endereco,
       cidade, estado, cep, data_nascimento, sexo, estado_civil, profissao, cargo,
       status, data_batismo, data_ingresso, dizimista, foto_url, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
     RETURNING *`,
    [req.usuario.igreja_id, titular_id, nome, cpf, rg, email, telefone, celular,
     endereco, cidade, estado, cep, data_nascimento, sexo, estado_civil, profissao,
     cargo || 'Membro', status || 'Ativo', data_batismo, data_ingresso,
     dizimista ?? false, foto_url, observacoes]
  );
  return res.status(201).json(rows[0]);
});

// PUT /api/membros/:id
router.put('/:id', exigirRole('admin', 'secretaria', 'pastor'), async (req, res) => {
  const campos = [
    'nome','cpf','rg','email','telefone','celular','endereco','cidade','estado',
    'cep','data_nascimento','sexo','estado_civil','profissao','cargo','status',
    'data_batismo','data_ingresso','data_saida','dizimista','foto_url','observacoes','titular_id'
  ];
  const sets = [], params = [];
  campos.forEach(c => {
    if (req.body[c] !== undefined) {
      params.push(req.body[c]);
      sets.push(`${c} = $${params.length}`);
    }
  });
  if (!sets.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar' });

  params.push(req.params.id, req.usuario.igreja_id);
  const { rows } = await db.query(
    `UPDATE membros SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND igreja_id = $${params.length} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ erro: 'Membro não encontrado' });
  return res.json(rows[0]);
});

// DELETE /api/membros/:id
router.delete('/:id', exigirRole('admin'), async (req, res) => {
  const { rows } = await db.query(
    `UPDATE membros SET status = 'Inativo' WHERE id = $1 AND igreja_id = $2 RETURNING id`,
    [req.params.id, req.usuario.igreja_id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Membro não encontrado' });
  return res.json({ mensagem: 'Membro inativado com sucesso' });
});

module.exports = router;
