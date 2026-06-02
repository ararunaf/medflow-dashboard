import { useMemo } from "react";
import { GitBranch, Layers, RefreshCw, Scale, Users } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { EmptyState, ErrorState } from "@/components/ui-kit";
import {
  useOperationalAgentCoordinationBundleQuery,
  useOperationalAgentCoordinationMutations,
} from "@/hooks/use-operational-agent-coordination";
import type { OperationalAgentCoordinationState } from "@/lib/operations/agents/coordination/types";
import { getOperationalAgentRegistryEntry } from "@/lib/operations/agents/registry";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function coordinationStatePill(state: OperationalAgentCoordinationState): {
  label: string;
  className: string;
} {
  switch (state) {
    case "idle":
      return { label: "Ocioso", className: "bg-muted text-muted-foreground ring-1 ring-border/80" };
    case "collaborating":
      return {
        label: "Colaborando",
        className: "bg-primary/10 text-primary ring-1 ring-primary/20",
      };
    case "awaiting_supervision":
      return {
        label: "Aguardando supervisão",
        className:
          "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
      };
    case "coordinated":
      return {
        label: "Coordenado",
        className:
          "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/20",
      };
    case "blocked":
      return {
        label: "Bloqueado",
        className: "bg-destructive/15 text-destructive ring-1 ring-destructive/25",
      };
    default:
      return { label: state, className: "bg-muted text-muted-foreground" };
  }
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function OperationalAgentCoordinationPanel(props: { enabled: boolean; className?: string }) {
  const q = useOperationalAgentCoordinationBundleQuery({ enabled: props.enabled });
  const m = useOperationalAgentCoordinationMutations();
  const latest = q.data?.latestCycle ?? null;

  const conflictSummary = useMemo(() => {
    if (!latest?.conflicts.length) return null;
    return latest.conflicts.map((c) => (
      <li key={c.recommendationId} className="text-[11px] text-muted-foreground leading-snug">
        <span className="font-medium text-foreground">{c.title}</span> — vencedor:{" "}
        <span className="font-mono">{c.winner}</span>
        <span className="block text-[10px] mt-0.5 opacity-90">{c.rationale}</span>
      </li>
    ));
  }, [latest]);

  if (!props.enabled) return null;

  if (q.isLoading) {
    return (
      <section
        id="ops-anchor-agent-coordination"
        className={cn(
          "scroll-mt-24 rounded-xl border border-border/80 bg-muted/10 p-4",
          props.className,
        )}
        aria-label="Coordenação colaborativa"
      >
        <p className="text-xs text-muted-foreground">Carregando painel de coordenação…</p>
      </section>
    );
  }

  if (q.isError) {
    return (
      <section id="ops-anchor-agent-coordination" className={cn("scroll-mt-24", props.className)}>
        <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
      </section>
    );
  }

  if (!q.data) {
    return (
      <section id="ops-anchor-agent-coordination" className={cn("scroll-mt-24", props.className)}>
        <EmptyState title="Sem dados de coordenação" description="Tente atualizar o painel." />
      </section>
    );
  }

  return (
    <section
      id="ops-anchor-agent-coordination"
      className={cn("scroll-mt-24", props.className)}
      aria-label="Coordenação colaborativa entre agentes"
    >
      <OperationalLiveChrome isFetching={q.isFetching} className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 bg-background/40">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Coordenação colaborativa</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Contexto compartilhado · arbitragem por domínio · ciclo único (sem autonomia de
                execução)
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={m.runCycle.isPending}
            onClick={() => void m.runCycle.mutateAsync()}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-accent/60 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", m.runCycle.isPending && "animate-spin")} />
            Executar ciclo supervisionado
          </button>
        </div>

        {!latest ? (
          <div className="p-4">
            <EmptyState
              title="Nenhum ciclo de coordenação ainda"
              description="Execute um ciclo supervisionado para materializar contexto compartilhado, delegação contextual e resolução de conflitos entre agentes."
            />
          </div>
        ) : (
          <div className="p-4 grid gap-4">
            <div className="rounded-lg border border-border/80 bg-background/40 p-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Resumo da coordenação</span>
                {latest.sharedContext.orchestrationAware ? (
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                    Orquestração-aware
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-foreground leading-relaxed">
                {latest.collaborationNarrative}
              </p>
              <p
                className="text-[10px] text-muted-foreground mt-2 font-mono truncate"
                title={latest.correlationId}
              >
                Correlação: {latest.correlationId}
              </p>
            </div>

            {latest.conflicts.length ? (
              <div className="rounded-lg border border-[color:var(--warning)]/25 bg-[color:var(--warning)]/[0.06] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="h-3.5 w-3.5 text-[color:var(--warning)]" />
                  <span className="text-xs font-semibold text-foreground">
                    Conflitos e arbitragem
                  </span>
                </div>
                <ul className="space-y-2">{conflictSummary}</ul>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                Nenhuma sobreposição contestada entre agentes neste ciclo.
              </p>
            )}

            <div>
              <h3 className="text-[11px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Raciocínio colaborativo por agente
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {latest.participants.map((p) => {
                  const reg = getOperationalAgentRegistryEntry(p.agentType);
                  const st = coordinationStatePill(p.coordinationState);
                  return (
                    <div
                      key={p.agentType}
                      className="rounded-lg border border-border/80 bg-background/50 p-3 flex flex-col gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold">{reg.shortLabel}</span>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            st.className,
                          )}
                        >
                          {st.label}
                        </span>
                        {p.delegatedReasoningTo ? (
                          <span className="text-[10px] text-muted-foreground">
                            → delegação contextual para{" "}
                            <span className="font-mono">{p.delegatedReasoningTo}</span>
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-foreground leading-snug">
                        {p.collaborativeRationale}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5 text-[10px] text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground/80">Insights:</span>{" "}
                          {p.sharedInsights.slice(0, 3).join(" · ") || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground/80">Riscos:</span>{" "}
                          {p.sharedRisks.slice(0, 2).join(" · ") || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground/80">Forecast:</span>{" "}
                          {p.sharedForecasts[0] ?? "—"}
                        </div>
                      </div>
                      {p.sharedRecommendations.length ? (
                        <details className="text-[10px]">
                          <summary className="cursor-pointer select-none text-foreground/80">
                            Recomendações compartilhadas ({p.sharedRecommendations.length})
                          </summary>
                          <ul className="mt-1 space-y-0.5 pl-2 border-l border-border/80">
                            {p.sharedRecommendations.map((r) => (
                              <li key={r.id}>
                                <span className="font-mono text-[9px]">{r.id.slice(0, 8)}…</span>{" "}
                                {r.title}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {q.data.recentCycles.length > 1 ? (
              <div>
                <h3 className="text-[11px] font-semibold text-foreground mb-2">
                  Timeline de ciclos
                </h3>
                <ul className="space-y-1.5 border border-border/60 rounded-lg p-2 bg-muted/20 max-h-[140px] overflow-y-auto">
                  {q.data.recentCycles.map((row) => {
                    const rawConflicts = row.conflicts_json as unknown;
                    const cLen = Array.isArray(rawConflicts) ? rawConflicts.length : 0;
                    return (
                      <li
                        key={row.id}
                        className="text-[10px] text-muted-foreground flex justify-between gap-2"
                      >
                        <span className="font-mono truncate">
                          {row.correlation_id.slice(0, 10)}…
                        </span>
                        <span className="shrink-0">{formatWhen(row.created_at)}</span>
                        <span className="shrink-0">{cLen ? `${cLen} confl.` : "ok"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </OperationalLiveChrome>
    </section>
  );
}
