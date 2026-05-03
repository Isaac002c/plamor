const router = require('express').Router();
const db = require('../db');
const { autenticar, exigirRole } = require('../middleware/auth');

router.use(autenticar);

// ============================================================
// CONTAS BANCÁRIAS
// ============================================================

router.get('/contas', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM contas_bancarias WHERE igreja_id = $1 ORDER BY nome`,
    [req.usuario.igreja_id]
  );
  return res.json(rows);
});

router.post('/contas', exigirRole('admin', 'tesouraria'), async (req, res) => {
  const { nome, tipo, banco, agencia, numero_conta, saldo_inicial, data_abertura, observacoes } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome da conta é obrigatório' });

  const saldo = saldo_inicial ?? 0;
  const { rows } = await db.query(
    `INSERT INTO contas_bancarias
      (igreja_id, nome, tipo, banco, agencia, numero_conta, saldo_inicial, saldo_atual, data_abertura, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9)
     RETURNING *`,
    [req.usuario.igreja_id, nome, tipo || 'Corrente', banco, agencia, numero_conta, saldo, data_abertura, observacoes]
  );
  return res.status(201).json(rows[0]);
});

router.put('/contas/:id', exigirRole('admin', 'tesouraria'), async (req, res) => {
  const campos = ['nome','tipo','banco','agencia','numero_conta','ativa','observacoes'];
  const sets = [], params = [];
  campos.forEach(c => {
    if (req.body[c] !== undefined) { params.push(req.body[c]); sets.push(`${c} = $${params.length}`); }
  });
  if (!sets.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
  params.push(req.params.id, req.usuario.igreja_id);
  const { rows } = await db.query(
    `UPDATE contas_bancarias SET ${sets.join(',')} WHERE id=$${params.length-1} AND igreja_id=$${params.length} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ erro: 'Conta não encontrada' });
  return res.json(rows[0]);
});

router.delete('/contas/:id', exigirRole('admin'), async (req, res) => {
  await db.query(
    `UPDATE contas_bancarias SET ativa = false WHERE id = $1 AND igreja_id = $2`,
    [req.params.id, req.usuario.igreja_id]
  );
  return res.json({ mensagem: 'Conta inativada' });
});

// ============================================================
// PLANO DE CONTAS
// ============================================================

router.get('/plano-contas', async (req, res) => {
  const { rows } = await db.query(
    `SELECT pc.*, pp.nome AS pai_nome
     FROM plano_contas pc
     LEFT JOIN plano_contas pp ON pp.id = pc.pai_id
     WHERE pc.igreja_id = $1 AND pc.ativo = true
     ORDER BY pc.codigo`,
    [req.usuario.igreja_id]
  );

  // Monta hierarquia
  const mapa = {};
  rows.forEach(r => { mapa[r.id] = { ...r, filhos: [] }; });
  const raiz = [];
  rows.forEach(r => {
    if (r.pai_id && mapa[r.pai_id]) mapa[r.pai_id].filhos.push(mapa[r.id]);
    else raiz.push(mapa[r.id]);
  });
  return res.json(raiz);
});

router.post('/plano-contas', exigirRole('admin', 'tesouraria'), async (req, res) => {
  const { pai_id, codigo, nome, tipo, aceita_lancamento } = req.body;
  if (!codigo || !nome || !tipo) {
    return res.status(400).json({ erro: 'codigo, nome e tipo são obrigatórios' });
  }

  let nivel = 1;
  if (pai_id) {
    const { rows: pai } = await db.query('SELECT nivel FROM plano_contas WHERE id=$1', [pai_id]);
    if (pai.length) nivel = pai[0].nivel + 1;
  }

  const { rows } = await db.query(
    `INSERT INTO plano_contas (igreja_id, pai_id, codigo, nome, tipo, nivel, aceita_lancamento)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.usuario.igreja_id, pai_id || null, codigo, nome, tipo, nivel, aceita_lancamento ?? true]
  );
  return res.status(201).json(rows[0]);
});

router.delete('/plano-contas/:id', exigirRole('admin'), async (req, res) => {
  await db.query(`UPDATE plano_contas SET ativo = false WHERE id=$1 AND igreja_id=$2`,
    [req.params.id, req.usuario.igreja_id]);
  return res.json({ mensagem: 'Conta inativada' });
});

// ============================================================
// TRANSAÇÕES
// ============================================================

router.get('/transacoes', async (req, res) => {
  const {
    tipo, conta_id, plano_id, membro_id, conciliado,
    data_inicio, data_fim, busca, page = 1, limit = 50
  } = req.query;
  const offset = (page - 1) * limit;
  const params = [req.usuario.igreja_id];
  const filtros = ['t.igreja_id = $1'];

  if (tipo)       { params.push(tipo);       filtros.push(`t.tipo = $${params.length}`); }
  if (conta_id)   { params.push(conta_id);   filtros.push(`t.conta_bancaria_id = $${params.length}`); }
  if (plano_id)   { params.push(plano_id);   filtros.push(`t.plano_conta_id = $${params.length}`); }
  if (membro_id)  { params.push(membro_id);  filtros.push(`t.membro_id = $${params.length}`); }
  if (conciliado) { params.push(conciliado === 'true'); filtros.push(`t.conciliado = $${params.length}`); }
  if (data_inicio){ params.push(data_inicio); filtros.push(`t.data_transacao >= $${params.length}`); }
  if (data_fim)   { params.push(data_fim);    filtros.push(`t.data_transacao <= $${params.length}`); }
  if (busca)      { params.push(`%${busca}%`); filtros.push(`t.descricao ILIKE $${params.length}`); }

  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT t.*,
            cb.nome AS conta_nome,
            pc.nome AS plano_nome, pc.codigo AS plano_codigo,
            m.nome AS membro_nome,
            u.nome AS criado_por_nome,
            COUNT(*) OVER() AS total
     FROM transacoes t
     LEFT JOIN contas_bancarias cb ON cb.id = t.conta_bancaria_id
     LEFT JOIN plano_contas pc ON pc.id = t.plano_conta_id
     LEFT JOIN membros m ON m.id = t.membro_id
     LEFT JOIN usuarios u ON u.id = t.criado_por
     WHERE ${filtros.join(' AND ')}
     ORDER BY t.data_transacao DESC, t.criado_em DESC
     LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  );

  return res.json({
    dados: rows,
    total: Number(rows[0]?.total ?? 0),
    page: Number(page),
    limit: Number(limit),
  });
});

router.get('/transacoes/resumo', async (req, res) => {
  const { mes, ano } = req.query;
  const igId = req.usuario.igreja_id;

  const anoAtual = ano || new Date().getFullYear();
  const mesAtual = mes || new Date().getMonth() + 1;

  const [mensal, anual, porTipo] = await Promise.all([
    db.query(
      `SELECT tipo, SUM(valor) AS total
       FROM transacoes
       WHERE igreja_id=$1
         AND EXTRACT(MONTH FROM data_transacao)=$2
         AND EXTRACT(YEAR FROM data_transacao)=$3
       GROUP BY tipo`,
      [igId, mesAtual, anoAtual]
    ),
    db.query(
      `SELECT EXTRACT(MONTH FROM data_transacao)::int AS mes,
              tipo, SUM(valor) AS total
       FROM transacoes
       WHERE igreja_id=$1 AND EXTRACT(YEAR FROM data_transacao)=$2
       GROUP BY mes, tipo ORDER BY mes`,
      [igId, anoAtual]
    ),
    db.query(
      `SELECT pc.nome, pc.codigo, pc.tipo, SUM(t.valor) AS total
       FROM transacoes t
       JOIN plano_contas pc ON pc.id = t.plano_conta_id
       WHERE t.igreja_id=$1
         AND EXTRACT(MONTH FROM t.data_transacao)=$2
         AND EXTRACT(YEAR FROM t.data_transacao)=$3
       GROUP BY pc.id, pc.nome, pc.codigo, pc.tipo
       ORDER BY total DESC`,
      [igId, mesAtual, anoAtual]
    ),
  ]);

  return res.json({ mensal: mensal.rows, anual: anual.rows, porCategoria: porTipo.rows });
});

router.post('/transacoes', async (req, res) => {
  const {
    conta_bancaria_id, plano_conta_id, membro_id, tipo,
    descricao, valor, data_transacao, data_competencia,
    numero_documento, observacoes
  } = req.body;

  if (!tipo || !descricao || !valor) {
    return res.status(400).json({ erro: 'tipo, descricao e valor são obrigatórios' });
  }
  if (!['Receita','Despesa','Transferencia'].includes(tipo)) {
    return res.status(400).json({ erro: 'tipo inválido' });
  }

  const { rows } = await db.query(
    `INSERT INTO transacoes
      (igreja_id, conta_bancaria_id, plano_conta_id, membro_id, tipo,
       descricao, valor, data_transacao, data_competencia, numero_documento, observacoes, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.usuario.igreja_id, conta_bancaria_id, plano_conta_id, membro_id, tipo,
     descricao, valor, data_transacao || new Date(), data_competencia,
     numero_documento, observacoes, req.usuario.id]
  );
  return res.status(201).json(rows[0]);
});

router.put('/transacoes/:id', exigirRole('admin','tesouraria'), async (req, res) => {
  const campos = ['descricao','valor','data_transacao','data_competencia','plano_conta_id',
                  'conta_bancaria_id','membro_id','conciliado','numero_documento','observacoes'];
  const sets = [], params = [];
  campos.forEach(c => {
    if (req.body[c] !== undefined) { params.push(req.body[c]); sets.push(`${c}=$${params.length}`); }
  });
  if (!sets.length) return res.status(400).json({ erro: 'Nada a atualizar' });
  params.push(req.params.id, req.usuario.igreja_id);
  const { rows } = await db.query(
    `UPDATE transacoes SET ${sets.join(',')} WHERE id=$${params.length-1} AND igreja_id=$${params.length} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ erro: 'Transação não encontrada' });
  return res.json(rows[0]);
});

router.delete('/transacoes/:id', exigirRole('admin','tesouraria'), async (req, res) => {
  const { rows } = await db.query(
    `DELETE FROM transacoes WHERE id=$1 AND igreja_id=$2 RETURNING id`,
    [req.params.id, req.usuario.igreja_id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Transação não encontrada' });
  return res.json({ mensagem: 'Transação removida' });
});

// ============================================================
// FECHAMENTO DE CAIXA
// ============================================================

router.get('/fechamento', async (req, res) => {
  const { ano = new Date().getFullYear() } = req.query;
  const { rows } = await db.query(
    `SELECT fc.*, cb.nome AS conta_nome, u.nome AS fechado_por_nome
     FROM fechamento_caixa fc
     LEFT JOIN contas_bancarias cb ON cb.id = fc.conta_bancaria_id
     LEFT JOIN usuarios u ON u.id = fc.fechado_por
     WHERE fc.igreja_id = $1 AND fc.ano = $2
     ORDER BY fc.mes`,
    [req.usuario.igreja_id, ano]
  );
  return res.json(rows);
});

router.post('/fechamento', exigirRole('admin','tesouraria'), async (req, res) => {
  const { conta_bancaria_id, mes, ano, observacoes } = req.body;
  if (!mes || !ano) return res.status(400).json({ erro: 'mes e ano são obrigatórios' });

  const igId = req.usuario.igreja_id;

  // Busca saldo inicial da conta
  let saldoInicial = 0;
  if (conta_bancaria_id) {
    const { rows: fc } = await db.query(
      `SELECT saldo_final FROM fechamento_caixa WHERE conta_bancaria_id=$1 AND igreja_id=$2 AND ano=$3 AND mes=$4`,
      [conta_bancaria_id, igId, mes === 1 ? ano - 1 : ano, mes === 1 ? 12 : mes - 1]
    );
    if (fc.length) saldoInicial = Number(fc[0].saldo_final);
    else {
      const { rows: cb } = await db.query('SELECT saldo_inicial FROM contas_bancarias WHERE id=$1', [conta_bancaria_id]);
      if (cb.length) saldoInicial = Number(cb[0].saldo_inicial);
    }
  }

  // Calcula receitas e despesas do período
  const { rows: totais } = await db.query(
    `SELECT tipo, SUM(valor) AS total
     FROM transacoes
     WHERE igreja_id=$1
       AND ($2::uuid IS NULL OR conta_bancaria_id=$2)
       AND EXTRACT(MONTH FROM data_transacao)=$3
       AND EXTRACT(YEAR FROM data_transacao)=$4
     GROUP BY tipo`,
    [igId, conta_bancaria_id || null, mes, ano]
  );

  const receitas = Number(totais.find(r => r.tipo === 'Receita')?.total ?? 0);
  const despesas = Number(totais.find(r => r.tipo === 'Despesa')?.total ?? 0);

  const { rows } = await db.query(
    `INSERT INTO fechamento_caixa
      (igreja_id, conta_bancaria_id, mes, ano, saldo_inicial, total_receitas, total_despesas, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (igreja_id, conta_bancaria_id, mes, ano) DO UPDATE
       SET total_receitas=$6, total_despesas=$7, saldo_inicial=$5, observacoes=$8
     RETURNING *`,
    [igId, conta_bancaria_id || null, mes, ano, saldoInicial, receitas, despesas, observacoes]
  );
  return res.status(201).json(rows[0]);
});

router.put('/fechamento/:id/fechar', exigirRole('admin','tesouraria'), async (req, res) => {
  const { rows } = await db.query(
    `UPDATE fechamento_caixa
     SET fechado=true, fechado_por=$1, fechado_em=NOW()
     WHERE id=$2 AND igreja_id=$3 RETURNING *`,
    [req.usuario.id, req.params.id, req.usuario.igreja_id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Fechamento não encontrado' });
  return res.json(rows[0]);
});

// ============================================================
// MENSALIDADES
// ============================================================

router.get('/mensalidades', async (req, res) => {
  const { mes, ano, status, tipo, membro_id } = req.query;
  const params = [req.usuario.igreja_id];
  const filtros = ['ms.igreja_id=$1'];

  if (mes)       { params.push(mes);       filtros.push(`ms.competencia_mes=$${params.length}`); }
  if (ano)       { params.push(ano);       filtros.push(`ms.competencia_ano=$${params.length}`); }
  if (status)    { params.push(status);    filtros.push(`ms.status=$${params.length}`); }
  if (tipo)      { params.push(tipo);      filtros.push(`ms.tipo=$${params.length}`); }
  if (membro_id) { params.push(membro_id); filtros.push(`ms.membro_id=$${params.length}`); }

  const { rows } = await db.query(
    `SELECT ms.*, m.nome AS membro_nome, m.cargo AS membro_cargo
     FROM mensalidades ms
     JOIN membros m ON m.id = ms.membro_id
     WHERE ${filtros.join(' AND ')}
     ORDER BY ms.competencia_ano DESC, ms.competencia_mes DESC, m.nome`,
    params
  );
  return res.json(rows);
});

router.post('/mensalidades', exigirRole('admin','tesouraria','secretaria'), async (req, res) => {
  const { membro_id, competencia_mes, competencia_ano, valor, valor_pago, data_pagamento, status, tipo } = req.body;
  if (!membro_id || !competencia_mes || !competencia_ano) {
    return res.status(400).json({ erro: 'membro_id, competencia_mes e competencia_ano são obrigatórios' });
  }
  const { rows } = await db.query(
    `INSERT INTO mensalidades
      (igreja_id, membro_id, competencia_mes, competencia_ano, valor, valor_pago, data_pagamento, status Ascending,
      status, tipo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (membro_id, competencia_mes, competencia_ano, tipo) DO UPDATE
       SET valor_pago=$6, data_pagamento=$7, status=$8
     RETURNING *`,
    [req.usuario.igreja_id, membro_id, competencia_mes, competencia_ano,
     valor || 0, valor_pago || 0, data_pagamento, status || 'Pago', tipo || 'Mensalidade']
  );
  return res.status(201).json(rows[0]);
});

module.exports = router;
