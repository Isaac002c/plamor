import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, BarChart2, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    label: "Secretária",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Pessoas", icon: Users, path: "/titulares" },
      { label: "Relatórios", icon: FileText, path: "/relatorio-pessoas" },
    ],
  },
  {
    label: "Tesourária",
    items: [
      { label: "Mensalidades", icon: CreditCard, path: "/mensalidades" },
      { label: "Rel. Financeiro", icon: BarChart2, path: "/relatorio-financeiro" },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState(0);

  const isActive = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const currentItems = modules[activeModule].items;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-56 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="font-serif text-base font-bold text-sidebar-primary leading-tight whitespace-nowrap">PLAMOR CAEADMAS</h1>
            <p className="text-[10px] text-sidebar-foreground/60 mt-0.5 whitespace-nowrap">Gestão de Mensalidades</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Tabs */}
        <div className="flex border-b border-sidebar-border">
          {modules.map((mod, i) => (
            <button
              key={i}
              onClick={() => setActiveModule(i)}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all",
                activeModule === i
                  ? "text-sidebar-primary border-b-2 border-sidebar-primary bg-sidebar-accent/30"
                  : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
              )}
            >
              {mod.label}
            </button>
          ))}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {currentItems.map((item) => (
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
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 text-center">© 2026 Memorial Gestão</p>
        </div>
      </aside>
    </>
  );
}