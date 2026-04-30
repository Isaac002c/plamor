import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/shared/StatusBadge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { format } from "date-fns";

export default function Mensalidades() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  const { data: mensalidades = [], isLoading } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: () => base44.entities.Mensalidade.list("-data_vencimento", 200),
  });

  const { data: titulares = [] } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list(),
  });

  const titularesMap = {};
  titulares.forEach(t => { titularesMap[t.id] = t; });

  const filtered = mensalidades.filter(m => {
    const matchSearch = m.titular_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || m.status === filterStatus;
    return matchSearch && matchStatus;
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
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold">Mensalidades</h1>
        <p className="text-muted-foreground text-sm mt-1">{mensalidades.length} registros</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do titular..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhuma mensalidade encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left bg-muted/30">
                    <th className="p-4 font-medium text-muted-foreground">Titular</th>
                    <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Referência</th>
                    <th className="p-4 font-medium text-muted-foreground">Vencimento</th>
                    <th className="p-4 font-medium text-muted-foreground">Valor</th>
                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                    <th className="p-4 font-medium text-muted-foreground text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(m => {
                    const titular = titularesMap[m.titular_id];
                    return (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <Link to={`/titulares/${m.titular_id}`} className="font-medium hover:text-primary">
                            {m.titular_nome}
                          </Link>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{m.mes_referencia}</td>
                        <td className="p-4">{m.data_vencimento ? format(new Date(m.data_vencimento), "dd/MM/yyyy") : "—"}</td>
                        <td className="p-4 font-medium">R$ {m.valor?.toFixed(2)}</td>
                        <td className="p-4"><StatusBadge status={m.status} /></td>
                        <td className="p-4 text-right">
                          {m.status !== "pago" && titular && (
                            <WhatsAppButton
                              telefone={titular.telefone}
                              nome={m.titular_nome}
                              valor={m.valor}
                              mesReferencia={m.mes_referencia}
                            />
                          )}
                          {m.status === "pago" && m.data_pagamento && (
                            <span className="text-xs text-muted-foreground">
                              Pago em {format(new Date(m.data_pagamento), "dd/MM/yyyy")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}