import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pago: { label: "Pago", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-800 border-amber-200" },
  atrasado: { label: "Atrasado", className: "bg-red-100 text-red-800 border-red-200" },
  ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  inativo: { label: "Inativo", className: "bg-gray-100 text-gray-800 border-gray-200" },
  suspenso: { label: "Suspenso", className: "bg-red-100 text-red-800 border-red-200" }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-medium text-center rounded-[10px] inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[100px] border-emerald-200">
      {config.label}
    </Badge>);

}