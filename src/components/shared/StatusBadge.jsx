import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  pago: { label: "Pago", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-800 border-amber-200" },
  atrasado: { label: "Atrasado", className: "bg-red-100 text-red-800 border-red-200" },
  ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  inativo: { label: "Inativo", className: "bg-gray-100 text-gray-800 border-gray-200" },
  suspenso: { label: "Suspenso", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs text-center", config.className)}>
      {config.label}
    </Badge>
  );
}