import { Link, useLocation } from "@tanstack/react-router";
import { Home, CalendarDays, Stethoscope, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-medflow.png";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/escalas", label: "Escalas", icon: CalendarDays },
  { to: "/plantoes", label: "Plantões", icon: Stethoscope },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 bg-surface border-b border-sidebar-border flex items-center justify-center">
          <img src={logo} alt="MedFlow-IA" className="h-25 w-auto" style={{ height: "6.25rem" }} />
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 text-xs text-sidebar-foreground/60 border-t border-sidebar-border">
          v0.1 · MedFlow-IA
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border">
          <div className="flex items-center justify-center px-4 py-3">
            <img src={logo} alt="MedFlow-IA" className="w-auto" style={{ height: "6.25rem" }} />
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8 px-4 lg:px-8 py-4 lg:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border">
          <ul className="grid grid-cols-5">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
