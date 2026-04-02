import { useState, useEffect } from "react";
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
  const [activeModule, setActiveModule] = useState(() => {
    const path = window.location.pathname;
    return modules[1].items.some(i => i.path === path) ? 1 : 0;
  });

  useEffect(() => {
    const idx = modules[1].items.some(i => i.path === location.pathname) ? 1 : 0;
    setActiveModule(idx);
  }, [location.pathname]);

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
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="bg-white rounded-lg p-4 flex-1">
            <img 
              src="https://media.base44.com/images/public/69ca9edf5c4f7d6c636a3ae7/ad698b204_logo_grupo-jardim-da-saudade_RcVWV1.png" 
              alt="Jardim da Saudade" 
              className="h-16 object-contain"
            />
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground ml-2">
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