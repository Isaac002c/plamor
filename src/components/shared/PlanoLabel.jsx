import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const planoConfig = {
  plamor8: { label: "Plamor 8", className: "bg-slate-100 text-slate-700 border-slate-200" },
  igreja: { label: "Igreja", className: "bg-green-100 text-green-700 border-green-200" },
};

export default function PlanoLabel({ plano }) {
  const config = planoConfig[plano] || { label: plano, className: "bg-gray-100 text-gray-700" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}