import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useSWRConfig } from "swr";

import logoSts from "@/assets/logo-sts.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { getAppSection, NAVIGATION_BY_SECTION, type NavigationIcon } from "@/config/navigation";
import useAuth from "@/hooks/authUser";

const NAVIGATION_ICONS: Record<NavigationIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  prospects: Users,
  contracts: FileText,
  clients: Building2,
  interventions: Wrench,
  team: UserCog,
};

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const logout = useAuth((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const section = getAppSection(pathname);
  const basePath = `/${section}`;
  const navItems = NAVIGATION_BY_SECTION[section].map((item) => ({
    ...item,
    to: `${basePath}/${item.path}`,
    icon: NAVIGATION_ICONS[item.icon],
  }));

  const NavContent = (
    <>
      <div className="px-5 py-6 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-white grid place-items-center overflow-hidden ring-1 ring-sidebar-border">
            <img src={logoSts.url} alt="STS SARL" className="h-full w-full object-contain" />
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
        {navItems.map((n) => {
          const active = pathname === n.to || pathname.startsWith(`${n.to}/`);
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
          className="mb-3 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          onClick={() => {
            logout();
            void mutate(() => true, undefined, { revalidate: false });
            navigate("/", { replace: true });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
        <div className="text-[10px] text-sidebar-foreground/50 px-2">
          Application connectée à l’API · Cocody Angré, Abidjan
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
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
            <div className="h-7 w-7 rounded-md bg-white grid place-items-center overflow-hidden ring-1 ring-border">
              <img src={logoSts.url} alt="STS" className="h-full w-full object-contain" />
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
