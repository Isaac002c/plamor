import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus, CreditCard, Pencil, Trash2, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import PlanoLabel from "@/components/shared/PlanoLabel";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import DependenteForm from "@/components/titulares/DependenteForm";
import MensalidadeForm from "@/components/titulares/MensalidadeForm";
import TitularForm from "@/components/titulares/TitularForm";
import { format } from "date-fns";

export default function TitularDetalhes() {
  const urlParams = new URLSearchParams(window.location.search);
  const titularId = window.location.pathname.split("/").pop();
  const queryClient = useQueryClient();

  const [showDepForm, setShowDepForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: titulares = [] } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list(),
  });

  const titular = titulares.find(t => t.id === titularId);

  const { data: dependentes = [] } = useQuery({
    queryKey: ["dependentes", titularId],
    queryFn: () => base44.entities.Dependente.filter({ titular_id: titularId }),
    enabled: !!titularId,
  });

  const { data: mensalidades = [] } = useQuery({
    queryKey: ["mensalidades", titularId],
    queryFn: () => base44.entities.Mensalidade.filter({ titular_id: titularId }, "-data_vencimento"),
    enabled: !!titularId,
  });

  const createDep = useMutation({
    mutationFn: (data) => base44.entities.Dependente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependentes", titularId] });
      setShowDepForm(false);
    },
  });

  const deleteDep = useMutation({
    mutationFn: (id) => base44.entities.Dependente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependentes", titularId] }),
  });

  const updateMens = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mensalidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensalidades", titularId] });
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
    },
  });

  const updateTitular = useMutation({
    mutationFn: (data) => base44.entities.Titular.update(titularId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["titulares"] });
      setShowEditForm(false);
    },
  });

  if (!titular) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const parentescoLabels = {
    conjuge: "Cônjuge", filho: "Filho", filha: "Filha", pai: "Pai", mae: "Mãe", outro: "Outro",
  };

  const markAsPago = (mensalidade) => {
    updateMens.mutate({
      id: mensalidade.id,
      data: { status: "pago", data_pagamento: new Date().toISOString().split("T")[0] },
    });
  };

  return (
    <div className="space-y-6">
      <Link to="/titulares" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar para titulares
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-serif font-bold">{titular.nome}</h1>
                <StatusBadge status={titular.status} />
                <PlanoLabel plano={titular.nome_plano} />
                {titular.tipo_plano === "familiar" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Familiar</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span>CPF: {titular.cpf}</span>
                {titular.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {titular.telefone}</span>}
                {titular.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {titular.email}</span>}
                {titular.endereco && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {titular.endereco}</span>}
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="font-semibold text-foreground">R$ {titular.valor_mensalidade?.toFixed(2)}/mês</span>
                <span className="text-muted-foreground">Vence dia {titular.dia_vencimento}</span>
                {titular.data_adesao && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" /> Desde {format(new Date(titular.data_adesao), "dd/MM/yyyy")}</span>}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditForm(true)}>
              <Pencil className="w-4 h-4" /> Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dependentes */}
      {titular.tipo_plano === "familiar" && (
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

      {/* Mensalidades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Histórico de Mensalidades</CardTitle>
        </CardHeader>
        <CardContent>
          {mensalidades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensalidade registrada.</p>
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
                  {mensalidades.map(m => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3">{m.mes_referencia}</td>
                      <td className="py-3">{m.data_vencimento ? format(new Date(m.data_vencimento), "dd/MM/yyyy") : "—"}</td>
                      <td className="py-3 font-medium">R$ {m.valor?.toFixed(2)}</td>
                      <td className="py-3"><StatusBadge status={m.status} /></td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.status !== "pago" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => markAsPago(m)}>
                                Marcar Pago
                              </Button>
                              <WhatsAppButton
                                telefone={titular.telefone}
                                nome={titular.nome}
                                valor={m.valor}
                                mesReferencia={m.mes_referencia}
                              />
                            </>
                          )}
                          {m.status === "pago" && m.data_pagamento && (
                            <span className="text-xs text-muted-foreground">
                              Pago em {format(new Date(m.data_pagamento), "dd/MM/yyyy")}
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

      <DependenteForm open={showDepForm} onClose={() => setShowDepForm(false)} onSubmit={(data) => createDep.mutate(data)} titularId={titularId} />
      {showEditForm && (
        <TitularForm open={showEditForm} onClose={() => setShowEditForm(false)} onSubmit={(data) => updateTitular.mutate(data)} editData={titular} />
      )}
    </div>
  );
}