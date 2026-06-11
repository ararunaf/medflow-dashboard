import type { ReactNode } from "react";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash,
  EyeOff,
  GitBranch,
  Lightbulb,
  Loader2,
  Radio,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";
import type {
  AdaptivePriorityAdjustment,
  AdaptivePrioritizationLayerSummary,
} from "@/lib/operations/adaptive-prioritization/types";
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import type { OperationalForecastProjection } from "@/lib/operations/recommendations/types";
import type { OperationalRecommendationBundle } from "@/lib/operations/recommendations/types";
import type { OperationalRecommendationState } from "@/lib/operations/recommendations/types";
import type { OperationalRecommendationType } from "@/lib/operations/recommendations/types";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { IaBadge } from "@/components/operational/ia-badge";
import { submitOperationalRecommendationFeedbackFn } from "@/lib/operations/api";
import { opsKeys } from "@/lib/queries/keys";
import { emptyOperationalRecommendationFeedbackOverlay } from "@/lib/services/operations/operational-feedback-service";
import { unwrap } from "@/lib/queries/result";
import { toast } from "@/lib/toast/bus";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<OperationalRecommendationType, string> = {
  mitigation: "Mitigação",
  coordination: "Coordenação",
  staffing: "Pessoal e escalas",
  escalation: "Escalação",
  monitoring: "Monitoramento",
};

const TYPE_ICON: Record<OperationalRecommendationType, ReactNode> = {
  mitigation: <Shield className="h-3.5 w-3.5" />,
  coordination: <GitBranch className="h-3.5 w-3.5" />,
  staffing: <Users className="h-3.5 w-3.5" />,
  escalation: <AlertOctagon className="h-3.5 w-3.5" />,
  monitoring: <Radio className="h-3.5 w-3.5" />,
};

const STATE_LABEL: Record<OperationalRecommendationState, string> = {
  suggested: "Sugerido",
  recommended: "Recomendado",
  urgent: "Urgente",
};

const STATE_CLASS: Record<OperationalRecommendationState, string> = {
  suggested: "bg-muted/80 text-muted-foreground ring-1 ring-border/80",
  recommended:
    "bg-[color:var(--warning)]/12 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
  urgent: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
};

const PROJECTION_LABEL: Record<OperationalForecastProjection, string> = {
  stable: "Baseline estável",
  deteriorating: "Baseline · deterioração",
  critical_projection: "Baseline · projeção crítica",
};

const FEEDBACK_LABEL: Record<OperationalRecommendationFeedbackType, string> = {
  accepted: "Aceita",
  dismissed: "Dispensada",
  ignored: "Ignorada",
  executed: "Executada",
  execution_failed: "Falha exec.",
};

const FEEDBACK_BADGE: Record<OperationalRecommendationFeedbackType, string> = {
  accepted:
    "bg-[color:var(--success)]/12 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
  dismissed: "bg-muted/80 text-muted-foreground ring-1 ring-border/70",
  ignored: "bg-muted/60 text-muted-foreground ring-1 ring-border/60",
  executed: "bg-primary/12 text-primary ring-1 ring-primary/25",
  execution_failed: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
};

function projectionClass(p: OperationalForecastProjection): string {
  if (p === "critical_projection") return "bg-destructive/10 text-destructive ring-destructive/20";
  if (p === "deteriorating")
    return "bg-[color:var(--warning)]/10 text-[color:var(--warning)] ring-[color:var(--warning)]/20";
  return "bg-muted/50 text-muted-foreground ring-border/60";
}

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

function trendSummary(overlay: OperationalRecommendationFeedbackOverlay): string | null {
  const t = overlay.acceptanceTrend;
  if (t.length < 2) return null;
  const last = t[t.length - 1];
  const prev = t[t.length - 2];
  const a = last.accepted + last.executed;
  const b = prev.accepted + prev.executed;
  if (a === b) return "Tendência diária estável (aceitação + execução).";
  if (a > b) return "Último dia: aceitação/execução acima do dia anterior.";
  return "Último dia: aceitação/execução abaixo do dia anterior.";
}

export function OperationalRecommendationsPanel(props: {
  bundle: OperationalRecommendationBundle;
  feedback?: OperationalRecommendationFeedbackOverlay;
  adaptive?: AdaptivePrioritizationLayerSummary;
  canSubmitFeedback?: boolean;
  variant?: "full" | "compact";
  isFetching?: boolean;
  className?: string;
}) {
  const {
    bundle,
    feedback: feedbackProp,
    adaptive,
    variant = "full",
    isFetching,
    className,
    canSubmitFeedback = false,
  } = props;
  const feedback = feedbackProp ?? emptyOperationalRecommendationFeedbackOverlay();
  const qc = useQueryClient();
  const max = variant === "compact" ? 6 : 12;
  const items = bundle.items.slice(0, max);
  const urgent = bundle.items.some((i) => i.state === "urgent");
  const e = feedback.effectiveness;
  const trend = trendSummary(feedback);
  const adaptiveByRecId = useMemo(() => {
    const m = new Map<string, AdaptivePriorityAdjustment>();
    if (!adaptive) return m;
    for (const a of adaptive.adjustments) {
      if (a.subjectKind === "recommendation") m.set(a.subjectId, a);
    }
    return m;
  }, [adaptive]);

  const submitMut = useMutation({
    mutationFn: async (input: {
      recommendationId: string;
      feedbackType: OperationalRecommendationFeedbackType;
    }) =>
      unwrap(
        await submitOperationalRecommendationFeedbackFn({
          data: {
            recommendationId: input.recommendationId,
            feedbackType: input.feedbackType,
            effectivenessScore: null,
            notes: null,
          },
        }),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toast.success("Feedback registrado", "Sinais operacionais atualizados.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Não foi possível registrar.";
      toast.warning("Feedback", msg);
    },
  });

  return (
    <OperationalLiveChrome
      isFetching={!!isFetching}
      critical={urgent}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card/40 ring-soft",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-start gap-2 min-w-0">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Recomendações operacionais</h2>
              <IaBadge />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {bundle.summary.headline}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1",
            projectionClass(bundle.forecast.projection),
          )}
        >
          <IaBadge className="mr-0.5" />
          <ShieldAlert className="h-3 w-3 opacity-80" />
          {PROJECTION_LABEL[bundle.forecast.projection]}
        </span>
      </div>

      <div className="px-4 py-2.5 border-b border-border bg-muted/15 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
            Efetividade ({feedback.window.fromISO.slice(0, 10)} →{" "}
            {feedback.window.toISO.slice(0, 10)})
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium ring-1 ring-border/70">
            n={e.sampleSize}
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium ring-1 ring-border/70"
            title="(aceitas + executadas) / feedback humano"
          >
            Alinhamento {pct(e.alignmentRate)}
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium ring-1 ring-border/70"
            title="executadas / (executadas + falhas)"
          >
            Execução {pct(e.executionSuccessRate)}
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium ring-1 ring-border/70"
            title="execuções com nota ≥ 0,7 / execuções com nota"
          >
            Mitigação {pct(e.scoredMitigationSuccessRate)}
          </span>
        </div>
        {trend ? (
          <p className="text-[10px] text-muted-foreground leading-snug flex items-start gap-1">
            <Sparkles className="h-3 w-3 shrink-0 mt-0.5 opacity-70" />
            {trend}
          </p>
        ) : null}
        {feedback.learningSignals.length > 0 ? (
          <ul className="space-y-1">
            {feedback.learningSignals.map((s) => (
              <li
                key={s.id}
                className="text-[10px] rounded-md border border-border/80 bg-background/50 px-2 py-1.5 text-foreground/90"
              >
                <span className="font-semibold">{s.headline}</span>
                <span className="text-muted-foreground"> — {s.detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {bundle.forecast.rationale.length > 0 ? (
        <div className="px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Destaques de guidance (forecast baseline)
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
            {bundle.forecast.rationale.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          Nenhuma recomendação adicional para o snapshot atual — regras não atingiram limiares
          configurados.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((rec) => {
            const hints = feedback.byRecommendationId[rec.id];
            const busy = submitMut.isPending && submitMut.variables?.recommendationId === rec.id;
            const adj = adaptiveByRecId.get(rec.id);
            return (
              <li
                key={rec.id}
                id={
                  bundle.summary.topMitigationId === rec.id
                    ? "ops-anchor-recommendations-focus"
                    : undefined
                }
                className={cn(
                  "px-4 py-3.5 space-y-2",
                  bundle.summary.topMitigationId === rec.id && "bg-primary/[0.04]",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      STATE_CLASS[rec.state],
                    )}
                  >
                    {STATE_LABEL[rec.state]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-border/70">
                    {TYPE_ICON[rec.type]}
                    {TYPE_LABEL[rec.type]}
                  </span>
                  {rec.type === "mitigation" ? (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary ring-1 ring-primary/20">
                      Plano mitigação
                    </span>
                  ) : null}
                  {hints?.lastFeedbackType ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                        FEEDBACK_BADGE[hints.lastFeedbackType],
                      )}
                      title={
                        hints.lastFeedbackAt
                          ? new Date(hints.lastFeedbackAt).toLocaleString("pt-BR")
                          : ""
                      }
                    >
                      Feedback: {FEEDBACK_LABEL[hints.lastFeedbackType]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium text-muted-foreground ring-1 ring-border/60">
                      Sem feedback ainda
                    </span>
                  )}
                  {adj ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1",
                        adj.nudge > 0.05
                          ? "bg-primary/10 text-primary ring-primary/20"
                          : adj.nudge < -0.05
                            ? "bg-muted/80 text-muted-foreground ring-border/70"
                            : "bg-muted/60 text-muted-foreground ring-border/60",
                      )}
                      title={adj.rationale.headline}
                    >
                      {adj.nudge > 0.05 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : adj.nudge < -0.05 ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3 opacity-70" />
                      )}
                      Adaptativo · {adj.adjustedPriority}
                    </span>
                  ) : null}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-snug">
                    {rec.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.body}</p>
                  <p className="text-[10px] text-muted-foreground/90 mt-1.5 leading-snug flex gap-1 items-start">
                    <Sparkles className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
                    <span>{hints?.confidenceLabel ?? "Dica de confiança indisponível."}</span>
                  </p>
                </div>
                {rec.because.length > 0 ? (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Por quê (explicável)
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                      {rec.because.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {adj && (adj.nudge > 0.05 || adj.nudge < -0.05) ? (
                  <div className="rounded-md border border-dashed border-primary/30 bg-primary/[0.04] px-2.5 py-1.5 text-[10px] text-foreground/90">
                    <div className="font-semibold text-primary mb-0.5">Raciocínio adaptativo</div>
                    <div className="text-[11px] text-foreground/90 leading-snug">
                      {adj.rationale.headline}
                    </div>
                    {adj.rationale.narrative.length > 0 ? (
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[10px] text-muted-foreground">
                        {adj.rationale.narrative.slice(0, 2).map((n, i) => (
                          <li key={`adj-${i}`}>{n}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                {rec.mitigationPlan && rec.mitigationPlan.length > 0 ? (
                  <div className="rounded-lg border border-dashed border-border/90 bg-background/50 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Sugestões de ação (não automáticas)
                    </div>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-foreground/90">
                      {rec.mitigationPlan.slice(0, 4).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {canSubmitFeedback ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <FeedbackAction
                      label="Aceitar"
                      icon={<CheckCircle2 className="h-3 w-3" />}
                      disabled={busy}
                      onClick={() =>
                        submitMut.mutate({ recommendationId: rec.id, feedbackType: "accepted" })
                      }
                    />
                    <FeedbackAction
                      label="Ignorar"
                      icon={<EyeOff className="h-3 w-3" />}
                      disabled={busy}
                      onClick={() =>
                        submitMut.mutate({ recommendationId: rec.id, feedbackType: "ignored" })
                      }
                    />
                    <FeedbackAction
                      label="Dispensar"
                      icon={<CircleSlash className="h-3 w-3" />}
                      disabled={busy}
                      onClick={() =>
                        submitMut.mutate({ recommendationId: rec.id, feedbackType: "dismissed" })
                      }
                    />
                    <FeedbackAction
                      label="Executada"
                      icon={<CheckCircle2 className="h-3 w-3" />}
                      disabled={busy}
                      onClick={() =>
                        submitMut.mutate({ recommendationId: rec.id, feedbackType: "executed" })
                      }
                    />
                    <FeedbackAction
                      label="Falhou"
                      icon={<XCircle className="h-3 w-3" />}
                      disabled={busy}
                      onClick={() =>
                        submitMut.mutate({
                          recommendationId: rec.id,
                          feedbackType: "execution_failed",
                        })
                      }
                    />
                    {busy ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Enviando…
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {variant === "full" ? (
        <p className="px-4 py-2.5 text-[10px] text-muted-foreground border-t border-border bg-muted/10">
          Motor determinístico · sem execução automática · recomputado apenas com o snapshot (
          {new Date(bundle.computedAt).toLocaleTimeString("pt-BR")})
        </p>
      ) : null}
    </OperationalLiveChrome>
  );
}

function FeedbackAction(props: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] font-medium",
        "hover:bg-accent/50 disabled:opacity-50 disabled:pointer-events-none",
      )}
    >
      {props.icon}
      {props.label}
    </button>
  );
}
