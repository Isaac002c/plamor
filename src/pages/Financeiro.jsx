  import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import churchos from "@/api/churchos.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowDownLeft, ArrowUpRight, Search, Plus, Wallet, TrendingUp, Building2, ChevronDown, ChevronRight, FileText, CalendarCheck } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const categoriaLabels = {
  dizimo: "Dízimo",
  oferta: "Oferta",
  mensalidade: "Mensalidade",
  doacao: "Doação",
  evento: "Evento",
  salario: "Salário",
  aluguel: "Aluguel",
  utilities: "Utilities",
  manutencao: "Manutenção",
  material: "Material",
  outros: "Outros",
};

export default function Financeiro() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [filterMes] = useState("todos");

  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ["transacoes"],
    queryFn: () => churchos.financeiro.transacoes({ sort: '-data', limit: 500 }),
  });

  const { data: titulares = [] } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => churchos.membros.listar(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => churchos.financeiro.criarTransacao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => churchos.financeiro.excluirTransacao(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transacoes"] }),
  });

  const hoje = new Date();
  const mesAtualInicio = startOfMonth(hoje);
  const mesAtualFim = endOfMonth(hoje);

  const transacoesMesAtual = transacoes.filter(t => {
    try {
      const dt = parseISO(t.data);
      return isWithinInterval(dt, { start: mesAtualInicio, end: mesAtualFim });
    } catch { return false; }
  });

  const entradasMes = transacoesMesAtual.filter(t => t.tipo === "entrada").reduce((s, t) => s + (t.valor || 0), 0);
  const saidasMes = transacoesMesAtual.filter(t => t.tipo === "saida").reduce((s, t) => s + (t.valor || 0), 0);
  const saldoMes = entradasMes - saidasMes;

  const totalEntradas = transacoes.filter(t => t.tipo === "entrada").reduce((s, t) => s + (t.valor || 0), 0);
  const totalSaidas = transacoes.filter(t => t.tipo === "saida").reduce((s, t) => s + (t.valor || 0), 0);
  const saldoTotal = totalEntradas - totalSaidas;

  const filtered = transacoes.filter(t => {
    const matchSearch = t.descricao?.toLowerCase().includes(search.toLowerCase()) || 
                       t.membro_nome?.toLowerCase().includes(search.toLowerCase()) ||
                       categoriaLabels[t.categoria]?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "todos" || t.tipo === filterTipo;
    const matchCategoria = filterCategoria === "todos" || t.categoria === filterCategoria;
    const matchMes = filterMes === "todos" || (t.data && t.data.startsWith(filterMes));
    return matchSearch && matchTipo && matchCategoria && matchMes;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de entradas, saídas e fluxo de caixa</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Transação
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Entradas (Mês)</p>
              <p className="text-2xl font-bold mt-0.5 text-emerald-700">R$ {entradasMes.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Saídas (Mês)</p>
              <p className="text-2xl font-bold mt-0.5 text-red-700">R$ {saidasMes.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Saldo (Mês)</p>
              <p className={`text-2xl font-bold mt-0.5 ${saldoMes >= 0 ? "text-blue-700" : "text-red-700"}`}>
                R$ {saldoMes.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-violet-100 text-violet-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Saldo Total</p>
              <p className={`text-2xl font-bold mt-0.5 ${saldoTotal >= 0 ? "text-violet-700" : "text-red-700"}`}>
                R$ {saldoTotal.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar transação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {Object.entries(categoriaLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
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
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Membro</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Valor</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
                ) : (
                  filtered.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">{t.data ? format(parseISO(t.data), "dd/MM/yyyy") : "—"}</td>
                      <td className="p-4 font-medium">{t.descricao || "—"}</td>
                      <td className="p-4">{categoriaLabels[t.categoria] || t.categoria}</td>
                      <td className="p-4 text-muted-foreground">{t.membro_nome || "—"}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.tipo === "entrada" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {t.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-bold ${t.tipo === "entrada" ? "text-emerald-700" : "text-red-700"}`}>
                        {t.tipo === "entrada" ? "+" : "-"} R$ {t.valor?.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => deleteMutation.mutate(t.id)}>
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransacaoForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(data) => createMutation.mutate(data)} titulares={titulares} />
    </div>
  );
}

function TransacaoForm({ open, onClose, onSubmit, titulares }) {
  const [form, setForm] = useState({
    tipo: "entrada",
    categoria: "dizimo",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    membro_id: "",
    membro_nome: "",
    forma_pagamento: "",
    observacao: "",
  });

  const set = (field, value) => {
    const newForm = { ...form, [field]: value };
    if (field === "membro_id" && value) {
      const membro = titulares.find(t => t.id === value);
      newForm.membro_nome = membro?.nome || "";
    }
    if (field === "membro_id" && value === "") {
      newForm.membro_nome = "";
    }
    setForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      valor: parseFloat(form.valor) || 0,
      igreja_id: titulares.find(t => t.id === form.membro_id)?.igreja_id || "",
    });
    setForm({
      tipo: "entrada", categoria: "dizimo", descricao: "", valor: "",
      data: new Date().toISOString().split("T")[0], membro_id: "", membro_nome: "",
      forma_pagamento: "", observacao: "",
    });
  };

  const categoriasEntrada = ["dizimo", "oferta", "mensalidade", "doacao", "evento"];
  const categoriasSaida = ["salario", "aluguel", "utilities", "manutencao", "material", "outros"];
  const categorias = form.tipo === "entrada" ? categoriasEntrada : categoriasSaida;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Categoria *</Label>
              <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{categoriaLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Descrição</Label>
            <Input value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Dízimo de março" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Valor (R$) *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Data *</Label>
              <Input type="date" value={form.data} onChange={e => set("data", e.target.value)} required />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Membro (opcional)</Label>
            <Select value={form.membro_id} onValueChange={v => set("membro_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {titulares.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Forma de Pagamento</Label>
            <Select value={form.forma_pagamento} onValueChange={v => set("forma_pagamento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Observação</Label>
            <Input value={form.observacao} onChange={e => set("observacao", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Transação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

