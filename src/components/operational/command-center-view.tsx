import { Link } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Gauge,
  GitBranch,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import {
  OperationalAlertFeed,
  OperationalAlertFeedHeader,
  OperationalAlertHeaderBadges,
} from "@/components/operational/operational-alert-feed";
import { OperationalAnalyticsPanel } from "@/components/operational/operational-analytics-panel";
import { OperationalQuickActions } from "@/components/operational/operational-quick-actions";
import { OperationalCopilotContextPanel } from "@/components/operational/operational-copilot-context-panel";
import { OperationalCopilotGptPanel } from "@/components/operational/operational-copilot-gpt-panel";
import { OperationalActionProposalsPanel } from "@/components/operational/operational-action-proposals-panel";
import { OperationalAdaptivePrioritizationPanel } from "@/components/operational/operational-adaptive-prioritization-panel";
import { OperationalMemoryPanel } from "@/components/operational/operational-memory-panel";
import { OperationalPolicyIntelligencePanel } from "@/components/operational/operational-policy-intelligence-panel";
import { OperationalStrategicPlanningPanel } from "@/components/operational/operational-strategic-planning-panel";
import { OperationalOrchestrationPanel } from "@/components/operational/operational-orchestration-panel";
import { OperationalActiveAgentsPanel } from "@/components/operational/operational-active-agents-panel";
import { OperationalAgentCoordinationPanel } from "@/components/operational/operational-agent-coordination-panel";
import { OperationalRecommendationsPanel } from "@/components/operational/operational-recommendations-panel";
import { OperationalScoringPanel } from "@/components/operational/operational-scoring-panel";
import { OperationalTimelineFeed } from "@/components/operational/operational-timeline-feed";
import {
  OperationalLiveChrome,
  OperationalLivePulse,
} from "@/components/operational/operational-live-chrome";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatCard } from "@/components/ui-kit";
import { useOperationalAlerts } from "@/hooks/use-operational-alerts";
import { useOperationalCriticalAlertsAudit } from "@/hooks/use-operational-timeline-signals";
import { useMyContextQuery } from "@/hooks/use-operations";
import { isOperationalManager } from "@/lib/auth/rbac";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { CentralOpsSearch } from "@/lib/operations/actions";
import {
  OPERATIONAL_ALERT_RULE_IDS,
  type OperationalAlert,
  type OperationalAlertRuleId,
  type OperationalAlertSeverity,
} from "@/lib/operations/alerts/types";
import { formatDayMonth, formatTime } from "@/lib/queries/adapters";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const SEV_ORDER: Record<OperationalAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function tightestSeverity(
  alerts: OperationalAlert[],
  ids: readonly OperationalAlertRuleId[],
): OperationalAlertSeverity | null {
  let best: OperationalAlertSeverity | null = null;
  for (const a of alerts) {
    if (!ids.includes(a.id)) continue;
    if (!best || SEV_ORDER[a.severity] < SEV_ORDER[best]) best = a.severity;
  }
  return best;
}

function StatRiskOutline({
  severity,
  children,
}: {
  severity: OperationalAlertSeverity | null;
  children: React.ReactNode;
}) {
  if (!severity) return <>{children}</>;
  return (
    <div
      className={cn(
        "rounded-xl",
        severity === "critical" && "ring-1 ring-destructive/40",
        severity === "warning" && "ring-1 ring-[color:var(--warning)]/35",
        severity === "info" && "ring-1 ring-border/90",
      )}
    >
      {children}
    </div>
  );
}

function pressureHint(
  p: OperationalCommandCenterSnapshot["widgets"]["operationalPressure"],
): string {
  if (p === "alta") return "vários gargalos simultâneos";
  if (p === "moderada") return "atenção distribuída";
  return "operação estável";
}

function urgencyPill(u: OperationalCommandCenterSnapshot["coordination"]["urgency"]): {
  label: string;
  className: string;
} {
  if (u === "critica")
    return {
      label: "Urgência crítica",
      className: "bg-destructive/15 text-destructive ring-1 ring-destructive/25",
    };
  if (u === "elevada")
    return {
      label: "Urgência elevada",
      className:
        "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
    };
  return {
    label: "Operação normal",
    className:
      "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/20",
  };
}

const statNavClass =
  "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function CommandCenterView(props: {
  query: {
    data: OperationalCommandCenterSnapshot | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    isFetching: boolean;
    refetch: () => void;
  };
  /** Destaca e rola para âncoras internas quando vindo de alertas / atalhos. */
  opsFocus?: CentralOpsSearch["opsFocus"];
}) {
  const { query, opsFocus } = props;
  const d = query.data;
  const urgency = d ? urgencyPill(d.coordination.urgency) : null;
  const opsAlerts = useOperationalAlerts(query.data);
  const me = useMyContextQuery({ staleTime: 30_000, refetchOnWindowFocus: false });
  const canAudit = isOperationalManager(me.data?.role);
  useOperationalCriticalAlertsAudit(!!canAudit, opsAlerts.alerts);

  useLayoutEffect(() => {
    if (!opsFocus || query.isLoading || !d) return;
    const el = document.getElementById(`ops-anchor-${opsFocus}`);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [opsFocus, query.isLoading, d]);

  return (
    <>
      <PageHeader
        title="Central operacional"
        subtitle="Indicadores vivos do tenant — atualizados via Supabase Realtime."
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <OperationalAlertHeaderBadges counts={opsAlerts.counts} />
              <OperationalLivePulse />
            </div>
            {query.isFetching && !query.isLoading ? (
              <span className="text-[10px] text-muted-foreground">Sincronizando…</span>
            ) : null}
          </div>
        }
      />

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonRow height={120} />
          <SkeletonRow height={120} />
          <SkeletonRow height={120} />
          <SkeletonRow height={120} />
        </div>
      ) : query.isError ? (
        <ErrorState message={describeError(query.error).message} onRetry={() => query.refetch()} />
      ) : !d ? null : (
        <>
          <OperationalLiveChrome
            isFetching={query.isFetching}
            critical={d.coordination.urgency === "critica" || opsAlerts.topSeverity === "critical"}
            className="mb-5 p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              {urgency ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    urgency.className,
                  )}
                >
                  {urgency.label}
                </span>
              ) : null}
              <div>
                <div className="text-sm font-semibold text-foreground">Visão de coordenação</div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  {d.coordination.coverageOverview} {d.coordination.conflictsOverview}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/escalas"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/60"
              >
                Escalas <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/plantoes"
                search={{ tab: "disponiveis" }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/60"
              >
                Plantões <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </OperationalLiveChrome>

          <OperationalQuickActions
            alerts={opsAlerts.alerts}
            snapshot={d}
            className="mb-4 scroll-mt-24"
            canRecordAudit={!!canAudit}
          />

          <OperationalScoringPanel
            scoring={d.scoring}
            isFetching={query.isFetching}
            className="mb-4 scroll-mt-24"
          />

          <OperationalRecommendationsPanel
            bundle={d.recommendations}
            feedback={d.recommendationFeedback}
            adaptive={d.adaptivePrioritization}
            canSubmitFeedback={canAudit}
            isFetching={query.isFetching}
            className="mb-4 scroll-mt-24"
          />

          <OperationalAdaptivePrioritizationPanel
            layer={d.adaptivePrioritization}
            canGovern={!!canAudit}
            isFetching={query.isFetching}
            className="mb-4 scroll-mt-24"
          />

          <OperationalMemoryPanel
            memory={d.operationalMemory}
            canGovern={!!canAudit}
            isFetching={query.isFetching}
            className="mb-4 scroll-mt-24"
          />

          <OperationalPolicyIntelligencePanel
            layer={d.policyIntelligence}
            canGovern={!!canAudit}
            isFetching={query.isFetching}
            className="mb-4"
          />

          <OperationalStrategicPlanningPanel
            layer={d.strategicPlanning}
            canGovern={!!canAudit}
            isFetching={query.isFetching}
            orchestrationActiveCount={d.orchestrationActiveCount}
            className="mb-4"
          />

          <OperationalCopilotContextPanel
            snapshot={d}
            alerts={opsAlerts.alerts}
            isFetching={query.isFetching}
            className="mb-4"
          />

          <OperationalCopilotGptPanel
            snapshot={d}
            alerts={opsAlerts.alerts}
            isFetching={query.isFetching}
            className="mb-4"
          />

          <OperationalActionProposalsPanel
            enabled={!!canAudit}
            isFetchingCc={query.isFetching}
            className="mb-4"
          />

          <OperationalOrchestrationPanel
            enabled={!!canAudit}
            role={me.data?.role ?? "professional"}
            className="mb-4"
          />

          <OperationalActiveAgentsPanel enabled={!!canAudit} className="mb-4" />

          <OperationalAgentCoordinationPanel enabled={!!canAudit} className="mb-4" />

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
            <div id="ops-anchor-opens" className="scroll-mt-24 min-w-0">
              <Link to="/plantoes" search={{ tab: "disponiveis" }} className={statNavClass}>
                <StatRiskOutline
                  severity={tightestSeverity(opsAlerts.alerts, [
                    OPERATIONAL_ALERT_RULE_IDS.overdueOpenShifts,
                    OPERATIONAL_ALERT_RULE_IDS.unconfirmedStartingSoon,
                    OPERATIONAL_ALERT_RULE_IDS.openShiftsNearWindow,
                  ])}
                >
                  <StatCard
                    label="Plantões abertos"
                    value={d.widgets.openShifts}
                    hint="status aberto"
                    icon={<Activity className="h-4 w-4" />}
                    tone="primary"
                  />
                </StatRiskOutline>
              </Link>
            </div>
            <div id="ops-anchor-confirmed" className="scroll-mt-24 min-w-0">
              <Link to="/escalas" className={statNavClass}>
                <StatCard
                  label="Confirmados (janela)"
                  value={d.widgets.confirmedShiftsInWindow}
                  hint="7 dias · com confirmação"
                  icon={<UserCheck className="h-4 w-4" />}
                  tone="success"
                />
              </Link>
            </div>
            <div id="ops-anchor-swaps" className="scroll-mt-24 min-w-0">
              <Link to="/plantoes" search={{ tab: "swaps" }} className={statNavClass}>
                <StatRiskOutline
                  severity={tightestSeverity(opsAlerts.alerts, [
                    OPERATIONAL_ALERT_RULE_IDS.swapsQueuePressure,
                    OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon,
                  ])}
                >
                  <StatCard
                    label="Swaps pendentes"
                    value={d.widgets.pendingSwaps}
                    hint="aguardando decisão"
                    icon={<GitBranch className="h-4 w-4" />}
                  />
                </StatRiskOutline>
              </Link>
            </div>
            <div id="ops-anchor-coverage" className="scroll-mt-24 min-w-0">
              <Link to="/escalas" search={{ opsFocus: "sem-confirmacao" }} className={statNavClass}>
                <StatRiskOutline
                  severity={tightestSeverity(opsAlerts.alerts, [
                    OPERATIONAL_ALERT_RULE_IDS.coverageLow,
                    OPERATIONAL_ALERT_RULE_IDS.coverageWatch,
                  ])}
                >
                  <StatCard
                    label="Cobertura"
                    value={`${d.widgets.operationalCoveragePercent}%`}
                    hint="plantões com confirmação / ativos"
                    icon={<ShieldAlert className="h-4 w-4" />}
                    tone={d.widgets.operationalCoveragePercent < 70 ? "warning" : "default"}
                  />
                </StatRiskOutline>
              </Link>
            </div>
            <div id="ops-anchor-availability" className="scroll-mt-24 min-w-0">
              <Link to="/perfil" hash="disponibilidade-operacional" className={statNavClass}>
                <StatRiskOutline
                  severity={tightestSeverity(opsAlerts.alerts, [
                    OPERATIONAL_ALERT_RULE_IDS.availabilityRisk,
                  ])}
                >
                  <StatCard
                    label="Profissionais disponíveis"
                    value={d.widgets.availableProfessionals}
                    hint="com janela “disponível”"
                    icon={<Users className="h-4 w-4" />}
                  />
                </StatRiskOutline>
              </Link>
            </div>
            <div id="ops-anchor-conflicts" className="scroll-mt-24 min-w-0">
              <Link to="/escalas" search={{ opsFocus: "conflicts" }} className={statNavClass}>
                <StatRiskOutline
                  severity={tightestSeverity(opsAlerts.alerts, [
                    OPERATIONAL_ALERT_RULE_IDS.operationalConflicts,
                  ])}
                >
                  <StatCard
                    label="Conflitos sinalizados"
                    value={d.widgets.operationalConflicts}
                    hint="aberto vencido ou múltiplas pendências"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    tone={d.widgets.operationalConflicts > 0 ? "warning" : "default"}
                  />
                </StatRiskOutline>
              </Link>
            </div>
            <div id="ops-anchor-pressure" className="scroll-mt-24 min-w-0">
              <Link to="/central" search={{ opsFocus: "detail" }} className={statNavClass}>
                <StatRiskOutline
                  severity={tightestSeverity(opsAlerts.alerts, [
                    OPERATIONAL_ALERT_RULE_IDS.coordinationPressure,
                  ])}
                >
                  <StatCard
                    label="Pressão operacional"
                    value={
                      d.widgets.operationalPressure === "alta"
                        ? "Alta"
                        : d.widgets.operationalPressure === "moderada"
                          ? "Média"
                          : "Baixa"
                    }
                    hint={pressureHint(d.widgets.operationalPressure)}
                    icon={<Gauge className="h-4 w-4" />}
                    tone={d.widgets.operationalPressure === "alta" ? "warning" : "default"}
                  />
                </StatRiskOutline>
              </Link>
            </div>
            <StatCard
              label="Taxa confirmação"
              value={`${d.indicators.confirmationRatePercent}%`}
              hint="atribuições na amostra"
              icon={<UserCheck className="h-4 w-4" />}
            />
          </div>

          <OperationalAnalyticsPanel />

          <OperationalLiveChrome
            isFetching={query.isFetching}
            critical={opsAlerts.topSeverity === "critical"}
            className="mt-6 p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                <OperationalAlertFeedHeader count={opsAlerts.alerts.length} />
              </h2>
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                Regras explícitas · snapshot {new Date(d.asOf).toLocaleTimeString("pt-BR")}
              </span>
            </div>
            <OperationalAlertFeed alerts={opsAlerts.alerts} />
          </OperationalLiveChrome>

          <div id="ops-anchor-timeline" className="scroll-mt-24">
            <OperationalTimelineFeed className="mt-6" />
          </div>

          <div id="ops-anchor-detail" className="mt-6 grid lg:grid-cols-2 gap-4 scroll-mt-24">
            <OperationalLiveChrome isFetching={query.isFetching} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Indicadores operacionais</h2>
                <button
                  type="button"
                  onClick={() => query.refetch()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {query.isFetching ? "Atualizando…" : "Refetch"}
                </button>
              </div>
              <ul className="divide-y divide-border text-sm">
                <IndicatorRow
                  label="Cobertura %"
                  value={`${d.indicators.coveragePercent}%`}
                  warn={d.indicators.coveragePercent < 70}
                />
                <IndicatorRow
                  label="Plantões sem confirmação"
                  value={d.indicators.shiftsWithoutAssignment}
                  warn={d.indicators.shiftsWithoutAssignment > 3}
                />
                <IndicatorRow
                  label="Assignments pendentes"
                  value={d.indicators.pendingAssignments}
                  warn={d.indicators.pendingAssignments > 5}
                  id="ops-anchor-assignments"
                  emphasize={opsFocus === "assignments"}
                />
                <IndicatorRow
                  label="Swaps aguardando aprovação"
                  value={d.indicators.swapsAwaitingApproval}
                  warn={d.indicators.swapsAwaitingApproval >= 5}
                />
                <IndicatorRow
                  label="Plantões abertos vencidos (amostra)"
                  value={d.indicators.overdueOpenShifts}
                  warn={d.indicators.overdueOpenShifts > 0}
                />
                <IndicatorRow
                  label="Sem confirmação · próx. 24h"
                  value={d.indicators.unconfirmedStartingWithin24h}
                  warn={d.indicators.unconfirmedStartingWithin24h >= 2}
                />
                <IndicatorRow
                  label="Múltiplas pendências no mesmo plantão"
                  value={d.indicators.shiftsWithMultiplePending}
                  warn={d.indicators.shiftsWithMultiplePending > 0}
                />
                <IndicatorRow
                  label="Profissionais sem disponibilidade ativa"
                  value={d.indicators.unavailableProfessionals}
                />
              </ul>
              {d.meta.cappedWindowSample ? (
                <p className="px-5 py-3 text-[11px] text-muted-foreground border-t border-border">
                  Amostra de plantões limitada a {800} linhas na janela — métricas de cobertura são
                  conservadoras em tenants muito grandes.
                </p>
              ) : null}
            </OperationalLiveChrome>

            <OperationalLiveChrome isFetching={query.isFetching} className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Coordenação rápida</h2>
                <p className="text-xs text-muted-foreground mt-1">Swaps mais próximos no tempo.</p>
              </div>
              {d.coordination.swapsCritical.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="Nenhuma troca pendente na fila"
                    description="Operação limpa."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {d.coordination.swapsCritical.map((s) => (
                    <li key={s.swapId} className="px-5 py-3.5 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {s.departmentName}
                        </span>
                        {s.critical ? (
                          <span className="shrink-0 text-[10px] uppercase tracking-wide font-semibold text-destructive">
                            Próx. 48h
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDayMonth(s.shiftStartsAt)} · {formatTime(s.shiftStartsAt)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.requesterName ?? "?"} ↔ {s.targetName ?? "?"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </OperationalLiveChrome>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground">
            Janela: {new Date(d.window.fromISO).toLocaleDateString("pt-BR")} —{" "}
            {new Date(d.window.toISO).toLocaleDateString("pt-BR")} · snapshot {d.asOf}
          </p>
        </>
      )}
    </>
  );
}

function IndicatorRow({
  id,
  label,
  value,
  warn,
  emphasize,
}: {
  id?: string;
  label: string;
  value: string | number;
  warn?: boolean;
  emphasize?: boolean;
}) {
  return (
    <li
      id={id}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3",
        emphasize &&
          "bg-[color:var(--warning)]/[0.07] ring-1 ring-inset ring-[color:var(--warning)]/25",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", warn && "text-[color:var(--warning)]")}>
        {value}
      </span>
    </li>
  );
}
