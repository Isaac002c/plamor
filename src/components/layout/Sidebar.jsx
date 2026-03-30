import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, BarChart2, FileText, X, UserSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    label: null,
    items: [
      { label: "Painel", icon: LayoutDashboard, path: "/" },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { label: "Titulares", icon: Users, path: "/titulares" },
      { label: "Mensalidades", icon: CreditCard, path: "/mensalidades" },
      { label: "Rel. de Pessoas", icon: UserSquare2, path: "/relatorio-pessoas" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Rel. Financeiro", icon: BarChart2, path: "/relatorio-financeiro" },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-sidebar-primary">Memorial</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Gestão de Planos</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {modules.map((mod, i) => (
            <div key={i}>
              {mod.label && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-1">
                  {mod.label}
                </p>
              )}
              <div className="space-y-0.5">
                {mod.items.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive(item.path)
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 text-center">© 2026 Memorial Gestão</p>
        </div>
      </aside>
    </>
  );
}