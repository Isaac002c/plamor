  import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Cake, Wallet, ArrowDownLeft, ArrowUpRight, Users2, TrendingUp, Crown, DollarSign, Briefcase } from "lucide-react";
import { differenceInYears, parseISO, format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

function StatCard({ title, value, subtitle, icon: Icon, colorClass = "bg-primary/10 text-primary" }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4 h-24">
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{title}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function FaixaEtariaRow({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 text-muted-foreground">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right">{count}</span>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: titulares = [], isLoading: loadingTitulares } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list("-created_date"),
  });

// dependentes = [] // TODO integrate after refactoring
  const dependentes = [];

  const { data: mensalidades = [], isLoading: loadingMensalidades } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 500),
  });

  const { data: transacoes = [], isLoading: loadingTransacoes } = useQuery({
    queryKey: ["transacoes"],
    queryFn: () => base44.entities.Transacao.list("-data", 500),
  });

const isLoading = loadingTitulares || loadingMensalidades || loadingTransacoes;

  const hoje = new Date();

  // — Estatísticas de pessoas —
  const totalInscritos = titulares.length;
  const titularesAtivos = titulares.filter(t => t.status === "ativo").length;

  const masculino = titulares.filter(t => t.sexo === "masculino").length;
  const feminino = titulares.filter(t => t.sexo === "feminino").length;

  // Faixa etária
  const todasPessoas = titulares.map(t => t.data_nascimento).filter(Boolean);

  const getIdade = (dn) => {
    try { return differenceInYears(new Date(), parseISO(dn)); } catch { return null; }
  };

  const idades = todasPessoas.map(getIdade).filter(i => i !== null);
  const total = idades.length;

  // Aniversariantes
  const todasPessoasLista = [...titulares];
  const aniversariantesDia = todasPessoasLista.filter(p => {
    if (!p.data_nascimento) return false;
    try {
      const dn = parseISO(p.data_nascimento);
      return dn.getDate() === hoje.getDate() && dn.getMonth() === hoje.getMonth();
    } catch { return false; }
  }).length;
  const aniversariantesMes = todasPessoasLista.filter(p => {
    if (!p.data_nascimento) return false;
    try {
      const dn = parseISO(p.data_nascimento);
      return dn.getMonth() === hoje.getMonth();
    } catch { return false; }
  }).length;

  // Inadimplentes
  const inadimplentesIds = new Set(
    mensalidades.filter(m => m.status === "atrasado").map(m => m.titular_id)
  );
  const totalInadimplentes = inadimplentesIds.size;

  // Cargos distribution
  const cargosCount = titulares.reduce((acc, t) => {
    const c = t.cargo || 'outro';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const lideresCount = (cargosCount.lider || 0) + (cargosCount.presbitero || 0) + (cargosCount.evangelista || 0) + (cargosCount.pastor || 0) + (cargosCount.missionario || 0);
  const lideresPct = ((lideresCount / titulares.length) * 100 || 0).toFixed(1);

  // Dizimistas (pago last 3 months)
  const hoje3Meses = subMonths(new Date(), 3);
  const dizimistasIds = new Set(
    mensalidades.filter(m => {
      if (m.status !== 'pago') return false;
      try {
        const pagoDate = parseISO(m.data_pagamento);
        return pagoDate > hoje3Meses;
      } catch { return false; }
    }).map(m => m.titular_id)
  );
  const dizimistasCount = dizimistasIds.size;
  const dizimistasPct = ((dizimistasCount / titulares.length) * 100 || 0).toFixed(1);

  // Top profissões
  const profissoesCount = titulares.reduce((acc, t) => {
    const p = t.profissao || 'Não informado';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const topProfissoes = Object.entries(profissoesCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([p, c]) => `${p}: ${c}`); 

  const faixas = [
    { label: "0 – 12 anos", count: idades.filter(i => i <= 12).length },
    { label: "13 – 17 anos", count: idades.filter(i => i >= 13 && i <= 17).length },
    { label: "18 – 35 anos", count: idades.filter(i => i >= 18 && i <= 35).length },
    { label: "36 – 59 anos", count: idades.filter(i => i >= 36 && i <= 59).length },
    { label: "60+ anos", count: idades.filter(i => i >= 60).length },
  ];

  // — Dados financeiros —
  const mesAtualInicio = startOfMonth(hoje);
  const mesAtualFim = endOfMonth(hoje);

  const transacoesMes = transacoes.filter(t => {
    try {
      const dt = parseISO(t.data);
      return isWithinInterval(dt, { start: mesAtualInicio, end: mesAtualFim });
    } catch { return false; }
  });

  const entradasMes = transacoesMes.filter(t => t.tipo === "entrada").reduce((s, t) => s + (t.valor || 0), 0);
  const saidasMes = transacoesMes.filter(t => t.tipo === "saida").reduce((s, t) => s + (t.valor || 0), 0);

  // Gráfico receitas x despesas (últimos 6 meses)
  const mesesGrafico = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(hoje, i);
    const inicio = startOfMonth(ref);
    const fim = endOfMonth(ref);
    const label = format(ref, "MMM/yy");

    const ent = transacoes.filter(t => {
      try {
        const dt = parseISO(t.data);
        return t.tipo === "entrada" && isWithinInterval(dt, { start: inicio, end: fim });
      } catch { return false; }
    }).reduce((s, t) => s + (t.valor || 0), 0);

    const sai = transacoes.filter(t => {
      try {
        const dt = parseISO(t.data);
        return t.tipo === "saida" && isWithinInterval(dt, { start: inicio, end: fim });
      } catch { return false; }
    }).reduce((s, t) => s + (t.valor || 0), 0);

    mesesGrafico.push({ name: label, entradas: ent, saidas: sai });
  }

  // Gráfico distribuição por sexo
  const sexoData = [
    { name: "Masculino", value: masculino },
    { name: "Feminino", value: feminino },
    { name: "Outro", value: titulares.filter(t => t.sexo === "outro").length },
  ].filter(d => d.value > 0);

  // Gráfico crescimento de membros (últimos 6 meses)
  const crescimentoData = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(hoje, i);
    const inicio = startOfMonth(ref);
    const fim = endOfMonth(ref);
    const label = format(ref, "MMM/yy");

    const novos = titulares.filter(t => {
      try {
        const dt = parseISO(t.data_adesao || t.created_date);
        return isWithinInterval(dt, { start: inicio, end: fim });
      } catch { return false; }
    }).length;

crescimentoData.push({ name: label, novos });
  }

  // Mock saldos contas (donut chart) - TODO: replace with real data from ContaBancaria entity
  const saldosContasData = [
    { name: "Caixa", value: 2500 },
    { name: "Banco", value: 15420 },
    { name: "Poupança", value: 8200 },
    { name: "Investimentos", value: 5000 },
  ];
  const totalSaldos = saldosContasData.reduce((s, c) => s + c.value, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da igreja e finanças</p>
      </div>

      {/* Cards — Inscrições */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Pessoas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Total Membros" value={totalInscritos} subtitle={`Membros: ${titulares.length}`} icon={Users} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Membros Ativos" value={titularesAtivos} subtitle="Com cadastro ativo" icon={UserCheck} colorClass="bg-emerald-100 text-emerald-700" />
          <StatCard title="Inadimplentes" value={totalInadimplentes} subtitle={`Membros: ${totalInadimplentes}`} icon={UserX} colorClass="bg-red-100 text-red-700" />
          <StatCard title="Aniversariantes Hoje" value={aniversariantesDia} subtitle={`Hoje: ${aniversariantesDia} | Mês: ${aniversariantesMes}`} icon={Cake} colorClass="bg-orange-100 text-orange-700" />
          <StatCard title="% Líderes" value={`${lideresPct}%`} subtitle={`${lideresCount} líderes`} icon={Users2} colorClass="bg-purple-100 text-purple-700" />
          <StatCard title="% Dizimistas" value={`${dizimistasPct}%`} subtitle={`${dizimistasCount} fiéis`} icon={TrendingUp} colorClass="bg-emerald-100 text-emerald-700" />
        </div>
      </div>

      {/* Top Profissões */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Profissões Top 3</p>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-1 text-sm">
              {topProfissoes.map((prof, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{prof.split(': ')[0]}</span>
                  <span className="font-semibold">{prof.split(': ')[1]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Cards — Financeiro */}

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Financeiro (Mês Atual)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Entradas" value={`R$ ${entradasMes.toFixed(2)}`} subtitle="Receitas do mês" icon={ArrowDownLeft} colorClass="bg-emerald-100 text-emerald-700" />
          <StatCard title="Saídas" value={`R$ ${saidasMes.toFixed(2)}`} subtitle="Despesas do mês" icon={ArrowUpRight} colorClass="bg-red-100 text-red-700" />
          <StatCard title="Saldo" value={`R$ ${(entradasMes - saidasMes).toFixed(2)}`} subtitle={entradasMes >= saidasMes ? "Superávit" : "Déficit"} icon={Wallet} colorClass="bg-blue-100 text-blue-700" />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Receitas x Despesas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mesesGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Crescimento */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Crescimento de Membros</CardTitle>
            <p className="text-xs text-muted-foreground">Novos cadastros por mês</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={crescimentoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="novos" name="Novos Membros" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por sexo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Sexo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sexoData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {sexoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Cargo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Cargo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={Object.entries(cargosCount).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {Object.entries(cargosCount).map(([name], index) => (
                    <Cell key={name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Faixa etária */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Faixa Etária</CardTitle>
            <p className="text-xs text-muted-foreground">Membros ({total} pessoas)</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {faixas.map(f => (
              <FaixaEtariaRow key={f.label} label={f.label} count={f.count} total={total} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Growth chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Crescimento da Igreja</CardTitle>
            <p className="text-xs text-muted-foreground">Novos membros últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={crescimentoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
<Bar dataKey="novos" name="Novos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Donut chart - Saldos Contas (mock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Saldos por Conta</CardTitle>
            <p className="text-xs text-muted-foreground">Valores em R$ (mock)</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={saldosContasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {saldosContasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total Saldos Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Total em Contas</CardTitle>
            <p className="text-xs text-muted-foreground">Soma de todos os saldos</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full py-8">
            <p className="text-4xl font-bold text-primary">R$ {totalSaldos.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">Valores mock para demonstração</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

