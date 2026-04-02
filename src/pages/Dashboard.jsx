import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, CreditCard, AlertTriangle, CheckCircle, UserCheck, Baby } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/shared/StatusBadge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { differenceInYears, parseISO } from "date-fns";

function StatCard({ title, value, subtitle, icon: Icon, colorClass = "bg-primary/10 text-primary" }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
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
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 100),
  });

  const isLoading = loadingTitulares || loadingDependentes || loadingMensalidades;

  // — Estatísticas de pessoas —
  const totalInscritos = titulares.length + dependentes.length;
  const titularesAtivos = titulares.filter(t => t.status === "ativo");
  const totalAtivos = titularesAtivos.length;

  const masculino = titulares.filter(t => t.sexo === "masculino").length;
  const feminino = titulares.filter(t => t.sexo === "feminino").length;
  const outro = titulares.filter(t => t.sexo === "outro" || !t.sexo).length;

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

  const faixas = [
    { label: "0 – 12 anos", count: idades.filter(i => i <= 12).length },
    { label: "13 – 17 anos", count: idades.filter(i => i >= 13 && i <= 17).length },
    { label: "18 – 35 anos", count: idades.filter(i => i >= 18 && i <= 35).length },
    { label: "36 – 59 anos", count: idades.filter(i => i >= 36 && i <= 59).length },
    { label: "60+ anos", count: idades.filter(i => i >= 60).length },
  ];

  const criancas = idades.filter(i => i <= 12).length;

  // — Pendências financeiras —
  const pendencias = mensalidades
    .filter(m => m.status === "atrasado" || m.status === "pendente")
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    .slice(0, 8);

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

      {/* Cards superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inscritos"
          value={totalInscritos}
          subtitle={`${titulares.length} titular(es) + ${dependentes.length} dependente(s)`}
          icon={Users}
          colorClass="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Beneficiários Ativos"
          value={totalAtivos}
          subtitle="Titulares com plano ativo"
          icon={UserCheck}
          colorClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title="Homens × Mulheres"
          value={`${masculino} × ${feminino}`}
          subtitle={outro > 0 ? `+${outro} outro(s)` : "Titulares cadastrados"}
          icon={Users}
          colorClass="bg-violet-100 text-violet-700"
        />
        <StatCard
          title="Crianças (0–12)"
          value={criancas}
          subtitle={`de ${total} pessoas com idade registrada`}
          icon={Baby}
          colorClass="bg-amber-100 text-amber-700"
        />
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

      {/* Pendências */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Pendências Recentes</CardTitle>
            <Link to="/mensalidades" className="text-sm text-primary hover:underline font-medium">
              Ver todas →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendencias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium">Tudo em dia!</p>
              <p className="text-sm">Nenhuma pendência encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Titular</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Referência</th>
                    <th className="pb-3 font-medium text-muted-foreground">Valor</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendencias.map((m) => {
                    const titular = titulares.find(t => t.id === m.titular_id);
                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <Link to={`/titulares/${m.titular_id}`} className="font-medium text-foreground hover:text-primary">
                            {m.titular_nome}
                          </Link>
                        </td>
                        <td className="py-3 text-muted-foreground hidden sm:table-cell">{m.mes_referencia}</td>
                        <td className="py-3 font-medium">R$ {m.valor?.toFixed(2)}</td>
                        <td className="py-3"><StatusBadge status={m.status} /></td>
                        <td className="py-3 text-right">
                          <WhatsAppButton
                            telefone={titular?.telefone}
                            nome={m.titular_nome}
                            valor={m.valor}
                            mesReferencia={m.mes_referencia}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}