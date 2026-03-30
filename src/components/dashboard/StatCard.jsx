import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }) {
  const variants = {
    default: "from-primary/10 to-primary/5 border-primary/20",
    success: "from-emerald-50 to-emerald-50/50 border-emerald-200",
    warning: "from-amber-50 to-amber-50/50 border-amber-200",
    danger: "from-red-50 to-red-50/50 border-red-200",
  };

  const iconVariants = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <Card className={cn("bg-gradient-to-br border p-5", variants[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-2 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", iconVariants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}