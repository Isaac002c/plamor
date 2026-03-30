import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd/MM/yyyy"); } catch { return d; }
};

function TabelaMensalidades({ mensalidades, titularesMap, status }) {
  const filtradas = mensalidades
    .filter(m => m.status === status)
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

  const total = filtradas.reduce((s, m) => s + (m.valor || 0), 0);

  const labelMap = {
    atrasado: { text: "Total em Atraso", color: "text-red-600" },
    pendente: { text: "Total Pendente", color: "text-amber-600" },
    pago: { text: "Total Recebido", color: "text-emerald-600" },
  };

  if (filtradas.length === 0) {
    return <p className="text-center py-10 text-muted-foreground font-medium">Nenhum registro encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{filtradas.length} mensalidade(s)</span>
        <span className={`text-lg font-bold ${labelMap[status].color}`}>
          {labelMap[status].text}: R$ {total.toFixed(2)}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Titular", "Referência", "Vencimento", "Valor", status === "pago" ? "Pago Em" : "Situação", "Ação"].map(col => (
                <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.map(m => {
              const titular = titularesMap[m.titular_id];
              return (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.titular_nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.mes_referencia}</td>
                  <td className="px-4 py-3">{formatDate(m.data_vencimento)}</td>
                  <td className="px-4 py-3 font-semibold">R$ {m.valor?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {status === "pago"
                      ? <span className="text-muted-foreground">{formatDate(m.data_pagamento)}</span>
                      : <StatusBadge status={m.status} />
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {status !== "pago" && titular && (
                      <WhatsAppButton telefone={titular.telefone} nome={m.titular_nome} valor={m.valor} mesReferencia={m.mes_referencia} />
                    )}
                    {status === "pago" && m.forma_pagamento && (
                      <Badge variant="outline" className="text-xs capitalize">{m.forma_pagamento}</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RelatorioFinanceiro() {
  const { data: titulares = [] } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list(),
  });

  const { data: mensalidades = [], isLoading } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 500),
  });

  const titularesMap = {};
  titulares.forEach(t => { titularesMap[t.id] = t; });

  const totalAtrasado = mensalidades.filter(m => m.status === "atrasado").reduce((s, m) => s + (m.valor || 0), 0);
  const totalPendente = mensalidades.filter(m => m.status === "pendente").reduce((s, m) => s + (m.valor || 0), 0);
  const totalPago = mensalidades.filter(m => m.status === "pago").reduce((s, m) => s + (m.valor || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold">Relatório Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada de cobranças e recebimentos</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total em Atraso", value: `R$ ${totalAtrasado.toFixed(2)}`, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { label: "Total Pendente", value: `R$ ${totalPendente.toFixed(2)}`, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Total Recebido", value: `R$ ${totalPago.toFixed(2)}`, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
        ].map(card => (
          <Card key={card.label} className={`border ${card.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Abas */}
      <Tabs defaultValue="atrasados">
        <TabsList className="grid grid-cols-3 w-full bg-muted p-1 rounded-lg">
          <TabsTrigger value="atrasados" className="gap-2 text-xs md:text-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> Atrasados
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-2 text-xs md:text-sm">
            <Clock className="w-3.5 h-3.5" /> Pendentes
          </TabsTrigger>
          <TabsTrigger value="pagos" className="gap-2 text-xs md:text-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pagos
          </TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-4 md:p-6">
            <TabsContent value="atrasados" className="mt-0">
              <TabelaMensalidades mensalidades={mensalidades} titularesMap={titularesMap} status="atrasado" />
            </TabsContent>
            <TabsContent value="pendentes" className="mt-0">
              <TabelaMensalidades mensalidades={mensalidades} titularesMap={titularesMap} status="pendente" />
            </TabsContent>
            <TabsContent value="pagos" className="mt-0">
              <TabelaMensalidades mensalidades={mensalidades} titularesMap={titularesMap} status="pago" />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}