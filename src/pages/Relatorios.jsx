import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import CargoLabel from "@/components/shared/CargoLabel";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { differenceInYears, format, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle2, Users } from "lucide-react";

const calcIdade = (data_nascimento) => {
  if (!data_nascimento) return "—";
  return differenceInYears(new Date(), parseISO(data_nascimento));
};

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd/MM/yyyy"); } catch { return d; }
};

const TableHeader = ({ cols }) => (
  <thead>
    <tr className="border-b bg-muted/40">
      {cols.map(c => (
        <th key={c} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{c}</th>
      ))}
    </tr>
  </thead>
);

/* ── Relatório de Mensalidades por status ── */
function RelMensalidades({ mensalidades, titulares, status }) {
  const titularesMap = {};
  titulares.forEach(t => { titularesMap[t.id] = t; });

  const filtradas = mensalidades
    .filter(m => m.status === status)
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

  const total = filtradas.reduce((s, m) => s + (m.valor || 0), 0);

  const iconMap = {
    atrasado: <AlertTriangle className="w-4 h-4 text-red-500" />,
    pendente: <Clock className="w-4 h-4 text-amber-500" />,
    pago: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  };

  const labelMap = {
    atrasado: { text: "Total em Atraso", color: "text-red-600" },
    pendente: { text: "Total Pendente", color: "text-amber-600" },
    pago: { text: "Total Recebido", color: "text-emerald-600" },
  };

  if (filtradas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-medium">Nenhum registro encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconMap[status]}
          <span className="text-sm text-muted-foreground">{filtradas.length} mensalidade(s)</span>
        </div>
        <div className={`text-lg font-bold ${labelMap[status].color}`}>
          {labelMap[status].text}: R$ {total.toFixed(2)}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <TableHeader cols={["Titular", "Referência", "Vencimento", "Valor", status === "pago" ? "Pago Em" : "Situação", "Ação"]} />
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
                      <WhatsAppButton
                        telefone={titular.telefone}
                        nome={m.titular_nome}
                        valor={m.valor}
                        mesReferencia={m.mes_referencia}
                      />
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

/* ── Relatório Geral de Titulares ── */
function RelTitulares({ titulares }) {
  const ativos = titulares.filter(t => t.status === "ativo").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">{titulares.length} cadastrado(s) · {ativos} ativo(s)</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <TableHeader cols={["Nome Completo", "CPF", "Data de Entrada", "Idade", "Cargo", "Status"]} />
          <tbody className="divide-y">
            {titulares.map(t => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{t.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.cpf}</td>
                <td className="px-4 py-3">{formatDate(t.data_adesao)}</td>
                <td className="px-4 py-3">
                  {t.data_nascimento
                    ? <span className="font-medium">{calcIdade(t.data_nascimento)} anos</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </td>
                <td className="px-4 py-3"><CargoLabel cargo={t.cargo} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Página Principal ── */
export default function Relatorios() {
  const { data: titulares = [], isLoading: lt } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list("-data_adesao"),
  });

  const { data: mensalidades = [], isLoading: lm } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 500),
  });

  const isLoading = lt || lm;

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
        <h1 className="text-2xl md:text-3xl font-serif font-bold">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada da carteira de clientes e cobranças</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Atrasado", value: `R$ ${totalAtrasado.toFixed(2)}`, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { label: "Total Pendente", value: `R$ ${totalPendente.toFixed(2)}`, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Total Recebido", value: `R$ ${totalPago.toFixed(2)}`, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Total Titulares", value: titulares.length, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
        ].map(card => (
          <Card key={card.label} className={`border ${card.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Abas */}
      <Tabs defaultValue="atrasados">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto gap-1 bg-muted p-1 rounded-lg">
          <TabsTrigger value="atrasados" className="gap-2 text-xs md:text-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> Atrasados
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-2 text-xs md:text-sm">
            <Clock className="w-3.5 h-3.5" /> Pendentes
          </TabsTrigger>
          <TabsTrigger value="pagos" className="gap-2 text-xs md:text-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pagos
          </TabsTrigger>
          <TabsTrigger value="titulares" className="gap-2 text-xs md:text-sm">
            <Users className="w-3.5 h-3.5" /> Titulares
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-4 md:p-6">
            <TabsContent value="atrasados" className="mt-0">
              <RelMensalidades mensalidades={mensalidades} titulares={titulares} status="atrasado" />
            </TabsContent>
            <TabsContent value="pendentes" className="mt-0">
              <RelMensalidades mensalidades={mensalidades} titulares={titulares} status="pendente" />
            </TabsContent>
            <TabsContent value="pagos" className="mt-0">
              <RelMensalidades mensalidades={mensalidades} titulares={titulares} status="pago" />
            </TabsContent>
            <TabsContent value="titulares" className="mt-0">
              <RelTitulares titulares={titulares} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}