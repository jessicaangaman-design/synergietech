import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, Users, FileText, Wrench, RotateCcw, Menu, X, UserCog } from "lucide-react";
import logoSts from "@/assets/logo-sts.jpg.asset.json";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/prospects", label: "Prospects", icon: Users },
  { to: "/contrats", label: "Contrats", icon: FileText },
  { to: "/interventions", label: "Interventions", icon: Wrench },
  { to: "/equipe", label: "Équipe", icon: UserCog },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reset = useStore((s) => s.reset);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = (
    <>
      <div className="px-5 py-6 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">STS SARL</div>
            <div className="text-[11px] text-sidebar-foreground/60">Synergie Tech Solutions</div>
          </div>
        </div>
        <button
          className="lg:hidden text-sidebar-foreground/70"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
          onClick={() => {
            reset();
            toast.success("Données réinitialisées");
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser les données
        </Button>
        <div className="mt-3 text-[10px] text-sidebar-foreground/50 px-2">
          Prototype · données en mémoire · Cocody Angré, Abidjan
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {NavContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            {NavContent}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
          <button
            className="p-1.5 -ml-1.5 rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="font-semibold text-sm">STS SARL</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
