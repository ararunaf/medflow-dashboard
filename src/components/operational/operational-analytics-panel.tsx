/**
 * Faixa discreta de analytics operacional na central (KPIs históricos + mini tendências).
 */
import { BarChart3, Clock, GitBranch, LineChart, Shield, Timer } from "lucide-react";
import { OperationalRecommendationsPanel } from "@/components/operational/operational-recommendations-panel";
import { OperationalScoringPanel } from "@/components/operational/operational-scoring-panel";
import { ErrorState, SkeletonRow, StatCard } from "@/components/ui-kit";
import { useOperationalAnalyticsQuery } from "@/hooks/use-operational-analytics";
import { useMyContextQuery } from "@/hooks/use-operations";
import { isOperationalManager } from "@/lib/auth/rbac";
import {
  OPERATIONAL_KPI_LABELS,
  type OperationalKpiId,
} from "@/lib/operations/analytics/kpi-registry";
import { kpiHint } from "@/lib/operations/analytics/operational-summaries";
import type { OperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function MiniBars({
  points,
  className,
}: {
  points: readonly { value: number }[];
  className?: string;
}) {
  if (!points.length) {
    return (
      <div className={cn("h-8 text-[10px] text-muted-foreground", className)}>
        Sem dados no período
      </div>
    );
  }
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className={cn("flex items-end gap-0.5 h-9", className)}>
      {points.map((p, i) => (
        <div
          key={i}
          className="flex-1 min-w-[2px] max-w-[10px] rounded-sm bg-primary/45 mx-auto"
          style={{ height: `${Math.max(4, (p.value / max) * 36)}px` }}
          title={String(Math.round(p.value * 10) / 10)}
        />
      ))}
    </div>
  );
}

function formatHours(h: number | null): string {
  if (h == null || !Number.isFinite(h)) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${Math.round(h * 10) / 10} h`;
}

function formatDelta(id: OperationalKpiId, d: number | null | undefined): string | null {
  if (d == null || !Number.isFinite(d)) return null;
  if (id === "pending_assignments_now") return null;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d}% vs período anterior`;
}

function KpiWithDelta({ id, snap }: { id: OperationalKpiId; snap: OperationalAnalyticsSnapshot }) {
  const v = snap.kpis.primary[id];
  const display =
    id === "avg_confirmation_latency_hours" || id === "avg_swap_approval_latency_hours"
      ? formatHours(v)
      : id === "avg_availability_windows" && v != null
        ? `${Math.round(v * 10) / 10}`
        : v == null
          ? "—"
          : typeof v === "number" && id !== "pending_assignments_now"
            ? Math.round(v * 10) / 10
            : String(v ?? "—");
  const delta = formatDelta(id, snap.kpis.deltaPct[id]);
  return (
    <div>
      <StatCard
        label={OPERATIONAL_KPI_LABELS[id]}
        value={display}
        hint={delta ? `${kpiHint(id)} · ${delta}` : kpiHint(id)}
        icon={
          id.includes("latency") ? (
            <Timer className="h-4 w-4" />
          ) : id.includes("coverage") ? (
            <Shield className="h-4 w-4" />
          ) : id.includes("swap") ? (
            <GitBranch className="h-4 w-4" />
          ) : id.includes("pressure") ? (
            <BarChart3 className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )
        }
      />
    </div>
  );
}

export function OperationalAnalyticsPanel({ className }: { className?: string }) {
  const me = useMyContextQuery({ refetchOnWindowFocus: false });
  const enabled = !!me.data?.tenant.id && isOperationalManager(me.data.role);
  const q = useOperationalAnalyticsQuery({ enabled });

  if (!enabled) return null;

  if (q.isLoading) {
    return (
      <div className={cn("mt-6 space-y-3", className)}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <LineChart className="h-4 w-4" />
          Analytics operacional
        </div>
        <SkeletonRow height={100} />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className={cn("mt-6", className)}>
        <ErrorState message={describeError(q.error).message} onRetry={() => q.refetch()} />
      </div>
    );
  }

  const d = q.data;
  if (!d) return null;

  return (
    <section
      className={cn(
        "mt-6 rounded-xl border border-border bg-card/50 ring-soft overflow-hidden",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Analytics operacional</h2>
            <p className="text-[11px] text-muted-foreground">
              Últimos {d.primary.dayKeys.length} dias · comparativo com período anterior equivalente
            </p>
          </div>
        </div>
        {d.meta.cappedShiftsSample ? (
          <span className="text-[10px] text-amber-600/90 font-medium">
            Amostra de plantões limitada
          </span>
        ) : null}
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{d.summaries.operational}</p>
        <p className="text-xs text-muted-foreground leading-relaxed border-b border-border pb-4">
          {d.summaries.workforce}
        </p>

        <OperationalScoringPanel
          scoring={d.scoring}
          isFetching={q.isFetching}
          className="border border-border/80 rounded-lg overflow-hidden bg-background/30"
        />

        <OperationalRecommendationsPanel
          bundle={d.recommendations}
          variant="compact"
          isFetching={q.isFetching}
          className="border border-border/80 rounded-lg overflow-hidden"
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiWithDelta id="avg_coverage_pct" snap={d} />
          <KpiWithDelta id="avg_confirmation_rate_pct" snap={d} />
          <KpiWithDelta id="avg_confirmation_latency_hours" snap={d} />
          <KpiWithDelta id="avg_swap_approval_latency_hours" snap={d} />
          <KpiWithDelta id="avg_shifts_without_coverage_per_day" snap={d} />
          <KpiWithDelta id="avg_conflict_shifts_per_day" snap={d} />
          <KpiWithDelta id="avg_pressure_score" snap={d} />
          <KpiWithDelta id="avg_availability_windows" snap={d} />
          <KpiWithDelta id="swaps_requested" snap={d} />
          <KpiWithDelta id="assignments_created" snap={d} />
          <KpiWithDelta id="pending_assignments_now" snap={d} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 pt-2">
          <div className="rounded-lg border border-border/80 p-3 bg-background/40">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Cobertura (7 dias recentes)
            </div>
            <MiniBars points={d.trends.miniCoverage} />
          </div>
          <div className="rounded-lg border border-border/80 p-3 bg-background/40">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Pressão score (7 dias recentes)
            </div>
            <MiniBars points={d.trends.miniPressure} />
          </div>
        </div>

        <div className="rounded-lg border border-border/80 p-3 bg-background/40">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Swaps solicitados por semana (ISO)
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {d.trends.weeklySwapRequests.length === 0 ? (
              <span className="text-muted-foreground">Sem swaps no período</span>
            ) : (
              d.trends.weeklySwapRequests.slice(-6).map((w) => (
                <span
                  key={w.key}
                  className="tabular-nums rounded-md bg-muted/60 px-2 py-1 text-[11px] text-foreground"
                >
                  {w.key}: <strong>{w.value}</strong>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
