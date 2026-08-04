import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { OperationalIaHomeCard } from "@/components/operational/operational-ia-home-card";
import { IaLegend } from "@/components/operational/ia-legend";
import { PilotHomeBanner } from "@/components/pilot-launch/pilot-home-banner";
import { DocumentalQuickActions } from "@/components/navigation/documental-quick-actions";
import { OperationalCenterHub } from "@/components/navigation/operational-center-hub";
import { quickActionsForRole } from "@/lib/navigation";
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
import { Activity, CalendarCheck, Stethoscope, Users, AlertTriangle } from "lucide-react";
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
      { title: brandPageTitle("Centro Operacional") },
      {
        name: "description",
        content: "Centro Operacional — fluxos de captura, processamento, auditoria e faturamento.",
      },
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
  const role = auth.profile?.role ?? null;
  const canExec = can(role, "financial_closing:read");
  const canPilot = can(role, "tenant_settings:read");
  const canSeeIa = isOperationalManager(role);
  const tenantId = auth.tenantId ?? undefined;
  const manualFlags = usePilotManualFlags(tenantId);
  const quickActions = useMemo(() => quickActionsForRole(role), [role]);

  const [title, setTitle] = useState("Centro Operacional");
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
      <PageHeader
        title={title}
        subtitle={
          subtitle
            ? `${subtitle} · Centro Operacional`
            : "Centro Operacional — visão do fluxo de trabalho"
        }
        actions={
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            {canExec ? (
              <Link
                to="/processamento"
                search={{ queue: undefined }}
                className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
              >
                Processamento →
              </Link>
            ) : null}
            {canSeeIa ? (
              <Link
                to="/central"
                className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
              >
                Central IA →
              </Link>
            ) : null}
            <Link
              to="/ajuda"
              className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Ajuda →
            </Link>
          </div>
        }
      />

      {pilotProgress ? (
        <div className="mb-4">
          <PilotHomeBanner
            overallPercent={pilotProgress.overallPercent}
            pilotReady={pilotProgress.pilotReady}
          />
        </div>
      ) : null}

      <DocumentalQuickActions actions={quickActions} className="mb-5" />

      <OperationalCenterHub role={role} className="mb-6" />

      {canSeeIa ? (
        <div className="mb-6">
          <OperationalIaHomeCard />
          <IaLegend className="mt-2 px-1" />
        </div>
      ) : null}

      {/* Plantões — eixo clínico secundário no Centro Operacional */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Plantões e cobertura</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão clínica complementar ao fluxo documental
          </p>
        </div>
        <Link to="/plantoes" className="text-xs font-medium text-primary hover:underline shrink-0">
          Ver plantões →
        </Link>
      </div>

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
              <Link
                to="/plantoes"
                search={{ tab: "swaps" }}
                className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
              >
                Abrir trocas →
              </Link>
            </div>
          </div>

          {canExec ? (
            <div className="rounded-xl border border-border bg-card ring-soft">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold">Entrada rápida documental</h2>
              </div>
              <div className="p-5 space-y-2 text-xs">
                <Link to="/captura" className="block font-medium text-primary hover:underline">
                  Nova captura →
                </Link>
                <Link
                  to="/processamento"
                  search={{ queue: undefined }}
                  className="block font-medium text-primary hover:underline"
                >
                  Abrir filas →
                </Link>
                <Link to="/tiss" className="block font-medium text-primary hover:underline">
                  Guias TISS →
                </Link>
                <Link
                  to="/financeiro"
                  className="block font-medium text-muted-foreground hover:text-foreground"
                >
                  Hub financeiro →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
