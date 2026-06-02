/**
 * Painel da camada de priorização operacional adaptativa supervisionada.
 *
 * Mostra:
 *  - Estado da camada (static / adaptive / supervised_adjustment / validated)
 *  - Sinais históricos consumidos
 *  - Ajustes propostos (com baseline → ajustado, nudge, rationale e refs)
 *  - Histórico recente de transições supervisionadas
 *  - Boundaries em vigor
 *
 * Nenhuma ação é executada automaticamente — apenas reordenação e governança.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  History,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle,
} from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { Button } from "@/components/ui/button";
import { recordAdaptivePriorityTransitionFn } from "@/lib/operations/api/operational-adaptive-prioritization";
import { toast } from "@/lib/toast/bus";
import type {
  AdaptivePriorityAdjustment,
  AdaptivePriorityState,
  AdaptivePrioritizationLayerSummary,
  AdaptiveSignalKind,
  AdaptiveSignalSnapshot,
} from "@/lib/operations/adaptive-prioritization/types";
import { signalLabel } from "@/lib/operations/adaptive-prioritization/adaptive-guidance-helpers";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const LAYER_STATE_LABEL: Record<AdaptivePriorityState, string> = {
  static: "Estática",
  adaptive: "Adaptativa",
  supervised_adjustment: "Ajuste supervisionado",
  validated: "Validada",
};

const LAYER_STATE_CLASS: Record<AdaptivePriorityState, string> = {
  static: "bg-muted text-muted-foreground ring-1 ring-border/80",
  adaptive: "bg-primary/10 text-primary ring-1 ring-primary/20",
  supervised_adjustment:
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
  validated:
    "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
};

const SUBJECT_LABEL: Record<AdaptivePriorityAdjustment["subjectKind"], string> = {
  recommendation: "Recomendação",
  orchestration: "Orquestração",
  mitigation: "Mitigação",
  escalation: "Escalação",
  coordination: "Coordenação",
};

function pct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function signalRow(label: string, value: number | null | undefined) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{pct(value)}</span>
    </div>
  );
}

function SignalsBlock(props: { signals: AdaptiveSignalSnapshot }) {
  const s = props.signals;
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
        <Gauge className="h-4 w-4 text-primary" aria-hidden />
        Sinais históricos (ponderação)
      </div>
      <div className="space-y-1">
        {signalRow("Eficácia de recomendações", s.recommendationEffectiveness)}
        {signalRow("Sucesso de mitigação", s.mitigationSuccess)}
        {signalRow("Eficácia de coordenação", s.coordinationEffectiveness)}
        {signalRow("Accuracy de forecast", s.forecastAccuracy)}
        {signalRow("Outcomes de orquestração", s.orchestrationOutcomes)}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Rollback (frequência)</span>
          <span className="font-semibold tabular-nums text-foreground">
            {pct(s.rollbackFrequency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Recorrência de deterioração</span>
          <span className="font-semibold tabular-nums text-foreground">
            {pct(s.deteriorationRecurrence)}
          </span>
        </div>
      </div>
      {s.sampleNotes.length > 0 ? (
        <ul className="mt-3 list-disc pl-4 text-[10px] text-muted-foreground space-y-0.5">
          {s.sampleNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function nudgeBadge(nudge: number) {
  if (nudge > 0.05) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
        <ArrowUpRight className="h-3 w-3" /> +{(nudge * 100).toFixed(0)}%
      </span>
    );
  }
  if (nudge < -0.05) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/70">
        <ArrowDownRight className="h-3 w-3" /> {(nudge * 100).toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/60">
      sem ajuste
    </span>
  );
}

function priorityArrow(
  baseline: AdaptivePriorityAdjustment["baselinePriority"],
  adjusted: AdaptivePriorityAdjustment["adjustedPriority"],
) {
  if (baseline === adjusted) {
    return <span className="text-[10px] text-muted-foreground">{baseline}</span>;
  }
  return (
    <span className="text-[10px] text-foreground">
      <span className="text-muted-foreground">{baseline}</span> →{" "}
      <span className="font-semibold">{adjusted}</span>
    </span>
  );
}

function dominantSignalChips(kinds: AdaptiveSignalKind[]) {
  if (kinds.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {kinds.map((k) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[9px] font-medium text-muted-foreground ring-1 ring-border/70"
        >
          <Sparkles className="h-2.5 w-2.5 opacity-70" />
          {signalLabel(k)}
        </span>
      ))}
    </div>
  );
}

function AdjustmentItem(props: {
  adj: AdaptivePriorityAdjustment;
  canGovern: boolean;
  onValidate: (adjustmentId: string) => void;
  onMarkSupervised: (adjustmentId: string) => void;
  pending: boolean;
}) {
  const { adj, canGovern } = props;
  const stateBadge = LAYER_STATE_CLASS[adj.state];
  return (
    <li className="rounded-lg border border-border/70 bg-background/40 px-3 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            stateBadge,
          )}
        >
          {LAYER_STATE_LABEL[adj.state]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-border/70">
          {SUBJECT_LABEL[adj.subjectKind]}
        </span>
        {nudgeBadge(adj.nudge)}
        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
          {adj.id.replace("adapt:", "")}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-foreground font-medium leading-snug">
          {adj.rationale.headline}
        </div>
        {priorityArrow(adj.baselinePriority, adj.adjustedPriority)}
      </div>
      <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-0.5">
        {adj.rationale.narrative.map((n, i) => (
          <li key={`${i}-${n.slice(0, 32)}`}>{n}</li>
        ))}
      </ul>
      {dominantSignalChips(adj.rationale.dominantSignals)}
      {adj.references.length > 0 ? (
        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
          <span className="font-semibold uppercase tracking-wide">Refs:</span>
          {adj.references.map((r) => (
            <span
              key={`${r.kind}-${r.id}`}
              className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 ring-1 ring-border/60"
              title={r.note ?? r.id}
            >
              {r.kind}:{r.id.slice(0, 12)}
            </span>
          ))}
        </div>
      ) : null}
      {adj.lastSupervisedTransition ? (
        <div className="text-[10px] text-muted-foreground">
          Última governança:{" "}
          <span className="font-medium text-foreground">{adj.lastSupervisedTransition.state}</span>
          {" · "}
          {new Date(adj.lastSupervisedTransition.at).toLocaleString("pt-BR")}
          {adj.lastSupervisedTransition.note ? ` · ${adj.lastSupervisedTransition.note}` : null}
        </div>
      ) : null}
      {canGovern ? (
        <div className="flex flex-wrap gap-1 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[10px] px-2"
            disabled={props.pending || adj.state === "validated"}
            onClick={() => props.onValidate(adj.id)}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Validar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] px-2"
            disabled={props.pending || adj.state === "supervised_adjustment"}
            onClick={() => props.onMarkSupervised(adj.id)}
          >
            <ShieldCheck className="h-3 w-3 mr-1" /> Marcar como supervisionado
          </Button>
          {props.pending ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Registrando…
            </span>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function OperationalAdaptivePrioritizationPanel(props: {
  layer: AdaptivePrioritizationLayerSummary;
  canGovern: boolean;
  isFetching: boolean;
  className?: string;
}) {
  const { layer, canGovern, isFetching, className } = props;
  const qc = useQueryClient();

  const recordMut = useMutation({
    mutationFn: async (input: {
      adjustmentId: string;
      subjectKind: AdaptivePriorityAdjustment["subjectKind"];
      nextState: AdaptivePriorityState;
    }) =>
      unwrap(
        await recordAdaptivePriorityTransitionFn({
          data: { ...input, note: null },
        }),
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toast.success(
        "Governança registrada",
        "Transição supervisionada anexada à camada adaptativa.",
      );
    },
    onError: (e: unknown) => {
      toast.error("Falha ao registrar", e instanceof Error ? e.message : String(e));
    },
  });

  const handleValidate = (adjustmentId: string) => {
    const adj = layer.adjustments.find((a) => a.id === adjustmentId);
    if (!adj) return;
    recordMut.mutate({
      adjustmentId,
      subjectKind: adj.subjectKind,
      nextState: "validated",
    });
  };
  const handleMarkSupervised = (adjustmentId: string) => {
    const adj = layer.adjustments.find((a) => a.id === adjustmentId);
    if (!adj) return;
    recordMut.mutate({
      adjustmentId,
      subjectKind: adj.subjectKind,
      nextState: "supervised_adjustment",
    });
  };

  const adjustmentsWithGovernance = layer.adjustments.filter((a) => a.lastSupervisedTransition);
  const layerStateClass = LAYER_STATE_CLASS[layer.layerState];

  return (
    <OperationalLiveChrome
      isFetching={isFetching}
      critical={false}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card/40 ring-soft",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-start gap-2 min-w-0">
          <Workflow className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Priorização adaptativa</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Reordenação supervisionada com base em sinais históricos — execução nunca é
              automática.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            layerStateClass,
          )}
        >
          <Layers className="h-3 w-3 opacity-80" />
          {LAYER_STATE_LABEL[layer.layerState]}
        </span>
      </div>

      <div className="px-4 py-3 border-b border-border bg-muted/15">
        <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-0.5">
          {layer.narrative.map((n, i) => (
            <li key={`${i}-${n.slice(0, 32)}`}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 px-4 py-3 lg:grid-cols-[280px,1fr]">
        <div className="space-y-3">
          <SignalsBlock signals={layer.signals} />
          <div className="rounded-lg border border-dashed border-border/80 bg-background/30 p-3 text-[11px] text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Limites de adaptação
            </div>
            <div className="flex justify-between">
              <span>Peso adaptativo</span>
              <span className="tabular-nums text-foreground">
                {layer.boundaries.minWeight.toFixed(2)} – {layer.boundaries.maxWeight.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ajustes por ciclo</span>
              <span className="tabular-nums text-foreground">
                {layer.boundaries.maxAdjustmentsPerCycle}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Janela de freeze</span>
              <span className="tabular-nums text-foreground">
                {Math.round(layer.boundaries.freezeWindowMs / 60_000)} min
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amostra mínima</span>
              <span className="tabular-nums text-foreground">
                {layer.boundaries.minSampleSizeForAdaptation}
              </span>
            </div>
            {layer.bounded ? (
              <div className="text-[10px] text-[color:var(--warning)] flex items-start gap-1">
                <XCircle className="h-3 w-3 mt-0.5" />
                <span>Limite atingido neste ciclo — repriorização truncada para evitar loop.</span>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-foreground mb-2">Ajustes propostos</div>
          {layer.adjustments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-background/40 p-4 text-xs text-muted-foreground">
              Nenhum ajuste para este ciclo — sinais insuficientes ou todos os pesos próximos do
              neutro.
            </div>
          ) : (
            <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {layer.adjustments.map((adj) => (
                <AdjustmentItem
                  key={adj.id}
                  adj={adj}
                  canGovern={canGovern}
                  pending={recordMut.isPending && recordMut.variables?.adjustmentId === adj.id}
                  onValidate={handleValidate}
                  onMarkSupervised={handleMarkSupervised}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {adjustmentsWithGovernance.length > 0 ? (
        <div className="px-4 py-3 border-t border-border bg-muted/10">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <History className="h-3 w-3" /> Histórico de transições supervisionadas
          </div>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {adjustmentsWithGovernance.slice(0, 6).map((adj) => (
              <li key={`hist-${adj.id}`} className="leading-snug">
                <span className="font-medium text-foreground">{adj.id.replace("adapt:", "")}</span>{" "}
                · {adj.lastSupervisedTransition?.state} ·{" "}
                {adj.lastSupervisedTransition
                  ? new Date(adj.lastSupervisedTransition.at).toLocaleString("pt-BR")
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="px-4 py-2.5 text-[10px] text-muted-foreground border-t border-border bg-muted/10">
        Motor adaptativo determinístico · sem reinforcement learning · auditável via timeline
        (snapshot {new Date(layer.computedAt).toLocaleTimeString("pt-BR")}).
      </p>
    </OperationalLiveChrome>
  );
}
