/**
 * Painel de memória operacional supervisionada — effectiveness, outcomes e registry
 * (sem RL nem execução automática).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Gauge, History, ListTree } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { patchOperationalMemoryStateFn } from "@/lib/operations/api/operational-memory";
import type { OperationalMemoryKind } from "@/lib/database.types";
import type { OperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/types";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<OperationalMemoryKind, string> = {
  recommendation_outcome: "Recomendação",
  mitigation_effectiveness: "Mitigação",
  execution_outcome: "Execução",
  rollback_signal: "Rollback",
  deterioration_pattern: "Deterioração",
  coordination_effectiveness: "Coordenação",
  orchestration_effectiveness: "Orquestração",
  proposal_outcome: "Proposta",
  forecast_accuracy_snapshot: "Forecast",
};

const STATE_BADGE: Record<string, string> = {
  observed: "bg-muted text-muted-foreground ring-1 ring-border/80",
  tracked: "bg-primary/10 text-primary ring-1 ring-primary/20",
  validated:
    "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
  archived: "bg-secondary/80 text-secondary-foreground",
};

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

export function OperationalMemoryPanel(props: {
  memory: OperationalMemoryLayerSummary;
  canGovern: boolean;
  isFetching: boolean;
  className?: string;
}) {
  const { memory, canGovern, isFetching, className } = props;
  const qc = useQueryClient();
  const toast = useToast();
  const patchState = useMutation({
    mutationFn: async (input: { memoryEntryId: string; nextState: "validated" | "archived" }) =>
      unwrap(await patchOperationalMemoryStateFn({ data: input })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toast.success("Memória atualizada", "Estado registrado com sucesso.");
    },
    onError: (e: unknown) => {
      toast.error("Não foi possível atualizar", e instanceof Error ? e.message : String(e));
    },
  });

  const fusion = memory.effectivenessFusion;
  const pressureLabel =
    fusion.rollbackPressure === "high"
      ? "Alta"
      : fusion.rollbackPressure === "medium"
        ? "Média"
        : "Baixa";

  return (
    <OperationalLiveChrome
      isFetching={isFetching}
      className={cn("rounded-xl border border-border/80 bg-card/40 p-4", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <Brain className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Memória operacional</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">
              Outcomes supervisionados, effectiveness e sinais leves para aprendizado futuro — sem
              decisões automáticas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
          <History className="h-3.5 w-3.5" aria-hidden />
          <span>Janela: {new Date(memory.windowFromISO).toLocaleDateString()} → agora</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-background/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
            <Gauge className="h-4 w-4 text-primary" aria-hidden />
            Effectiveness fusionado
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {fusion.narratives.map((line, i) => (
              <li key={`${i}-${line.slice(0, 48)}`} className="leading-snug">
                {line}
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <dt className="text-muted-foreground">Alinhamento recomendações</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {pct(fusion.recommendationQuality)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Média memória (amostra)</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {pct(fusion.memoryEffectivenessAvg)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Pressão de rollback (heurística)</dt>
              <dd className="font-semibold text-foreground">{pressureLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-border/70 bg-background/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
            <ListTree className="h-4 w-4 text-primary" aria-hidden />
            Pipelines futuros (registry)
          </div>
          <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {memory.registryHighlights.length === 0 ? (
              <li className="text-xs text-muted-foreground">
                Sem tipos de memória no recorte recente.
              </li>
            ) : (
              memory.registryHighlights.map((h) => (
                <li key={`${h.kind}-${h.pipeline}`} className="text-xs leading-snug">
                  <span className="font-medium text-foreground">{KIND_LABEL[h.kind]}</span>
                  <span className="text-muted-foreground"> · {h.pipeline.replace(/_/g, " ")}</span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{h.note}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {memory.forecastProbe ? (
        <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Forecast × saúde: </span>
          {memory.forecastProbe.alignmentNote}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-xs font-semibold text-foreground mb-2">Insights recentes</div>
        <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {memory.recentInsights.length === 0 ? (
            <li className="text-xs text-muted-foreground">
              Nenhuma entrada nos últimos 14 dias — memória será preenchida conforme feedback,
              execuções e ciclos de coordenação.
            </li>
          ) : (
            memory.recentInsights.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs leading-snug"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {KIND_LABEL[row.memoryKind]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        STATE_BADGE[row.memoryState] ?? STATE_BADGE.observed,
                      )}
                    >
                      {row.memoryState}
                    </span>
                  </div>
                  {canGovern && row.memoryState !== "archived" ? (
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {row.memoryState !== "validated" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          disabled={patchState.isPending}
                          onClick={() =>
                            patchState.mutate({
                              memoryEntryId: row.id,
                              nextState: "validated",
                            })
                          }
                        >
                          Validar
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] px-2"
                        disabled={patchState.isPending}
                        onClick={() =>
                          patchState.mutate({ memoryEntryId: row.id, nextState: "archived" })
                        }
                      >
                        Arquivar
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-1">{row.outcomeNarrative}</p>
                {row.effectivenessScore != null ? (
                  <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    Effectiveness: {pct(row.effectivenessScore)}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </OperationalLiveChrome>
  );
}
