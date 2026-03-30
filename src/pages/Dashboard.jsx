import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: titulares = [], isLoading: loadingTitulares } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list("-created_date"),
  });

  const { data: mensalidades = [], isLoading: loadingMensalidades } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 100),
  });

  const isLoading = loadingTitulares || loadingMensalidades;

  const totalTitulares = titulares.filter(t => t.status === "ativo").length;
  const totalPagos = mensalidades.filter(m => m.status === "pago").length;
  const totalPendentes = mensalidades.filter(m => m.status === "pendente").length;
  const totalAtrasados = mensalidades.filter(m => m.status === "atrasado").length;

  const receitaMes = mensalidades
    .filter(m => m.status === "pago")
    .reduce((sum, m) => sum + (m.valor || 0), 0);

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
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Painel de Controle</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema de cobranças</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Titulares Ativos" value={totalTitulares} icon={Users} />
        <StatCard title="Receita Recebida" value={`R$ ${receitaMes.toFixed(2)}`} icon={CheckCircle} variant="success" />
        <StatCard title="Pendentes" value={totalPendentes} icon={CreditCard} variant="warning" />
        <StatCard title="Atrasados" value={totalAtrasados} icon={AlertTriangle} variant="danger" />
      </div>

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