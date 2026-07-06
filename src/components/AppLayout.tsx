import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, Wrench, ShieldCheck, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/prospects", label: "Prospects", icon: Users },
  { to: "/contrats", label: "Contrats", icon: FileText },
  { to: "/interventions", label: "Interventions", icon: Wrench },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reset = useStore((s) => s.reset);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">STS SARL</div>
              <div className="text-[11px] text-sidebar-foreground/60">Synergie Tech Solutions</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
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
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
