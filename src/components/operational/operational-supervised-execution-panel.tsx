/**
 * Painel compacto: execução supervisionada pós-sandbox seguro (governança + rollback manual).
 */
import { useCallback, useMemo, useState } from "react";
import { History, Loader2, Play, RotateCcw, ShieldCheck } from "lucide-react";
import {
  useOperationalMutationExecutionMutations,
  useOperationalMutationExecutionsQuery,
} from "@/hooks/use-operational-mutation-execution";
import { useToast } from "@/hooks/use-toast";
import type { OperationalMutationExecutionState } from "@/lib/database.types";
import type { OperationalSimulationResult } from "@/lib/operations/execution-sandbox";
import { describeError, isOperationalError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function executionBadgeClass(s: OperationalMutationExecutionState): string {
  if (s === "executed")
    return "bg-[color:var(--success)]/12 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25";
  if (s === "rolled_back")
    return "bg-amber-500/12 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/20";
  if (s === "failed" || s === "blocked")
    return "bg-destructive/12 text-destructive ring-1 ring-destructive/20";
  if (s === "executing" || s === "queued")
    return "bg-primary/12 text-primary ring-1 ring-primary/25";
  return "bg-muted/60 text-muted-foreground ring-1 ring-border/70";
}

const EXEC_LABEL: Record<OperationalMutationExecutionState, string> = {
  queued: "Na fila",
  executing: "Executando",
  executed: "Executada",
  rolled_back: "Revertida",
  failed: "Falhou",
  blocked: "Bloqueada",
};

export function OperationalSupervisedExecutionPanel(props: {
  proposalId: string;
  sandboxResult: OperationalSimulationResult;
  disabled?: boolean;
}) {
  const toast = useToast();
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const execQ = useOperationalMutationExecutionsQuery({
    proposalId: props.proposalId,
    enabled: true,
  });
  const mutations = useOperationalMutationExecutionMutations(props.proposalId);

  const sandboxRunId = props.sandboxResult.sandboxRunId ?? null;
  const canExecute =
    props.sandboxResult.state === "safe" && !!sandboxRunId && approvalConfirmed && !props.disabled;

  const onErr = useCallback(
    (err: unknown, title: string) => {
      const msg = isOperationalError(err) ? err.message : describeError(err).message;
      toast.warning(title, msg);
    },
    [toast],
  );

  const runExecute = useCallback(async () => {
    if (!sandboxRunId) {
      toast.warning("Execução", "Reexecute o sandbox para obter o ID de simulação persistido.");
      return;
    }
    try {
      const res = await mutations.execute.mutateAsync({
        sandboxRunId,
        approvalConfirmed: true,
      });
      toast.success(
        "Execução supervisionada",
        res.idempotentReplay
          ? "Replay idempotente — mesma chave já havia sido processada."
          : "Mutações aplicadas com trilha de auditoria.",
      );
      setApprovalConfirmed(false);
    } catch (e) {
      onErr(e, "Execução");
    }
  }, [mutations.execute, onErr, sandboxRunId, toast]);

  const latest = execQ.data?.[0] ?? null;
  const progressLabel = useMemo(() => {
    if (mutations.execute.isPending) return "Aplicando mutações…";
    if (mutations.rollback.isPending) return "Revertendo…";
    return null;
  }, [mutations.execute.isPending, mutations.rollback.isPending]);

  return (
    <div className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.04] p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          Execução supervisionada (mutações reais)
        </p>
        {latest ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
              executionBadgeClass(latest.state),
            )}
          >
            {EXEC_LABEL[latest.state]}
          </span>
        ) : null}
      </div>

      {!sandboxRunId ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Execute novamente o sandbox para gravar o run no banco — o ID é necessário para
          correlacionar a execução supervisionada à simulação auditada.
        </p>
      ) : (
        <p className="text-[10px] font-mono text-muted-foreground">
          sandbox_run_id · {sandboxRunId}
        </p>
      )}

      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="mt-0.5 h-3.5 w-3.5 rounded border-input"
          checked={approvalConfirmed}
          disabled={!!props.disabled}
          onChange={(e) => setApprovalConfirmed(e.target.checked)}
        />
        <span className="text-[11px] text-foreground leading-snug">
          Confirmo que revisitei o sandbox <strong>safe</strong>, os policy checks e desejo aplicar
          as mutações reais desta proposta de forma auditável.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canExecute || mutations.execute.isPending}
          onClick={() => void runExecute()}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600/90 disabled:opacity-50"
        >
          {mutations.execute.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Executar mutações
        </button>
        {progressLabel ? (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {progressLabel}
          </span>
        ) : null}
      </div>

      <div className="border-t border-border/60 pt-2 space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
          <History className="h-3 w-3" />
          Histórico de execuções
        </p>
        {execQ.isLoading ? (
          <p className="text-[10px] text-muted-foreground">Carregando…</p>
        ) : execQ.isError ? (
          <p className="text-[10px] text-destructive">{describeError(execQ.error).message}</p>
        ) : !execQ.data?.length ? (
          <p className="text-[10px] text-muted-foreground">Nenhuma execução registrada ainda.</p>
        ) : (
          <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {execQ.data.map((ex) => (
              <li
                key={ex.id}
                className="rounded border border-border/70 bg-background/50 px-2 py-1.5 text-[10px] flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="font-mono text-muted-foreground">{ex.id.slice(0, 8)}…</span>
                  <span
                    className={cn(
                      "ml-2 inline-flex rounded-full px-1.5 py-0.5 uppercase tracking-wide",
                      executionBadgeClass(ex.state),
                    )}
                  >
                    {EXEC_LABEL[ex.state]}
                  </span>
                  {ex.appliedStepsJson.length > 0 ? (
                    <p className="text-muted-foreground">
                      {ex.appliedStepsJson.length} passo(s) aplicado(s)
                    </p>
                  ) : null}
                  {ex.blockReason ? (
                    <p className="text-destructive/90 line-clamp-2" title={ex.blockReason}>
                      {ex.blockReason}
                    </p>
                  ) : null}
                </div>
                {ex.state === "executed" ? (
                  <button
                    type="button"
                    disabled={mutations.rollback.isPending || !!props.disabled}
                    onClick={() => {
                      void (async () => {
                        try {
                          await mutations.rollback.mutateAsync(ex.id);
                          toast.success("Rollback", "Compensação aplicada onde permitido.");
                        } catch (e) {
                          onErr(e, "Rollback");
                        }
                      })();
                    }}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium hover:bg-accent/50 disabled:opacity-50 shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Rollback
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
