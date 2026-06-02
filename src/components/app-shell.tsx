import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  Stethoscope,
  Wallet,
  User,
  FileText,
  LayoutDashboard,
  Lock,
  Building2,
  Sparkles,
  Radio,
  HelpCircle,
  Rocket,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRANDING, defaultLogoUrl as defaultLogo } from "@/lib/assets";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { GuidedDemoStrip } from "@/components/pilot-launch/guided-demo-strip";
import { PilotFeedbackShell } from "@/components/pilot-launch/pilot-feedback-shell";
import { can } from "@/lib/auth/rbac";
import { useTenantBranding } from "@/components/tenant-branding-provider";
import type { UserRole } from "@/lib/database.types";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  /** Se definido, exige capability; caso contrário, sempre visível com sessão. */
  require?: "financial" | "tenant_settings_read";
};

function navForRole(role: UserRole | null | undefined): NavItem[] {
  const base: NavItem[] = [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/piloto", label: "Piloto", icon: Rocket, require: "tenant_settings_read" },
    { to: "/lancamento", label: "Go-live", icon: Flag, require: "tenant_settings_read" },
    { to: "/ajuda", label: "Ajuda", icon: HelpCircle },
    { to: "/executivo", label: "Executivo", icon: Sparkles, require: "financial" },
    { to: "/escalas", label: "Escalas", icon: CalendarDays },
    { to: "/plantoes", label: "Plantões", icon: Stethoscope },
    { to: "/financeiro", label: "Financeiro", icon: Wallet, require: "financial" },
    {
      to: "/financeiro/dashboard-executivo",
      label: "Dashboard fin.",
      icon: LayoutDashboard,
      require: "financial",
    },
    {
      to: "/financeiro/fechamento-operacional",
      label: "Fechamento",
      icon: Lock,
      require: "financial",
    },
    { to: "/tiss", label: "TISS", icon: FileText },
    { to: "/instituicao", label: "Instituição", icon: Building2 },
    { to: "/operacao", label: "Painel ops", icon: Radio, require: "tenant_settings_read" },
    { to: "/perfil", label: "Perfil", icon: User },
  ];

  return base.filter((item) => {
    if (item.require === "financial") {
      return can(role, "financial_closing:read");
    }
    if (item.require === "tenant_settings_read") {
      return can(role, "tenant_settings:read");
    }
    return true;
  });
}

export function AppShell({
  children,
  role: roleProp,
}: {
  children: ReactNode;
  /** Opcional: sobrescreve o perfil vindo do contexto de auth. */
  role?: UserRole | null;
}) {
  const { auth } = useRouteContext({ from: "__root__" });
  const location = useLocation();
  const pathname = location.pathname;
  const { settings } = useTenantBranding();

  const navItems = useMemo(
    () => navForRole(roleProp ?? auth.profile?.role ?? null),
    [roleProp, auth.profile?.role],
  );

  const activeNavTo = useMemo(() => {
    const matches = navItems.filter((item) =>
      item.exact
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`),
    );
    return matches.sort((a, b) => b.to.length - a.to.length)[0]?.to ?? null;
  }, [pathname, navItems]);

  const logoSrc = settings?.logo_url?.trim() || defaultLogo;
  const logoAlt = settings?.institution_name?.trim() || BRANDING.productName;
  const footerLabel = settings?.institution_name?.trim() || BRANDING.productName;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors duration-200">
        <div className="px-6 py-6 bg-surface border-b border-sidebar-border flex flex-col items-center justify-center gap-3">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="w-auto max-w-[200px] object-contain max-h-24 motion-safe:transition-transform motion-safe:duration-200"
            loading="lazy"
            decoding="async"
          />
          {settings?.banner_url?.trim() ? (
            <img
              src={settings.banner_url.trim()}
              alt=""
              className="w-full max-h-16 rounded-lg object-cover border border-sidebar-border"
              loading="lazy"
            />
          ) : null}
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.to === activeNavTo;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors motion-safe:duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 text-xs text-sidebar-foreground/60 border-t border-sidebar-border space-y-1">
          <div>v1.0 · {BRANDING.productName}</div>
          <div className="truncate text-sidebar-foreground/50">{footerLabel}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border">
          <div className="flex flex-col items-center justify-center px-4 py-3 gap-2">
            <img
              src={logoSrc}
              alt={logoAlt}
              className="w-auto max-h-20 object-contain"
              loading="lazy"
            />
            {settings?.banner_url?.trim() ? (
              <img
                src={settings.banner_url.trim()}
                alt=""
                className="w-full max-h-14 rounded-lg object-cover border border-border"
                loading="lazy"
              />
            ) : null}
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8 px-4 lg:px-8 py-4 lg:py-8 max-w-7xl w-full mx-auto motion-safe:transition-opacity motion-safe:duration-200">
          {children}
        </main>

        <GuidedDemoStrip />
        <PilotFeedbackShell enabled={!!auth.session} />

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border overflow-x-auto">
          <ul className="flex min-w-max">
            {navItems.map((item) => {
              const active = item.to === activeNavTo;
              const Icon = item.icon;
              return (
                <li key={item.to} className="shrink-0 min-w-[4.5rem]">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 px-2 text-[10px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                    <span className="truncate max-w-[5rem] text-center leading-tight">
                      {item.label}
                    </span>
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
