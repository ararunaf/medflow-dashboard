import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRANDING, defaultLogoUrl as defaultLogo } from "@/lib/assets";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { GuidedDemoStrip } from "@/components/pilot-launch/guided-demo-strip";
import { PilotFeedbackShell } from "@/components/pilot-launch/pilot-feedback-shell";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { useTenantBranding } from "@/components/tenant-branding-provider";
import type { UserRole } from "@/lib/database.types";
import {
  MoreNavIcon,
  buildBreadcrumbs,
  flattenNavItems,
  itemMatchKey,
  mobilePrimaryIdsForRole,
  navGroupsForRole,
  resolveActiveNavItem,
  type NavGroup,
  type NavItem,
} from "@/lib/navigation";

function NavLinkRow({
  item,
  active,
  compact,
  onNavigate,
  surface = "sidebar",
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
  surface?: "sidebar" | "panel";
}) {
  const Icon = item.icon;
  const activeClass =
    surface === "sidebar" ? "bg-sidebar-accent text-sidebar-primary" : "bg-primary/10 text-primary";
  const idleClass =
    surface === "sidebar"
      ? "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      : "text-foreground/80 hover:bg-muted hover:text-foreground";

  return (
    <Link
      to={item.to}
      search={item.search}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors motion-safe:duration-150",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
        active ? activeClass : idleClass,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate flex-1">{item.label}</span>
      {item.placeholder ? (
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
          Fase 3
        </span>
      ) : null}
    </Link>
  );
}

function SidebarGroup({
  group,
  open,
  onToggle,
  activeId,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  activeId: string | null;
}) {
  return (
    <div
      className={cn("rounded-lg", group.accent && "bg-primary/[0.04] ring-1 ring-primary/15 p-1")}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider",
          group.accent
            ? "text-primary"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80",
        )}
        aria-expanded={open}
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform motion-safe:duration-150",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-0.5 pb-1">
          {group.items.map((item) => (
            <NavLinkRow
              key={itemMatchKey(item) + item.id}
              item={item}
              active={activeId === item.id}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
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
  const searchStr = useMemo(() => {
    const fromRouter =
      typeof (location as { searchStr?: unknown }).searchStr === "string"
        ? (location as { searchStr: string }).searchStr
        : "";
    if (fromRouter) return fromRouter.startsWith("?") ? fromRouter.slice(1) : fromRouter;
    const search = location.search as Record<string, unknown> | undefined;
    if (!search || typeof search !== "object") return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value == null || value === "") continue;
      params.set(key, String(value));
    }
    return params.toString();
  }, [location]);
  const { settings } = useTenantBranding();
  const role = roleProp ?? auth.profile?.role ?? null;

  const groups = useMemo(() => navGroupsForRole(role), [role]);
  const navItems = useMemo(() => flattenNavItems(groups), [groups]);
  const primaryIds = useMemo(() => mobilePrimaryIdsForRole(role), [role]);

  const activeItem = useMemo(
    () => resolveActiveNavItem(navItems, pathname, searchStr),
    [navItems, pathname, searchStr],
  );
  const activeId = activeItem?.id ?? null;

  const crumbs = useMemo(
    () => buildBreadcrumbs(pathname, searchStr, role),
    [pathname, searchStr, role],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const group of groups) {
        if (next[group.id] === undefined) {
          next[group.id] = group.defaultOpen ?? false;
        }
        if (group.items.some((item) => item.id === activeId)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [groups, activeId]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname, searchStr]);

  const logoSrc = settings?.logo_url?.trim() || defaultLogo;
  const logoAlt = settings?.institution_name?.trim() || BRANDING.productName;
  const footerLabel = settings?.institution_name?.trim() || BRANDING.productName;

  const primaryItems = primaryIds
    .map((id) => navItems.find((item) => item.id === id))
    .filter((item): item is NavItem => item != null);

  const showBreadcrumbs = pathname !== "/";

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
          <div className="w-full rounded-md bg-primary/10 px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Centro Operacional
            </div>
          </div>
        </div>
        <nav
          className="flex-1 px-2 py-4 space-y-2 overflow-y-auto"
          aria-label="Navegação principal"
        >
          {groups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              open={openGroups[group.id] ?? false}
              onToggle={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
              activeId={activeId}
            />
          ))}
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
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Centro Operacional
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8 px-4 lg:px-8 py-4 lg:py-8 max-w-7xl w-full mx-auto motion-safe:transition-opacity motion-safe:duration-200">
          {showBreadcrumbs ? <Breadcrumbs crumbs={crumbs} /> : null}
          {children}
        </main>

        <GuidedDemoStrip />
        <PilotFeedbackShell enabled={!!auth.session} />

        {/* Mobile bottom nav — primários + Mais */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border"
          aria-label="Navegação móvel"
        >
          <ul className="grid grid-cols-6">
            {primaryItems.slice(0, 5).map((item) => {
              const active = item.id === activeId;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    search={item.search}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[10px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                    <span className="truncate max-w-[4.5rem] text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 py-2.5 px-1 text-[10px] font-medium transition-colors",
                  moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-expanded={moreOpen}
                aria-controls="mobile-more-nav"
              >
                {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="leading-tight">Mais</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Mobile “Mais” panel */}
        {moreOpen ? (
          <div className="lg:hidden fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Fechar menu"
              onClick={() => setMoreOpen(false)}
            />
            <div
              id="mobile-more-nav"
              className="absolute bottom-0 inset-x-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-surface border-t border-border shadow-xl pb-20"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MoreNavIcon className="h-4 w-4 text-primary" />
                  Navegação
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-2 py-3 space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      "rounded-xl border border-border p-2",
                      group.accent && "border-primary/30 bg-primary/[0.03]",
                    )}
                  >
                    <div
                      className={cn(
                        "px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider",
                        group.accent ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavLinkRow
                          key={item.id}
                          item={item}
                          active={activeId === item.id}
                          compact
                          surface="panel"
                          onNavigate={() => setMoreOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
