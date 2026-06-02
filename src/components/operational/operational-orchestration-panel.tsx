import { useMemo, useState } from "react";
import { ArrowDown, GitBranch, Layers, ListOrdered, Workflow } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui-kit";
import { useOperationalActionProposalsQuery } from "@/hooks/use-operational-action-proposals";
import {
  useOperationalOrchestrationDetailQuery,
  useOperationalOrchestrationMutations,
  useOperationalOrchestrationsQuery,
} from "@/hooks/use-operational-orchestration";
import { isOperationalManager } from "@/lib/auth/rbac";
import type {
  OperationalOrchestrationDto,
  OrchestrationNarrativeEntry,
  OrchestrationRollbackPlanItem,
} from "@/lib/operations/orchestration/types";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function stateBadge(state: OperationalOrchestrationDto["state"]): {
  label: string;
  className: string;
} {
  switch (state) {
    case "planned":
      return {
        label: "Planejada",
        className: "bg-muted text-muted-foreground ring-1 ring-border/80",
      };
    case "awaiting_approval":
      return {
        label: "Aguardando aprovação",
        className:
          "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
      };
    case "orchestrating":
      return {
        label: "Orquestrando",
        className: "bg-primary/10 text-primary ring-1 ring-primary/20",
      };
    case "partially_executed":
      return {
        label: "Parcialmente executada",
        className: "bg-[color:var(--warning)]/12 text-foreground ring-1 ring-border/80",
      };
    case "completed":
      return {
        label: "Concluída",
        className:
          "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/20",
      };
    case "rolled_back":
      return {
        label: "Rollback total",
        className: "bg-muted text-foreground ring-1 ring-border/80",
      };
    case "blocked":
      return {
        label: "Bloqueada",
        className: "bg-destructive/15 text-destructive ring-1 ring-destructive/25",
      };
    default:
      return { label: state, className: "bg-muted text-muted-foreground" };
  }
}

function stepKindLabel(k: string): string {
  if (k === "proposal_gate") return "Portão";
  if (k === "sandbox_simulation") return "Simulação";
  if (k === "supervised_execution") return "Execução";
  return k;
}

export function OperationalOrchestrationPanel(props: {
  enabled: boolean;
  role: string;
  className?: string;
}) {
  const can = isOperationalManager(props.role as never) && props.enabled;
  const listQ = useOperationalOrchestrationsQuery({ enabled: can });
  const proposalsQ = useOperationalActionProposalsQuery({ enabled: can });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQ = useOperationalOrchestrationDetailQuery({
    orchestrationId: selectedId,
    enabled: can && !!selectedId,
  });
  const m = useOperationalOrchestrationMutations();

  const [title, setTitle] = useState("Fluxo supervisionado");
  const [idsText, setIdsText] = useState("");
  const [execConfirm, setExecConfirm] = useState(false);
  const [idem, setIdem] = useState("");

  const list = (listQ.data ?? []) as OperationalOrchestrationDto[];
  const orch: OperationalOrchestrationDto | null = detailQ.data
    ? (detailQ.data as OperationalOrchestrationDto)
    : null;

  const progress = useMemo(() => {
    if (!orch) return { done: 0, total: 0, pct: 0 };
    const total = orch.steps.length;
    const done = orch.steps.filter(
      (s) =>
        s.stepState === "completed" || s.stepState === "skipped" || s.stepState === "rolled_back",
    ).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [orch]);

  const narrativeRows = useMemo((): OrchestrationNarrativeEntry[] => {
    if (!orch) return [];
    const raw = orch.narrativeJson;
    return Array.isArray(raw) ? (raw as OrchestrationNarrativeEntry[]) : [];
  }, [orch]);

  const rollbackItems = useMemo((): OrchestrationRollbackPlanItem[] => {
    if (!orch) return [];
    const rb = orch.rollbackPreviewJson;
    if (rb && typeof rb === "object" && !Array.isArray(rb) && "items" in rb) {
      const items = (rb as { items?: unknown }).items;
      return Array.isArray(items) ? (items as OrchestrationRollbackPlanItem[]) : [];
    }
    return [];
  }, [orch]);

  if (!can) return null;

  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-muted/10 overflow-hidden",
        props.className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/80 bg-background/40">
        <div className="flex items-center gap-2 min-w-0">
          <Workflow className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              Orquestração operacional
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Cadeias supervisionadas · políticas · dependências · rollback em cadeia
            </p>
          </div>
        </div>
        {listQ.isFetching ? (
          <span className="text-[10px] text-muted-foreground">Atualizando…</span>
        ) : null}
      </div>

      <div className="p-4 space-y-4">
        {listQ.isError ? <ErrorState message={describeError(listQ.error).message} /> : null}

        <div className="rounded-lg border border-border/70 bg-background/50 p-3 space-y-2">
          <p className="text-[11px] font-medium text-foreground">
            Nova cadeia (UUIDs de propostas, vírgula ou linha)
          </p>
          <input
            className="w-full rounded-md border border-border bg-background text-xs px-2 py-1.5 font-mono"
            placeholder="Título do fluxo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full min-h-[72px] rounded-md border border-border bg-background text-[11px] px-2 py-1.5 font-mono"
            placeholder="uuid-proposta-1, uuid-proposta-2"
            value={idsText}
            onChange={(e) => setIdsText(e.target.value)}
          />
          {proposalsQ.data && proposalsQ.data.length > 0 ? (
            <p className="text-[10px] text-muted-foreground">
              Dica: propostas aprovadas recentes —{" "}
              {proposalsQ.data
                .filter((p) => p.effectiveState === "approved")
                .slice(0, 4)
                .map((p) => p.id.slice(0, 8))
                .join(" · ")}
            </p>
          ) : null}
          <button
            type="button"
            disabled={m.createOrch.isPending}
            className="text-xs rounded-md bg-primary text-primary-foreground px-3 py-1.5 disabled:opacity-50"
            onClick={() => {
              const raw = idsText.split(/[\s,;]+/).filter(Boolean);
              const proposalIds = raw.map((x) => x.trim()).filter(Boolean);
              void m.createOrch
                .mutateAsync({ title, proposalIds })
                .then((o) => setSelectedId(o.id));
            }}
          >
            {m.createOrch.isPending ? "Criando…" : "Criar orquestração"}
          </button>
          {m.createOrch.isError ? (
            <p className="text-[11px] text-destructive">
              {describeError(m.createOrch.error).message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col gap-1 text-[10px] text-muted-foreground uppercase tracking-wide min-w-[200px] flex-1">
            Fluxo existente
            <select
              className="rounded-md border border-border bg-background text-xs px-2 py-1.5 font-normal normal-case"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value || null)}
            >
              <option value="">Selecione…</option>
              {list.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title.slice(0, 48)} · {o.state}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!selectedId ? (
          <EmptyState
            title="Nenhum fluxo selecionado"
            description="Crie uma orquestração ou selecione uma existente para ver painel, grafo e timeline."
          />
        ) : detailQ.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando detalhe…</p>
        ) : detailQ.isError ? (
          <ErrorState message={describeError(detailQ.error).message} />
        ) : orch ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    stateBadge(orch.state).className,
                  )}
                >
                  {stateBadge(orch.state).label}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                  {orch.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                <ListOrdered className="h-3.5 w-3.5" />
                Progresso {progress.done}/{progress.total} ({progress.pct}%)
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary/80 transition-[width]"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            {orch.blockedReason ? (
              <p className="text-[11px] text-destructive border border-destructive/25 rounded-md px-2 py-1.5 bg-destructive/5">
                {orch.blockedReason}
              </p>
            ) : null}

            <div className="grid lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/70 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  Grafo de dependências
                </div>
                <ul className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {orch.steps.map((s) => (
                    <li
                      key={s.id}
                      className="text-[11px] rounded-md border border-border/60 bg-background/60 px-2 py-1.5 flex flex-col gap-0.5"
                    >
                      <div className="flex flex-wrap justify-between gap-1">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{s.ordinal}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {stepKindLabel(s.stepKind)}
                        </span>
                        <span className="text-[10px] font-medium">{s.stepState}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1 items-center">
                        <Layers className="h-3 w-3 shrink-0" />
                        deps: {s.dependsOnOrdinals.length ? s.dependsOnOrdinals.join(", ") : "—"}
                        <ArrowDown className="h-3 w-3 opacity-40" />
                        proposta {s.proposalId.slice(0, 8)}…
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border/70 p-3 space-y-2 flex flex-col min-h-[220px]">
                <div className="text-[11px] font-semibold text-foreground">
                  Timeline / narrativa
                </div>
                <ul className="space-y-1.5 flex-1 overflow-y-auto max-h-[220px] pr-1">
                  {narrativeRows.slice(-14).map((n, i: number) => (
                    <li
                      key={`${n.at}-${i}`}
                      className="text-[10px] text-muted-foreground border-b border-border/40 pb-1.5 last:border-0"
                    >
                      <span className="text-[9px] tabular-nums block opacity-80">
                        {new Date(n.at).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-foreground/90">{n.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-foreground">
                Preview rollback em cadeia
              </div>
              {rollbackItems.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  Gere o preview após execuções concluídas (estado executed).
                </p>
              ) : (
                <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1">
                  {rollbackItems.map((it) => (
                    <li key={it.mutationExecutionId}>
                      Passo {it.stepOrdinal} · exec {it.mutationExecutionId.slice(0, 8)}…
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs rounded-md border border-border px-2 py-1.5 hover:bg-muted/60 disabled:opacity-50"
                disabled={m.submit.isPending || orch.state !== "planned"}
                onClick={() => void m.submit.mutateAsync(orch.id)}
              >
                Submeter aprovação
              </button>
              <button
                type="button"
                className="text-xs rounded-md border border-border px-2 py-1.5 hover:bg-muted/60 disabled:opacity-50"
                disabled={m.approve.isPending || orch.state !== "awaiting_approval"}
                onClick={() => void m.approve.mutateAsync({ orchestrationId: orch.id })}
              >
                Aprovar fluxo
              </button>
              <button
                type="button"
                className="text-xs rounded-md border border-border px-2 py-1.5 hover:bg-muted/60 disabled:opacity-50"
                disabled={
                  m.advanceGate.isPending ||
                  (orch.state !== "orchestrating" && orch.state !== "partially_executed")
                }
                onClick={() => void m.advanceGate.mutateAsync(orch.id)}
              >
                Validar portão
              </button>
              <button
                type="button"
                className="text-xs rounded-md border border-border px-2 py-1.5 hover:bg-muted/60 disabled:opacity-50"
                disabled={
                  m.runSandbox.isPending ||
                  (orch.state !== "orchestrating" && orch.state !== "partially_executed")
                }
                onClick={() => void m.runSandbox.mutateAsync(orch.id)}
              >
                Próxima simulação
              </button>
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={execConfirm}
                  onChange={(e) => setExecConfirm(e.target.checked)}
                />
                Confirmo execução
              </label>
              <input
                className="text-xs rounded-md border border-border px-2 py-1.5 font-mono w-[200px]"
                placeholder="idempotency key (opcional)"
                value={idem}
                onChange={(e) => setIdem(e.target.value)}
              />
              <button
                type="button"
                className="text-xs rounded-md bg-primary text-primary-foreground px-2 py-1.5 disabled:opacity-50"
                disabled={
                  m.executeMutation.isPending ||
                  !execConfirm ||
                  (orch.state !== "orchestrating" && orch.state !== "partially_executed")
                }
                onClick={() =>
                  void m.executeMutation.mutateAsync({
                    orchestrationId: orch.id,
                    approvalConfirmed: true,
                    idempotencyKey: idem.trim() || `orch-exec-${orch.id}-${Date.now()}`,
                  })
                }
              >
                Próxima execução
              </button>
              <button
                type="button"
                className="text-xs rounded-md border border-border px-2 py-1.5 hover:bg-muted/60 disabled:opacity-50"
                disabled={m.previewRollback.isPending}
                onClick={() => void m.previewRollback.mutateAsync(orch.id)}
              >
                Atualizar preview rollback
              </button>
              <button
                type="button"
                className="text-xs rounded-md border border-destructive/40 text-destructive px-2 py-1.5 hover:bg-destructive/10 disabled:opacity-50"
                disabled={m.rollbackNext.isPending}
                onClick={() => void m.rollbackNext.mutateAsync(orch.id)}
              >
                Rollback próximo na cadeia
              </button>
            </div>
            {[
              m.submit,
              m.approve,
              m.advanceGate,
              m.runSandbox,
              m.executeMutation,
              m.previewRollback,
              m.rollbackNext,
            ].some((x) => x.isError) ? (
              <p className="text-[11px] text-destructive">
                {[
                  m.submit.error,
                  m.approve.error,
                  m.advanceGate.error,
                  m.runSandbox.error,
                  m.executeMutation.error,
                  m.previewRollback.error,
                  m.rollbackNext.error,
                ]
                  .filter(Boolean)
                  .map((e) => describeError(e).message)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
