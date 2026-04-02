import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Search, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TitularForm from "@/components/titulares/TitularForm";
import StatusBadge from "@/components/shared/StatusBadge";
import PlanoLabel from "@/components/shared/PlanoLabel";
import { gerarMensalidadesAutomaticas, abonarMensalidades } from "@/lib/gerarMensalidades";

export default function Titulares() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const queryClient = useQueryClient();

  const { data: titulares = [], isLoading } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const titular = await base44.entities.Titular.create(data);
      
      // Gerar mensalidades automaticamente
      if (data.nome_plano === "plamor8") {
        await gerarMensalidadesAutomaticas(titular);
      } else if (data.nome_plano === "igreja") {
        // Para Igreja, gerar abonadas
        await gerarMensalidadesAutomaticas({ ...titular, nome_plano: "plamor8" });
        await abonarMensalidades(titular.id);
      }
      
      return titular;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["titulares"] });
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
      setShowForm(false);
    },
  });

  const filtered = titulares.filter(t => {
    const matchSearch = t.nome?.toLowerCase().includes(search.toLowerCase()) || t.cpf?.includes(search);
    const matchStatus = filterStatus === "todos" || t.status === filterStatus;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Titulares</h1>
          <p className="text-muted-foreground text-sm mt-1">{titulares.length} cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Titular
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
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
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum titular encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(titular => (
            <Card key={titular.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                       <Link to={`/titulares/${titular.id}`} className="font-semibold text-foreground hover:text-primary truncate">
                         {titular.nome}
                       </Link>
                       <StatusBadge status={titular.status} />
                       <PlanoLabel plano={titular.nome_plano} />
                     </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {titular.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {titular.telefone}
                        </span>
                      )}
                      <span className="font-medium text-foreground">R$ {titular.valor_mensalidade?.toFixed(2)}/mês</span>
                    </div>
                  </div>
                  <Link to={`/titulares/${titular.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" /> Detalhes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TitularForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}