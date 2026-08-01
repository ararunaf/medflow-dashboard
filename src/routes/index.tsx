import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { OperationalIaHomeCard } from "@/components/operational/operational-ia-home-card";
import { IaLegend } from "@/components/operational/ia-legend";
import { PilotHomeBanner } from "@/components/pilot-launch/pilot-home-banner";
import {
  operationalReadinessQueryOptions,
  useOperationalReadinessQuery,
} from "@/hooks/use-commercial-readiness";
import { buildOnboardingProgress } from "@/lib/services/onboarding-progress";
import { buildPilotDeploymentChecklist } from "@/lib/services/deployment-checklist/deployment-checklist-service";
import { usePilotManualFlags } from "@/hooks/use-pilot-manual-flags";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonRow,
  StatCard,
  StatusBadge,
} from "@/components/ui-kit";
import { Activity, CalendarCheck, Stethoscope, Users, AlertTriangle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { operationalCommandCenterQueryOptions } from "@/hooks/use-operational-metrics";
import { useDashboardQuery, dashboardQueryOptions } from "@/hooks/use-operations";
import { formatTime, shiftStatusToBadge } from "@/lib/queries/adapters";
import { describeError } from "@/lib/queries/result";
import { can, isOperationalManager } from "@/lib/auth/rbac";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Dashboard") },
      { name: "description", content: "Visão operacional em tempo real." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(dashboardQueryOptions()).catch(() => undefined),
      context.queryClient.prefetchQuery(operationalReadinessQueryOptions()).catch(() => undefined),
      context.queryClient
        .prefetchQuery(operationalCommandCenterQueryOptions())
        .catch(() => undefined),
    ]);
  },
  component: HomePage,
});

function greetingFor(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  if (!name) return part;
  const first = name.split(/\s+/)[0] ?? "";
  return `${part}, ${first}`;
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function HomePage() {
  const { auth } = useRouteContext({ from: "__root__" });
  const mounted = useClientMounted();
  const dashboard = useDashboardQuery();
  const readiness = useOperationalReadinessQuery();
  const canExec = can(auth.profile?.role ?? null, "financial_closing:read");
  const canPilot = can(auth.profile?.role ?? null, "tenant_settings:read");
  const canSeeIa = isOperationalManager(auth.profile?.role ?? null);
  const tenantId = auth.tenantId ?? undefined;
  const manualFlags = usePilotManualFlags(tenantId);

  const [title, setTitle] = useState("Bom dia");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (!mounted) return;
    setTitle(greetingFor(auth.profile?.full_name));
    setSubtitle(todayLabel());
  }, [mounted, auth.profile?.full_name]);

  const pilotProgress = useMemo(() => {
    if (!readiness.data || !canPilot) return null;
    const manual = manualFlags;
    const deployment = buildPilotDeploymentChecklist({
      settings: readiness.data.settings,
      health: readiness.data.health,
      operationalChecklist: readiness.data.checklist,
      snapshot: readiness.data.pilotSnapshot,
      manual,
    });
    return buildOnboardingProgress(
      {
        deploymentDone: deployment.filter((i) => i.done).length,
        deploymentTotal: deployment.length,
        operationalDone: readiness.data.checklist.filter((i) => i.done).length,
        operationalTotal: readiness.data.checklist.length,
      },
      { readClientStorage: mounted },
    );
  }, [readiness.data, canPilot, manualFlags, mounted]);

  return (
    <AppShell>
      {pilotProgress ? (
        <PilotHomeBanner
          overallPercent={pilotProgress.overallPercent}
          pilotReady={pilotProgress.pilotReady}
        />
      ) : null}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <Link
              to="/piloto"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              Implantação piloto →
            </Link>
            <Link
              to="/ajuda"
              className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Central de ajuda →
            </Link>
            {canExec ? (
              <Link
                to="/executivo"
                className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
              >
                Início executivo →
              </Link>
            ) : null}
            <Link
              to="/central"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              Central de IA →
            </Link>
          </div>
        }
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Plantões disponíveis"
          value={dashboard.isLoading ? "…" : (dashboard.data?.metrics.openShifts ?? 0)}
          hint="abertos no tenant"
          icon={<CalendarCheck className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Confirmados"
          value={dashboard.isLoading ? "…" : (dashboard.data?.metrics.confirmedThisWeek ?? 0)}
          hint="esta semana"
          icon={<Activity className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Trocas pendentes"
          value={dashboard.isLoading ? "…" : (dashboard.data?.metrics.pendingSwaps ?? 0)}
          hint="solicitações"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Disponibilidade"
          value={
            dashboard.isLoading
              ? "…"
              : dashboard.data?.metrics.availableForShifts
                ? "Ativa"
                : "Inativa"
          }
          hint={
            dashboard.data?.metrics.availableForShifts ? "aberto a plantões" : "edite no perfil"
          }
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={dashboard.data?.metrics.availableForShifts ? "success" : "warning"}
        />
      </div>

      {canSeeIa ? (
        <div className="mt-4">
          <OperationalIaHomeCard />
          <IaLegend className="mt-2 px-1" />
        </div>
      ) : null}

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-card border border-border ring-soft">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Escala do dia</h2>
            <button
              type="button"
              onClick={() => dashboard.refetch()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {dashboard.isFetching ? "Atualizando…" : "Atualizar"}
            </button>
          </div>

          {dashboard.isLoading ? (
            <div className="p-5 space-y-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : dashboard.isError ? (
            <div className="p-5">
              <ErrorState
                message={describeError(dashboard.error).message}
                onRetry={() => dashboard.refetch()}
              />
            </div>
          ) : (dashboard.data?.today.length ?? 0) === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nenhum plantão hoje"
                description="Quando houver escala para o dia, ela aparece aqui."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {dashboard.data!.today.map((s) => (
                <li key={s.shiftId} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-14 shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatTime(s.startsAt)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {s.departmentName}
                      {s.unitName ? (
                        <span className="text-muted-foreground"> · {s.unitName}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.confirmedProfessionalName ?? "Sem confirmação"}
                    </div>
                  </div>
                  <StatusBadge
                    status={shiftStatusToBadge(s.status, !!s.confirmedProfessionalName)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card ring-soft">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[color:var(--secondary)]" />
              <h2 className="text-sm font-semibold">Visão operacional</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm text-foreground">
                Plantões em aberto no tenant:{" "}
                <span className="font-semibold text-primary">
                  {dashboard.data?.metrics.openShifts ?? 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Os contadores e a Central de IA Operacional atualizam automaticamente via Supabase
                Realtime (invalidação TanStack Query).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card ring-soft">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Trocas em andamento</h2>
            </div>
            <div className="p-5">
              <div className="text-sm">
                <span className="font-semibold">{dashboard.data?.metrics.pendingSwaps ?? 0}</span>{" "}
                {dashboard.data?.metrics.pendingSwaps === 1
                  ? "solicitação aguarda resposta"
                  : "solicitações aguardam resposta"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
