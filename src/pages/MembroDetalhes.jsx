import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, UserPlus, Pencil, Trash2, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import DependenteForm from "@/components/membros/DependenteForm";
import MembroForm from "@/components/membros/MembroForm";
import { format } from "date-fns";

export default function MembroDetalhes() {
  const membroId = window.location.pathname.split("/").pop();
  const queryClient = useQueryClient();

  const [showDepForm, setShowDepForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: membros = [] } = useQuery({
    queryKey: ["membros"],
    queryFn: () => base44.entities.Titular.list(),  // Keep Titular entity for now
  });

  const membro = membros.find(m => m.id === membroId);

const { data: dependentes = [] } = useQuery({
    queryKey: ["dependentes", membroId],
    queryFn: () => base44.entities.Dependente.filter({ membro_id: membroId }),  // Fallback
    enabled: !!membroId,
  });

const { data: contribuicoes = [] } = useQuery({
    queryKey: ["contribucoes", membroId],
    queryFn: () => base44.entities.Mensalidade.filter({ membro_id: membroId }, "-data_vencimento"),
    enabled: !!membroId,
  });

  const createDep = useMutation({
    mutationFn: (data) => base44.entities.Dependente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependentes", membroId] });
      setShowDepForm(false);
    },
  });

  const deleteDep = useMutation({
    mutationFn: (id) => base44.entities.Dependente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependentes", membroId] }),
  });

  const updateContribuicao = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mensalidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contribucoes", membroId] });
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
    },
  });

  const updateMembro = useMutation({
    mutationFn: (data) => base44.entities.Titular.update(membroId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membros"] });
      setShowEditForm(false);
    },
  });

  if (!membro) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const parentescoLabels = {
    conjuge: "Cônjuge", filho: "Filho", filha: "Filha", pai: "Pai", mae: "Mãe", outro: "Outro",
  };

  const markAsPago = (contribuicao) => {
    updateContribuicao.mutate({
      id: contribuicao.id,
      data: { status: "pago", data_pagamento: new Date().toISOString().split("T")[0] },
    });
  };

  return (
    <div className="space-y-6">
      <Link to="/membros" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar para membros
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold">{membro.nome}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span>CPF: {membro.cpf}</span>
                {membro.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {membro.telefone}</span>}
                {membro.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {membro.email}</span>}
                {membro.endereco && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {membro.endereco}</span>}
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <StatusBadge status={membro.status} />
                {membro.cargo && <span className="font-semibold text-foreground">{membro.cargo.toUpperCase()}</span>}
                {membro.data_batismo && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" /> Bat. {format(new Date(membro.data_batismo), "dd/MM/yyyy")}</span>}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditForm(true)}>
              <Pencil className="w-4 h-4" /> Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dependentes */}
      {membro.tipo_plano === "familiar" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Dependentes ({dependentes.length})</CardTitle>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowDepForm(true)}>
                <UserPlus className="w-4 h-4" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dependentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dependente cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {dependentes.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{dep.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {parentescoLabels[dep.parentesco] || dep.parentesco}
                        {dep.cpf && ` · CPF: ${dep.cpf}`}
                        {dep.data_nascimento && ` · Nasc: ${format(new Date(dep.data_nascimento), "dd/MM/yyyy")}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteDep.mutate(dep.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contribuições */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Histórico de Contribuições</CardTitle>
        </CardHeader>
        <CardContent>
          {contribuicoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma contribuição registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Referência</th>
                    <th className="pb-3 font-medium text-muted-foreground">Vencimento</th>
                    <th className="pb-3 font-medium text-muted-foreground">Valor</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contribuicoes.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
<td className="py-3">{c.mes_ano || c.mes_referencia}</td>
                      <td className="py-3">{c.data_vencimento ? format(new Date(c.data_vencimento), "dd/MM/yyyy") : "—"}</td>
                      <td className="py-3 font-medium">R$ {c.valor_dizimo?.toFixed(2) || c.valor?.toFixed(2)}</td>
                      <td className="py-3"><StatusBadge status={c.status} /></td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status !== "pago" && (
                            <>
<Button variant="outline" size="sm" onClick={() => markAsPago(c)}>
                                Marcar Pago
                              </Button>
                              <WhatsAppButton
                                telefone={membro.telefone}
                                nome={membro.nome}
                                valor={c.valor_dizimo || c.valor}
                                mesReferencia={c.mes_ano || c.mes_referencia}
                              />
                            </>
                          )}
                          {c.status === "pago" && c.data_pagamento && (
                            <span className="text-xs text-muted-foreground">
                              Pago em {format(new Date(c.data_pagamento), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DependenteForm open={showDepForm} onClose={() => setShowDepForm(false)} onSubmit={(data) => createDep.mutate(data)} membroId={membroId} _membro={membro} />
      {showEditForm && (
<MembroForm open={showEditForm} onClose={() => setShowEditForm(false)} onSubmit={(data) => updateMembro.mutate(data)} editData={membro} />
      )}
    </div>
  );
}

