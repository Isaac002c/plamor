import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Send, Search } from "lucide-react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";

export default function Cobranca() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [mensagemCustom, setMensagemCustom] = useState("");
  const [showMassMessage, setShowMassMessage] = useState(false);

  const { data: mensalidades = [], isLoading } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 500),
  });

  const { data: titulares = [] } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list(),
  });

  const updateMens = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mensalidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
    },
  });

  const hoje = startOfDay(new Date());

  // Marcar atrasados automaticamente
  const mensalidadesProcessadas = mensalidades.map(m => {
    if (m.status === "pendente" && m.data_vencimento) {
      try {
        const venc = parseISO(m.data_vencimento);
        if (isBefore(venc, hoje)) {
          return { ...m, status: "atrasado" };
        }
      } catch { }
    }
    return m;
  });

  const inadimplentes = mensalidadesProcessadas.filter(m => m.status !== "pago");

  const filtered = inadimplentes.filter(m => {
    const matchSearch = m.titular_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPendente = filtered.filter(m => m.status === "pendente").reduce((s, m) => s + (m.valor || 0), 0);
  const totalAtrasado = filtered.filter(m => m.status === "atrasado").reduce((s, m) => s + (m.valor || 0), 0);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(m => m.id)));
    }
  };

  const enviarMassivo = () => {
    const selecionados = filtered.filter(m => selectedIds.has(m.id));
    selecionados.forEach(m => {
      const titular = titulares.find(t => t.id === m.titular_id);
      if (titular?.telefone) {
        const phone = titular.telefone.replace(/\D/g, "");
        const phoneFormatted = phone.startsWith("55") ? phone : `55${phone}`;
        const msg = encodeURIComponent(
          mensagemCustom || `Olá ${titular.nome}! 👋\n\nIdentificamos que a contribuição referente a *${m.mes_referencia}* no valor de *R$ ${m.valor?.toFixed(2)}* encontra-se pendente.\n\nPor gentileza, regularize sua situação. Deus abençoe! 🙏`
        );
        window.open(`https://wa.me/${phoneFormatted}?text=${msg}`, "_blank");
      }
    });
    setShowMassMessage(false);
    setSelectedIds(new Set());
  };

  const markAsPago = (mensalidade) => {
    updateMens.mutate({
      id: mensalidade.id,
      data: { status: "pago", data_pagamento: new Date().toISOString().split("T")[0] },
    });
  };

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
        <h1 className="text-2xl md:text-3xl font-serif font-bold">Cobrança</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerenciamento de inadimplentes e envio de cobranças</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pendentes</p>
            <p className="text-2xl font-bold mt-1 text-amber-700">R$ {totalPendente.toFixed(2)}</p>
            <p className="text-xs text-amber-600 mt-1">{filtered.filter(m => m.status === "pendente").length} mensalidade(s)</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Atrasados</p>
            <p className="text-2xl font-bold mt-1 text-red-700">R$ {totalAtrasado.toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-1">{filtered.filter(m => m.status === "atrasado").length} mensalidade(s)</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Inadimplente</p>
            <p className="text-2xl font-bold mt-1 text-blue-700">R$ {(totalPendente + totalAtrasado).toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">{filtered.length} registro(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações em massa */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm font-medium">{selectedIds.size} item(s) selecionado(s)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowMassMessage(true)}>
                <MessageCircle className="w-4 h-4 mr-2" /> Enviar WhatsApp
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-4 w-10">
                    <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Titular</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referência</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimento</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum inadimplente encontrado.</td></tr>
                ) : (
                  filtered.map(m => {
                    const titular = titulares.find(t => t.id === m.titular_id);
                    return (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} />
                        </td>
                        <td className="p-4 font-medium">{m.titular_nome}</td>
                        <td className="p-4 text-muted-foreground">{m.mes_referencia}</td>
                        <td className="p-4">{m.data_vencimento ? format(parseISO(m.data_vencimento), "dd/MM/yyyy") : "—"}</td>
                        <td className="p-4 font-bold">R$ {m.valor?.toFixed(2)}</td>
                        <td className="p-4"><StatusBadge status={m.status} /></td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => markAsPago(m)}>
                              Marcar Pago
                            </Button>
                            {titular && (
                              <WhatsAppButton
                                telefone={titular.telefone}
                                nome={m.titular_nome}
                                valor={m.valor}
                                mesReferencia={m.mes_referencia}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal mensagem em massa */}
      {showMassMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Send className="w-5 h-5" /> Enviar Cobrança em Masso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedIds.size} destinatário(s) selecionado(s). Personalize a mensagem ou use o padrão.
              </p>
              <textarea
                value={mensagemCustom}
                onChange={e => setMensagemCustom(e.target.value)}
                rows={5}
                placeholder="Digite sua mensagem personalizada..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowMassMessage(false)}>Cancelar</Button>
                <Button onClick={enviarMassivo} className="gap-2">
                  <Send className="w-4 h-4" /> Enviar {selectedIds.size} Mensagem(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

