import { useQuery } from "@tanstack/react-query";
import churchos from "@/api/churchos.js";
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
  const { data: membrosData, isLoading: loadingMembros } = useQuery({
    queryKey: ["membros-stats"],
    queryFn: () => churchos.membros.stats(),
  });

  const { data: aniversariantes, isLoading: loadingAniversariantes } = useQuery({
    queryKey: ["aniversariantes-mes"],
    queryFn: () => churchos.membros.aniversariantes('mes'),
  });

// dependentes = [] // TODO integrate after refactoring
  const dependentes = [];

  const { data: financeiroResumo, isLoading: loadingFinanceiro } = useQuery({
    queryKey: ["financeiro-resumo"],
    queryFn: () => churchos.financeiro.resumo(),
  });

const isLoading = loadingMembros || loadingAniversariantes || loadingFinanceiro;

  const hoje = new Date();

  // — Estatísticas de pessoas —
  const totais = membrosData?.totais || [];
  const totalInscritos = totais.find(t => t.status === 'Ativo')?.total || 0;
  const totalInativos = totais.find(t => t.status === 'Inativo')?.total || 0;
  const masculino = membrosData?.porSexo?.find(s => s.sexo === 'Masculino')?.total || 0;
  const feminino = membrosData?.porSexo?.find(s => s.sexo === 'Feminino')?.total || 0;

  // Faixa etária
  const faixasEtarias = membrosData?.faixaEtaria || [];

  // Aniversariantes
  const aniversariantesDia = aniversariantes?.filter(a => {
    const hoje = new Date();
    return a.data_nascimento && new Date(a.data_nascimento).getDate() === hoje.getDate();
  }).length || 0;
  const aniversariantesMes = aniversariantes?.length || 0;

  // Inadimplentes (mock até integrar)
  const totalInadimplentes = 0;

  // Cargos distribution
  const cargosCount = {};
  const lideresCount = 0;
  (membrosData?.porCargo || []).forEach(c => {
    cargosCount[c.cargo] = c.total;
    if (['Pastor', 'Líder', 'Diácono', 'Presbítero'].includes(c.cargo)) {
      lideresCount += c.total;
    }
  });
  const lideresPct = totalInscritos > 0 ? ((lideresCount / totalInscritos) * 100).toFixed(1) : 0;

  const dizimistasCount = membrosData?.dizimistas || 0;
  const dizimistasPct = totalInscritos > 0 ? ((dizimistasCount / totalInscritos) * 100).toFixed(1) : 0;

  // Top profissões (mock)
  const topProfissoes = ['Autônomo: 45', 'Professor: 23', 'Comerciante: 18'];

  const faixas = faixasEtarias.map(f => ({
    label: f.faixa,
    count: f.total
  })); 

  // — Dados financeiros —
  const entradasMes = financeiroResumo?.mensal?.find(t => t.tipo === 'Receita')?.total || 0;
  const saidasMes = financeiroResumo?.mensal?.find(t => t.tipo === 'Despesa')?.total || 0;

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

