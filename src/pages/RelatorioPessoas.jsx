import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import PlanoLabel from "@/components/shared/PlanoLabel";
import { differenceInYears, format, parseISO } from "date-fns";
import { Users } from "lucide-react";

const calcIdade = (d) => {
  if (!d) return "—";
  return differenceInYears(new Date(), parseISO(d)) + " anos";
};

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd/MM/yyyy"); } catch { return d; }
};

export default function RelatorioPessoas() {
  const { data: titulares = [], isLoading } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => base44.entities.Titular.list("-data_adesao"),
  });

  const ativos = titulares.filter(t => t.status === "ativo").length;
  const inativos = titulares.filter(t => t.status === "inativo").length;
  const suspensos = titulares.filter(t => t.status === "suspenso").length;

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
        <h1 className="text-2xl md:text-3xl font-serif font-bold">Relatório de Pessoas</h1>
        <p className="text-muted-foreground text-sm mt-1">Cadastro geral de titulares inscritos no plano</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Cadastrados", value: titulares.length, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
          { label: "Ativos", value: ativos, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Inativos", value: inativos, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
          { label: "Suspensos", value: suspensos, color: "text-red-600", bg: "bg-red-50 border-red-200" },
        ].map(card => (
          <Card key={card.label} className={`border ${card.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{titulares.length} pessoa(s) cadastrada(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Nome Completo", "CPF", "Data de Entrada", "Idade", "Plano", "Tipo", "Status"].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {titulares.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.cpf}</td>
                    <td className="px-4 py-3">{formatDate(t.data_adesao)}</td>
                    <td className="px-4 py-3">{calcIdade(t.data_nascimento)}</td>
                    <td className="px-4 py-3"><PlanoLabel plano={t.nome_plano} /></td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{t.tipo_plano}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}