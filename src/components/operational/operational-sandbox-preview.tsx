/**
 * UI do sandbox de execução operacional (dry-run only).
 *
 * Exibe:
 *  - simulation preview card (estado, summary, projeções);
 *  - execution impact panel (entidades afetadas, conflitos);
 *  - rollback preview;
 *  - execution safety badges + policy checks;
 *  - projected operational changes (scores, forecast).
 *
 * NUNCA aciona mutações reais — toda interação é dry-run.
 */
import { useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  FlaskConical,
  Layers,
  Loader2,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import type {
  AffectedEntity,
  ExecutionSafetyEvaluation,
  ImpactAnalysis,
  OperationalImpactSeverity,
  OperationalSimulationResult,
  OperationalSimulationState,
  PolicyCheckResult,
  ProjectedConflict,
  ProjectedForecastChange,
  ProjectedScoreChange,
  RollbackPreviewStep,
  SimulatedMutation,
} from "@/lib/operations/execution-sandbox";
import { cn } from "@/lib/utils";

const STATE_BADGES: Record<
  OperationalSimulationState,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  simulated: {
    label: "Simulada",
    className: "bg-muted text-muted-foreground ring-1 ring-border",
    icon: FlaskConical,
  },
  safe: {
    label: "Segura (dry-run)",
    className:
      "bg-[color:var(--success)]/12 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
    icon: ShieldCheck,
  },
  risky: {
    label: "Com ressalvas",
    className:
      "bg-[color:var(--warning)]/12 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
    icon: TriangleAlert,
  },
  blocked: {
    label: "Bloqueada",
    className: "bg-destructive/12 text-destructive ring-1 ring-destructive/30",
    icon: AlertOctagon,
  },
};

const SEVERITY_LABEL: Record<OperationalImpactSeverity, string> = {
  none: "Sem impacto",
  low: "Baixo",
  moderate: "Moderado",
  high: "Alto",
  critical: "Crítico",
};

const SEVERITY_CLASS: Record<OperationalImpactSeverity, string> = {
  none: "bg-muted/70 text-muted-foreground ring-1 ring-border",
  low: "bg-muted text-foreground ring-1 ring-border/80",
  moderate: "bg-primary/10 text-primary ring-1 ring-primary/25",
  high: "bg-[color:var(--warning)]/12 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
  critical: "bg-destructive/12 text-destructive ring-1 ring-destructive/30",
};

function SeverityPill({ severity }: { severity: OperationalImpactSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold",
        SEVERITY_CLASS[severity],
      )}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function StateBadge({ state }: { state: OperationalSimulationState }) {
  const cfg = STATE_BADGES[state];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold",
        cfg.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function PolicyCheckRow({ check }: { check: PolicyCheckResult }) {
  const icon =
    check.status === "pass" ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
    ) : check.status === "warn" ? (
      <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--warning)]" />
    ) : (
      <AlertOctagon className="h-3.5 w-3.5 text-destructive" />
    );
  return (
    <li className="flex items-start gap-2 text-[11px]">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span className="min-w-0">
        <span className="font-semibold text-foreground">{check.label}</span>
        <span className="text-muted-foreground"> — {check.detail}</span>
      </span>
    </li>
  );
}

function MutationRow({ mutation }: { mutation: SimulatedMutation }) {
  return (
    <li className="rounded-md border border-border/70 bg-background/50 p-2.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">{mutation.id}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {mutation.direction} · {mutation.targetTable}
        </span>
      </div>
      <p className="text-xs text-foreground">{mutation.describe}</p>
      {mutation.referencesEntityIds.length > 0 ? (
        <p className="text-[10px] text-muted-foreground">
          refs: {mutation.referencesEntityIds.map((id) => id.slice(0, 8) + "…").join(", ")}
        </p>
      ) : null}
    </li>
  );
}

function RollbackRow({ step }: { step: RollbackPreviewStep }) {
  return (
    <li className="rounded-md border border-dashed border-border/70 bg-muted/15 p-2.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">{step.mutationId}</span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wide font-semibold",
            step.trivialReverse ? "text-[color:var(--success)]" : "text-[color:var(--warning)]",
          )}
        >
          {step.trivialReverse ? "Reverso trivial" : "Reverso complexo"}
        </span>
      </div>
      <p className="text-xs text-foreground">
        <RotateCcw className="inline h-3 w-3 mr-1 text-muted-foreground" />
        {step.describe}
      </p>
    </li>
  );
}

function ScoreChangeRow({ change }: { change: ProjectedScoreChange }) {
  const positiveSign = change.projectedDeltaPoints > 0 ? "+" : "";
  const isImprovement =
    change.scoreId === "coverage_risk_score" || change.scoreId === "coordination_stress_score"
      ? change.projectedDeltaPoints > 0
      : change.projectedDeltaPoints > 0;
  return (
    <li className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{change.scoreId}</p>
        <p className="text-[10px] text-muted-foreground">{change.rationale}</p>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
          isImprovement
            ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
            : "bg-destructive/10 text-destructive",
        )}
      >
        {positiveSign}
        {change.projectedDeltaPoints.toFixed(1)} pts · {change.confidence}
      </span>
    </li>
  );
}

function ForecastChangeRow({ change }: { change: ProjectedForecastChange }) {
  const same = change.before === change.after;
  return (
    <div
      className={cn(
        "rounded-md border p-2.5",
        same ? "border-border bg-muted/20" : "border-primary/30 bg-primary/[0.06]",
      )}
    >
      <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Forecast projetado
      </p>
      <p className="mt-1 text-xs text-foreground">
        <span className="font-mono">{change.before}</span> →{" "}
        <span className="font-mono font-semibold">{change.after}</span>
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{change.rationale}</p>
    </div>
  );
}

function AffectedEntityRow({ entity }: { entity: AffectedEntity }) {
  return (
    <li className="flex items-center justify-between gap-2 py-1.5">
      <span className="min-w-0">
        <span className="text-xs font-medium text-foreground">{entity.label}</span>
        <span className="ml-2 text-[10px] text-muted-foreground">
          {entity.kind} · {entity.tags.join(", ")}
        </span>
      </span>
      <SeverityPill severity={entity.impactSeverity} />
    </li>
  );
}

function ConflictRow({ conflict }: { conflict: ProjectedConflict }) {
  return (
    <li className="flex items-start gap-2 text-[11px]">
      <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--warning)] shrink-0 mt-0.5" />
      <span className="min-w-0">
        <span className="font-semibold text-foreground">{conflict.kind}</span>
        <SeverityPill severity={conflict.severity} />
        <span className="block text-muted-foreground">{conflict.description}</span>
      </span>
    </li>
  );
}

export function OperationalSandboxPreview(props: {
  result: OperationalSimulationResult;
  className?: string;
}) {
  const { result } = props;
  const [openSafety, setOpenSafety] = useState(false);
  const [openImpact, setOpenImpact] = useState(true);
  const [openMutations, setOpenMutations] = useState(false);
  const [openRollback, setOpenRollback] = useState(false);

  const impact = result.impact as ImpactAnalysis;
  const safety = result.safety as ExecutionSafetyEvaluation;

  const totalChecks = safety.policyChecks.length;
  const passCount = safety.policyChecks.filter((c) => c.status === "pass").length;

  const stateRationale = useMemo(() => result.safety.rationale.slice(0, 3), [result]);

  return (
    <section
      className={cn(
        "rounded-md border border-primary/25 bg-primary/[0.03] p-3 space-y-3",
        props.className,
      )}
      aria-label="Pré-visualização de execução sandbox (dry-run)"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary shrink-0" />
            <StateBadge state={result.state} />
            <SeverityPill severity={impact.overallSeverity} />
            <span className="text-[10px] text-muted-foreground font-mono">
              {result.simulationId}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground leading-snug">
            {result.summary.headline}
          </h4>
        </div>
      </header>

      <ul className="text-xs text-foreground/95 list-disc pl-4 space-y-0.5">
        {result.summary.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      {stateRationale.length > 0 ? (
        <div className="rounded-md border border-border/70 bg-background/70 p-2 text-[11px] text-muted-foreground space-y-1">
          {stateRationale.map((r, i) => (
            <p key={i} className="leading-relaxed">
              <span className="text-foreground font-medium">Rationale:</span> {r}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <ForecastChangeRow change={impact.projectedForecast} />

        <div className="rounded-md border border-border/70 bg-background/70 p-2.5">
          <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            Estado de saúde projetado
          </p>
          <p className="mt-1 text-xs text-foreground">
            <span className="font-mono">{impact.projectedHealthStateAfter}</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {impact.affectedEntityCount} entidade(s) afetada(s) · {result.mutations.length}{" "}
            mutação(ões) projetada(s).
          </p>
        </div>
      </div>

      <CollapsibleSection
        title={`Impacto projetado (${impact.affectedEntityCount} entidades · ${impact.projectedConflicts.length} conflito(s))`}
        open={openImpact}
        onToggle={() => setOpenImpact((v) => !v)}
      >
        {impact.projectedScoreChanges.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold text-foreground mb-1">Deltas de score</p>
            <ul className="divide-y divide-border/40">
              {impact.projectedScoreChanges.map((c, i) => (
                <ScoreChangeRow key={i} change={c} />
              ))}
            </ul>
          </div>
        ) : null}
        {impact.affectedEntities.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold text-foreground mt-2 mb-1">
              Entidades afetadas
            </p>
            <ul className="divide-y divide-border/40">
              {impact.affectedEntities.map((e) => (
                <AffectedEntityRow key={`${e.kind}-${e.id}`} entity={e} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            Nenhuma entidade direta afetada pela simulação.
          </p>
        )}
        {impact.projectedConflicts.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold text-foreground mt-2 mb-1">
              Conflitos previstos
            </p>
            <ul className="space-y-1">
              {impact.projectedConflicts.map((c, i) => (
                <ConflictRow key={i} conflict={c} />
              ))}
            </ul>
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Mutações simuladas (${result.mutations.length})`}
        open={openMutations}
        onToggle={() => setOpenMutations((v) => !v)}
      >
        {result.mutations.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">
            Sem mutações projetadas para esta simulação.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {result.mutations.map((m) => (
              <MutationRow key={m.id} mutation={m} />
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Rollback preview (${result.rollbackPreview.length} passo(s))`}
        open={openRollback}
        onToggle={() => setOpenRollback((v) => !v)}
      >
        {result.rollbackPreview.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">
            Sem mutações — nenhum rollback necessário.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {result.rollbackPreview.map((s) => (
              <RollbackRow key={s.mutationId} step={s} />
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Safety policy (${passCount}/${totalChecks} checks)`}
        open={openSafety}
        onToggle={() => setOpenSafety((v) => !v)}
      >
        <ul className="space-y-1">
          {safety.policyChecks.map((c) => (
            <PolicyCheckRow key={c.id} check={c} />
          ))}
        </ul>
        {result.explainability.narrative.length > 0 ? (
          <div className="mt-2 rounded-md border border-border/70 bg-background/60 p-2 text-[11px] text-muted-foreground space-y-0.5">
            {result.explainability.narrative.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null}
      </CollapsibleSection>

      <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
        <CircleSlash className="inline h-3 w-3 mr-1" />
        Esta camada é puramente simulada. Nenhum plantão, atribuição ou swap foi alterado.
      </p>
    </section>
  );
}

function CollapsibleSection(props: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background/40">
      <button
        type="button"
        onClick={props.onToggle}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent/40"
      >
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {props.title}
        </span>
        {props.open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {props.open ? <div className="px-2.5 pb-2.5 pt-1 space-y-2">{props.children}</div> : null}
    </div>
  );
}

/** Botão dedicado para invocar a simulação. */
export function OperationalSandboxRunButton(props: {
  isPending: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled || props.isPending}
      onClick={props.onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/[0.15] disabled:opacity-50"
    >
      {props.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <PlayCircle className="h-3.5 w-3.5" />
      )}
      {props.label ?? "Executar simulação (dry-run)"}
    </button>
  );
}
