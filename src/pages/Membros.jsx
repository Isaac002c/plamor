import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import churchos from "@/api/churchos.js";
import { Link } from "react-router-dom";
import { Plus, Search, Phone, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MembroForm from "@/components/membros/MembroForm";
import StatusBadge from "@/components/shared/StatusBadge";
import CargoLabel from "@/components/shared/CargoLabel";

export default function Membros() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const queryClient = useQueryClient();

  const { data: membros = [], isLoading } = useQuery({
    queryKey: ["membros"],
    queryFn: () => churchos.membros.listar({ sort: '-created_at' }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const membro = await churchos.membros.criar(data);
      return membro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membros"] });
      setShowForm(false);
    },
  });

  const filtered = membros.filter(m => {
    const matchSearch = m.nome?.toLowerCase().includes(search.toLowerCase()) || m.cpf?.includes(search);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Membros</h1>
          <p className="text-muted-foreground text-sm mt-1">{membros.length} cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Membro
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left Asc left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            <p>Nenhum membro encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(membro => (
            <Card key={membro.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-3 items-start">
                  {/* Coluna 1: Nome + Telefone + CPF */}
                  <div>
                    <Link to={`/membros/${membro.id}`} className="font-semibold text-foreground hover:text-primary truncate block">
                      {membro.nome}
                    </Link>
                    {membro.telefone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Phone className="w-3 h-3" /> {membro.telefone}
                      </div>
                    )}
                    {membro.cpf && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" /> {membro.cpf}
                      </div>
                    )}
                  </div>

                  {/* Coluna 2: Status, Cargo */}
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={membro.status} />
                    <CargoLabel cargo={membro.cargo} />
                  </div>

                  {/* Coluna 3: Tipo, Batismo */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium text-center min-w-[100px]">
                      {membro.sexo === "masculino" ? "Masculino" : "Feminino"}
                    </span>
                    {membro.data_batismo && (
                      <span className="text-xs text-muted-foreground text-center">
                        Bat. {new Date(membro.data_batismo).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})}
                      </span>
                    )}
                  </div>

                  {/* Coluna 4: Botão Detalhes */}
                  <div className="flex justify-end mt-6">
                    <Link to={`/membros/${membro.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" /> Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MembroForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}

