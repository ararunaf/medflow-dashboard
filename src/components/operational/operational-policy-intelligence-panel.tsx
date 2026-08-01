/**
 * Painel de inteligência operacional de políticas supervisionadas — análise, achados
 * e recomendações explicáveis (sem execução automática de políticas).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Gauge, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { OperationalPolicyGovernanceRecommendationKind } from "@/lib/database.types";
import {
  patchPolicyGovernanceRecommendationLifecycleFn,
  patchPolicyIntelligenceCycleLifecycleFn,
  runOperationalPolicyIntelligenceAnalysisFn,
} from "@/lib/operations/api/operational-policy-intelligence";
import type { OperationalPolicyIntelligenceLayerSummary } from "@/lib/services/operations/operational-policy-intelligence-service";
import type { MutationResult } from "@/lib/server/fn-helpers";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<OperationalPolicyGovernanceRecommendationKind, string> = {
  threshold_tuning: "Thresholds",
  orchestration_policy: "Orquestração",
  escalation_tuning: "Escalonamento",
  adaptive_boundary: "Limites adaptativos",
  coordination_governance: "Coordenação",
};

const STATE_BADGE: Record<string, string> = {
  observed: "bg-muted text-muted-foreground ring-1 ring-border/80",
  analyzed: "bg-secondary/80 text-secondary-foreground",
  recommended: "bg-primary/10 text-primary ring-1 ring-primary/20",
  supervised_review:
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
  validated:
    "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
};

export function OperationalPolicyIntelligencePanel(props: {
  layer: OperationalPolicyIntelligenceLayerSummary;
  canGovern: boolean;
  isFetching: boolean;
  className?: string;
}) {
  const { layer, canGovern, isFetching, className } = props;
  const qc = useQueryClient();
  const toast = useToast();

  const runAnalysis = useMutation({
    mutationFn: async (): Promise<{ cycleId: string; skippedDuplicate?: boolean }> =>
      unwrap(
        (await runOperationalPolicyIntelligenceAnalysisFn()) as MutationResult<{
          cycleId: string;
          skippedDuplicate?: boolean;
        }>,
      ),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toast.success(
        data.skippedDuplicate ? "Análise já atualizada" : "Análise registrada",
        data.skippedDuplicate
          ? "Fingerprint idêntico nos últimos minutos — evitamos tempestade de governança."
          : `Ciclo ${data.cycleId.slice(0, 8)}… persistido com recomendações supervisionadas.`,
      );
    },
    onError: (e: unknown) => {
      toast.error("Falha na análise", e instanceof Error ? e.message : String(e));
    },
  });

  const patchRec = useMutation({
    mutationFn: async (input: {
      recommendationId: string;
      nextLifecycleState: "supervised_review" | "validated";
    }) => unwrap(await patchPolicyGovernanceRecommendationLifecycleFn({ data: input })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toast.success("Recomendação atualizada", "Estado de governança registrado.");
    },
    onError: (e: unknown) => {
      toast.error("Não foi possível atualizar", e instanceof Error ? e.message : String(e));
    },
  });

  const patchCycle = useMutation({
    mutationFn: async (input: {
      cycleId: string;
      nextLifecycleState: "supervised_review" | "validated";
    }) => unwrap(await patchPolicyIntelligenceCycleLifecycleFn({ data: input })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toast.success("Ciclo atualizado", "Estado do ciclo de policy intelligence salvo.");
    },
    onError: (e: unknown) => {
      toast.error("Não foi possível atualizar o ciclo", e instanceof Error ? e.message : String(e));
    },
  });

  if (!layer.enabled) {
    return (
      <OperationalLiveChrome
        isFetching={isFetching}
        className={cn("rounded-xl border border-border/80 bg-card/40 p-4", className)}
      >
        <div className="flex items-start gap-2">
          <Scale className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Governança de políticas</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Disponível para coordenação e administradores do tenant.
            </p>
          </div>
        </div>
      </OperationalLiveChrome>
    );
  }

  const es = layer.effectivenessSummary;
  const cycle = layer.cycle;

  return (
    <div id="ops-anchor-policy-intelligence" className={cn("scroll-mt-24", className)}>
      <OperationalLiveChrome
        isFetching={isFetching}
        className="rounded-xl border border-border/80 bg-card/40 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            <Scale className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Inteligência operacional de políticas
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">
                Detecção de padrões, recomendações supervisionadas e trilha auditável — sem
                auto-execução nem RL.
              </p>
            </div>
          </div>
          {canGovern ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shrink-0 gap-1.5"
              disabled={runAnalysis.isPending}
              onClick={() => runAnalysis.mutate()}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {runAnalysis.isPending ? "Analisando…" : "Executar análise"}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 mb-4">
          <div className="rounded-lg border border-border/70 bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
              <Gauge className="h-4 w-4 text-primary" aria-hidden />
              Resumo de effectiveness (achados)
            </div>
            <dl className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <dt className="text-muted-foreground">Críticos</dt>
                <dd className="font-semibold tabular-nums text-destructive">
                  {es.criticalFindings}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Alerta</dt>
                <dd className="font-semibold tabular-nums text-[color:var(--warning)]">
                  {es.warningFindings}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Info</dt>
                <dd className="font-semibold tabular-nums text-foreground">{es.infoFindings}</dd>
              </div>
            </dl>
            {cycle ? (
              <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
                Último ciclo:{" "}
                <span
                  className={cn(
                    "inline-flex rounded px-1.5 py-0.5 font-medium",
                    STATE_BADGE[cycle.lifecycleState],
                  )}
                >
                  {cycle.lifecycleState}
                </span>{" "}
                · {new Date(cycle.computedAt).toLocaleString("pt-BR")}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-2">
                Nenhum ciclo persistido ainda — execute uma análise supervisionada.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border/70 bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
              Foundation para governança adaptativa
            </div>
            {layer.adaptiveGovernanceHighlights.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Sem entradas de registry para o último ciclo.
              </p>
            ) : (
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                {layer.adaptiveGovernanceHighlights.map((h) => (
                  <li key={`${h.findingCode}-${h.futurePipeline}`} className="leading-snug">
                    <span className="font-medium text-foreground">{h.findingCode}</span> →{" "}
                    {h.futurePipeline}: {h.foundationNote}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {cycle ? (
          <div className="rounded-lg border border-border/70 bg-background/30 p-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
              <ClipboardList className="h-4 w-4" aria-hidden />
              Narrativa de governança
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {cycle.governanceNarrative}
            </p>
            {cycle.findings.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
                {cycle.findings.map((f) => (
                  <li key={f.code}>
                    <span className="font-semibold text-foreground">{f.headline}</span> (
                    {f.severity})
                  </li>
                ))}
              </ul>
            ) : null}
            {canGovern && cycle.lifecycleState === "recommended" ? (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={patchCycle.isPending}
                  onClick={() =>
                    patchCycle.mutate({
                      cycleId: cycle.id,
                      nextLifecycleState: "supervised_review",
                    })
                  }
                >
                  Marcar ciclo em revisão
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={patchCycle.isPending}
                  onClick={() =>
                    patchCycle.mutate({ cycleId: cycle.id, nextLifecycleState: "validated" })
                  }
                >
                  Validar ciclo
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="text-xs font-semibold text-foreground mb-2">
          Sugestões de tuning (supervisionadas)
        </div>
        {layer.recommendations.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma recomendação no último ciclo.</p>
        ) : (
          <ul className="space-y-3">
            {layer.recommendations.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-border/60 bg-background/40 p-3 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                    {KIND_LABEL[r.recommendationKind]}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] rounded px-1.5 py-0.5 font-medium",
                      STATE_BADGE[r.lifecycleState],
                    )}
                  >
                    {r.lifecycleState}
                  </span>
                </div>
                <div className="text-sm font-medium text-foreground">{r.title}</div>
                <p className="text-[11px] text-muted-foreground leading-snug">{r.detail}</p>
                <details className="text-[11px] text-muted-foreground">
                  <summary className="cursor-pointer text-primary font-medium">
                    Explainability
                  </summary>
                  <ul className="mt-2 space-y-1 list-disc pl-4">
                    {r.explainability.policyRationale.map((line, i) => (
                      <li key={`p-${i}`}>{line}</li>
                    ))}
                    {r.explainability.adjustmentExplainability.map((line, i) => (
                      <li key={`a-${i}`}>{line}</li>
                    ))}
                  </ul>
                </details>
                {canGovern &&
                (r.lifecycleState === "recommended" || r.lifecycleState === "supervised_review") ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {r.lifecycleState === "recommended" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={patchRec.isPending}
                        onClick={() =>
                          patchRec.mutate({
                            recommendationId: r.id,
                            nextLifecycleState: "supervised_review",
                          })
                        }
                      >
                        Em revisão
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={patchRec.isPending}
                      onClick={() =>
                        patchRec.mutate({ recommendationId: r.id, nextLifecycleState: "validated" })
                      }
                    >
                      Validar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </OperationalLiveChrome>
    </div>
  );
}
