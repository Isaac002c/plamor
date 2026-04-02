import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, UserCheck, UserX, Baby, PersonStanding, Smile, Cake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInYears, parseISO } from "date-fns";

function StatCard({ title, value, subtitle, icon: Icon, colorClass = "bg-primary/10 text-primary" }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4 h-24">
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
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

  const { data: dependentes = [], isLoading: loadingDependentes } = useQuery({
    queryKey: ["dependentes"],
    queryFn: () => base44.entities.Dependente.list(),
  });

  const { data: mensalidades = [], isLoading: loadingMensalidades } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 500),
  });

  const isLoading = loadingTitulares || loadingDependentes || loadingMensalidades;

  // — Estatísticas de pessoas —
  const totalInscritos = titulares.length + dependentes.length;
  const titularesAtivos = titulares.filter(t => t.status === "ativo").length;

  const masculino = titulares.filter(t => t.sexo === "masculino").length;
  const feminino = titulares.filter(t => t.sexo === "feminino").length;

  // Faixa etária (titulares + dependentes com data_nascimento)
  const todasPessoas = [
    ...titulares.map(t => t.data_nascimento),
    ...dependentes.map(d => d.data_nascimento),
  ].filter(Boolean);

  const getIdade = (dn) => {
    try { return differenceInYears(new Date(), parseISO(dn)); } catch { return null; }
  };

  const idades = todasPessoas.map(getIdade).filter(i => i !== null);
  const total = idades.length;

  const criancas = idades.filter(i => i <= 12).length;
  const idosos = idades.filter(i => i >= 60).length;

  // Aniversariantes do dia e do mês
  const hoje = new Date();
  const todasPessoasLista = [...titulares, ...dependentes];
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

  // Inadimplentes: titulares com pelo menos uma mensalidade atrasada
  const inadimplentesIds = new Set(
    mensalidades.filter(m => m.status === "atrasado").map(m => m.titular_id)
  );
  const totalInadimplentes = inadimplentesIds.size;

  const faixas = [
    { label: "0 – 12 anos", count: idades.filter(i => i <= 12).length },
    { label: "13 – 17 anos", count: idades.filter(i => i >= 13 && i <= 17).length },
    { label: "18 – 35 anos", count: idades.filter(i => i >= 18 && i <= 35).length },
    { label: "36 – 59 anos", count: idades.filter(i => i >= 36 && i <= 59).length },
    { label: "60+ anos", count: idades.filter(i => i >= 60).length },
  ];

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
        <p className="text-muted-foreground text-sm mt-1">Visão geral dos beneficiários do plano</p>
      </div>

      {/* Cards — Inscrições */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Inscrições</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Inscritos"
            value={totalInscritos}
            subtitle={`Titulares: ${titulares.length} | Dep.: ${dependentes.length}`}
            icon={Users}
            colorClass="bg-blue-100 text-blue-700"
          />
          <StatCard
            title="Beneficiários Ativos"
            value={titularesAtivos}
            subtitle="Com plano ativo"
            icon={UserCheck}
            colorClass="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Inadimplentes"
            value={totalInadimplentes}
            subtitle={`Titulares: ${totalInadimplentes}`}
            icon={UserX}
            colorClass="bg-red-100 text-red-700"
          />
          <StatCard
            title="Aniversariantes Hoje"
            value={aniversariantesDia}
            subtitle={`Hoje: ${aniversariantesDia} | Mês: ${aniversariantesMes}`}
            icon={Cake}
            colorClass="bg-orange-100 text-orange-700"
          />
        </div>
      </div>

      {/* Cards — Perfil */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Perfil dos Beneficiários</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Homens"
            value={masculino}
            subtitle="Total masculino"
            icon={PersonStanding}
            colorClass="bg-sky-100 text-sky-700"
          />
          <StatCard
            title="Mulheres"
            value={feminino}
            subtitle="Total feminino"
            icon={Users}
            colorClass="bg-pink-100 text-pink-700"
          />
          <StatCard
            title="Idosos (60+)"
            value={idosos}
            subtitle="Total de idosos"
            icon={Smile}
            colorClass="bg-violet-100 text-violet-700"
          />
          <StatCard
            title="Crianças (0–12)"
            value={criancas}
            subtitle="Total de crianças"
            icon={Baby}
            colorClass="bg-amber-100 text-amber-700"
          />
        </div>
      </div>

      {/* Faixa etária */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Faixa Etária</CardTitle>
          <p className="text-xs text-muted-foreground">Titulares e dependentes com data de nascimento registrada ({total} pessoas)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {faixas.map(f => (
            <FaixaEtariaRow key={f.label} label={f.label} count={f.count} total={total} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}