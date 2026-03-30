import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const planoConfig = {
  basico: { label: "Básico", className: "bg-slate-100 text-slate-700 border-slate-200" },
  essencial: { label: "Essencial", className: "bg-blue-100 text-blue-700 border-blue-200" },
  premium: { label: "Premium", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function PlanoLabel({ plano }) {
  const config = planoConfig[plano] || { label: plano, className: "bg-gray-100 text-gray-700" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}