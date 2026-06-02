/**
 * Cartões de score, badge de saúde e destaques de risco (consolidação visual).
 */
import { Activity, AlertOctagon, HeartPulse, Shield, Users } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import {
  OPERATIONAL_SCORE_IDS,
  type OperationalHealthState,
  type OperationalScoreId,
  type OperationalScoringResult,
} from "@/lib/operations/scoring/types";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<OperationalHealthState, string> = {
  healthy:
    "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
  attention: "bg-muted/80 text-foreground ring-1 ring-border/90",
  warning:
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
  critical: "bg-destructive/15 text-destructive ring-1 ring-destructive/25",
};

const STATE_LABEL: Record<OperationalHealthState, string> = {
  healthy: "Saudável",
  attention: "Atenção",
  warning: "Alerta",
  critical: "Crítico",
};

function scoreTone(id: OperationalScoreId, value: number): "default" | "warning" | "success" {
  if (id === "operational_health_score" || id === "workforce_stability_score") {
    if (value >= 68) return "success";
    if (value < 48) return "warning";
    return "default";
  }
  if (value >= 58) return "warning";
  return "default";
}

export function OperationalHealthBadge({
  state,
  className,
}: {
  state: OperationalHealthState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        STATE_STYLES[state],
        className,
      )}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

function ScoreMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-background/50 px-3 py-2.5 min-w-0",
        tone === "warning" && "ring-1 ring-[color:var(--warning)]/20",
        tone === "success" && "ring-1 ring-[color:var(--success)]/15",
      )}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums text-foreground mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}

const ICONS = {
  operational_health_score: HeartPulse,
  coverage_risk_score: Shield,
  coordination_stress_score: Activity,
  workforce_stability_score: Users,
} as const;

export function OperationalScoringPanel({
  scoring,
  isFetching,
  className,
}: {
  scoring: OperationalScoringResult;
  isFetching?: boolean;
  className?: string;
}) {
  const basisLabel =
    scoring.basis === "period_analytics"
      ? "Base: KPIs agregados (histórico)"
      : "Base: janela viva (central)";

  return (
    <OperationalLiveChrome
      isFetching={!!isFetching}
      critical={scoring.healthState === "critical"}
      className={cn("p-0 overflow-hidden", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Scoring operacional</h2>
            <OperationalHealthBadge state={scoring.healthState} />
          </div>
          <p className="text-[11px] text-muted-foreground">{basisLabel}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Risco sintético {scoring.consolidatedRiskScore.toFixed(1)}/100 · saúde{" "}
            {scoring.operationalHealthScore.toFixed(1)}/100
          </p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {OPERATIONAL_SCORE_IDS.map((id) => {
          const s = scoring.scores[id];
          const Icon = ICONS[id];
          const tone = scoreTone(id, s.value);
          const display = s.value.toFixed(1);
          return (
            <div key={id} className="relative">
              <div className="absolute right-2 top-2 text-muted-foreground/70">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <ScoreMini label={s.label} value={display} tone={tone} />
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-4 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <AlertOctagon className="h-3 w-3" />
          Destaques de risco
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground leading-snug">
          {scoring.highlights.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
        {scoring.riskNotes[0] ? (
          <p className="text-[11px] text-muted-foreground/90 pt-1 border-t border-border/80">
            {scoring.riskNotes[0]}
          </p>
        ) : null}
      </div>
    </OperationalLiveChrome>
  );
}
