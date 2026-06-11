import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Lock, RefreshCw, Shield, Unlock } from "lucide-react";
import { IaBadge } from "@/components/operational/ia-badge";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { EmptyState, ErrorState } from "@/components/ui-kit";
import {
  useOperationalAgentMutations,
  useOperationalAgentsBundleQuery,
} from "@/hooks/use-operational-agents";
import type { OperationalAgentGovernanceSessionState } from "@/lib/database.types";
import type { OperationalAgentExplainabilityRef } from "@/lib/operations/agents/contracts";
import { getOperationalAgentRegistryEntry } from "@/lib/operations/agents/registry";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function statePill(state: OperationalAgentGovernanceSessionState): {
  label: string;
  className: string;
} {
  switch (state) {
    case "idle":
      return { label: "Ocioso", className: "bg-muted text-muted-foreground ring-1 ring-border/80" };
    case "reasoning":
      return {
        label: "Raciocínio",
        className: "bg-primary/10 text-primary ring-1 ring-primary/20",
      };
    case "awaiting_human_review":
      return {
        label: "Aguardando revisão",
        className:
          "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
      };
    case "approved":
      return {
        label: "Aprovado",
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

function refLine(r: OperationalAgentExplainabilityRef): string {
  if (r.kind === "score") return `Score · ${r.scoreId} = ${r.value.toFixed(1)} (${r.label})`;
  if (r.kind === "forecast") return `Forecast · ${r.projection} (${r.basis})`;
  if (r.kind === "orchestration") return `Orquestração · ${r.title} [${r.state}]`;
  if (r.kind === "recommendation") return `Recomendação · ${r.title} (${r.state})`;
  if (r.kind === "simulation")
    return `Simulação · passo ${r.stepOrdinal} · run ${r.sandboxRunId.slice(0, 8)}…`;
  return `Proposta · ${r.proposalId.slice(0, 8)}… (orch ${r.orchestrationId.slice(0, 8)}…)`;
}

export function OperationalActiveAgentsPanel(props: { enabled: boolean; className?: string }) {
  const q = useOperationalAgentsBundleQuery({ enabled: props.enabled });
  const m = useOperationalAgentMutations();
  const [blockReasonByAgent, setBlockReasonByAgent] = useState<Record<string, string>>({});

  const busy =
    m.runReasoning.isPending || m.approve.isPending || m.block.isPending || m.unblock.isPending;

  const fingerprintEcho = useMemo(
    () => q.data?.surfaceFingerprint?.slice(0, 48) ?? "",
    [q.data?.surfaceFingerprint],
  );

  if (!props.enabled) return null;

  if (q.isLoading) {
    return (
      <section
        id="ops-anchor-operational-agents"
        className={cn(
          "scroll-mt-24 rounded-xl border border-border/80 bg-muted/10 p-4",
          props.className,
        )}
        aria-label="Agentes operacionais"
      >
        <p className="text-xs text-muted-foreground">Carregando agentes supervisionados…</p>
      </section>
    );
  }

  if (q.isError) {
    return (
      <section id="ops-anchor-operational-agents" className={cn("scroll-mt-24", props.className)}>
        <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
      </section>
    );
  }

  if (!q.data) {
    return (
      <section id="ops-anchor-operational-agents" className={cn("scroll-mt-24", props.className)}>
        <EmptyState title="Sem dados de agentes" description="Tente atualizar o painel." />
      </section>
    );
  }

  return (
    <section
      id="ops-anchor-operational-agents"
      className={cn("scroll-mt-24", props.className)}
      aria-label="Agentes operacionais supervisionados"
    >
      <OperationalLiveChrome isFetching={q.isFetching} className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 bg-background/40">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Agentes operacionais ativos</h2>
                <IaBadge />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Domínios escopados · governança explícita · sem execução autônoma
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fingerprintEcho ? (
              <span
                className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]"
                title={q.data.surfaceFingerprint}
              >
                Δ {fingerprintEcho}…
              </span>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void m.runReasoning.mutateAsync()}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-accent/60 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", m.runReasoning.isPending && "animate-spin")} />
              Atualizar raciocínio
            </button>
          </div>
        </div>

        <div className="p-4 grid gap-3 md:grid-cols-2">
          {q.data.agents.map((agent) => {
            const reg = getOperationalAgentRegistryEntry(agent.agentType);
            const st = statePill(agent.effectiveState);
            const blockReason = blockReasonByAgent[agent.agentType] ?? "";
            return (
              <div
                key={agent.agentType}
                className="rounded-lg border border-border/80 bg-background/50 p-3 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        {reg.shortLabel}
                      </span>
                      <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5 font-medium">
                        {agent.agentType.replaceAll("_", " ")}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          st.className,
                        )}
                      >
                        <Shield className="h-3 w-3" />
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{agent.domainLabel}</p>
                  </div>
                </div>
                <p className="text-[11px] text-foreground leading-snug">{agent.rationaleSummary}</p>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4 max-h-[100px] overflow-y-auto">
                  {agent.headlines.slice(0, 6).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
                <details className="text-[10px] text-muted-foreground">
                  <summary className="cursor-pointer select-none text-foreground/80">
                    Explainability ({agent.refs.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5 font-mono pl-2 border-l border-border/80">
                    {agent.refs.slice(0, 10).map((r, i) => (
                      <li key={i}>{refLine(r)}</li>
                    ))}
                  </ul>
                </details>
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                  {agent.policyIds.map((p) => (
                    <span key={p} className="rounded bg-muted/60 px-1 py-0.5">
                      {p}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={busy || agent.effectiveState === "blocked"}
                      onClick={() => void m.approve.mutateAsync({ agentType: agent.agentType })}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium hover:bg-accent/60 disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Aprovar leitura
                    </button>
                    <button
                      type="button"
                      disabled={busy || agent.effectiveState !== "blocked"}
                      onClick={() => void m.unblock.mutateAsync({ agentType: agent.agentType })}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium hover:bg-accent/60 disabled:opacity-40"
                    >
                      <Unlock className="h-3 w-3" />
                      Desbloquear
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                      Motivo do bloqueio (supervisão)
                      <textarea
                        rows={2}
                        value={blockReason}
                        onChange={(e) =>
                          setBlockReasonByAgent((prev) => ({
                            ...prev,
                            [agent.agentType]: e.target.value,
                          }))
                        }
                        className="rounded-md border border-border bg-background text-[11px] px-2 py-1 font-normal"
                        placeholder="Descreva o motivo — fica no audit trail."
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy || !blockReason.trim()}
                      onClick={() =>
                        void m.block
                          .mutateAsync({ agentType: agent.agentType, reason: blockReason.trim() })
                          .then(() =>
                            setBlockReasonByAgent((prev) => {
                              const n = { ...prev };
                              delete n[agent.agentType];
                              return n;
                            }),
                          )
                      }
                      className="self-start inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Lock className="h-3 w-3" />
                      Bloquear agente
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </OperationalLiveChrome>
    </section>
  );
}
