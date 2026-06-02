/**
 * Painel de propostas de ação operacional supervisionadas (governança humana, sem execução).
 */
import { useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import {
  OperationalSandboxPreview,
  OperationalSandboxRunButton,
} from "@/components/operational/operational-sandbox-preview";
import { OperationalSupervisedExecutionPanel } from "@/components/operational/operational-supervised-execution-panel";
import {
  useOperationalActionProposalMutations,
  useOperationalActionProposalsQuery,
} from "@/hooks/use-operational-action-proposals";
import { useOperationalSandboxMutation } from "@/hooks/use-operational-execution-sandbox";
import { useToast } from "@/hooks/use-toast";
import type { OperationalActionKind, OperationalActionProposalState } from "@/lib/database.types";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import type { OperationalSimulationResult } from "@/lib/operations/execution-sandbox";
import { describeError, isOperationalError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<OperationalActionKind, string> = {
  staffing_adjustment: "Ajuste de escala",
  escalation: "Escalação",
  mitigation: "Mitigação",
  coordination: "Coordenação",
  operational_review: "Revisão operacional",
  assignment_suggestion: "Sugestão de atribuição",
};

const STATE_LABEL: Record<OperationalActionProposalState, string> = {
  draft: "Rascunho",
  suggested: "Sugerida (IA)",
  awaiting_confirmation: "Aguardando confirmação",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
};

function stateBadgeClass(s: OperationalActionProposalState): string {
  if (s === "approved")
    return "bg-[color:var(--success)]/12 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25";
  if (s === "rejected" || s === "expired")
    return "bg-muted/80 text-muted-foreground ring-1 ring-border/80";
  if (s === "awaiting_confirmation")
    return "bg-primary/12 text-primary ring-1 ring-primary/25 font-semibold";
  if (s === "suggested")
    return "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20";
  return "bg-muted/60 text-muted-foreground ring-1 ring-border/70";
}

function ProposalStatusBadge(props: { state: OperationalActionProposalState }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
        stateBadgeClass(props.state),
      )}
    >
      {STATE_LABEL[props.state]}
    </span>
  );
}

function ProposalCard(props: {
  proposal: OperationalActionProposalDto;
  mutations: ReturnType<typeof useOperationalActionProposalMutations>;
}) {
  const { proposal: p, mutations } = props;
  const toast = useToast();
  const [openRationale, setOpenRationale] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [sandboxResult, setSandboxResult] = useState<OperationalSimulationResult | null>(null);
  const sandboxMutation = useOperationalSandboxMutation();

  const eff = p.effectiveState;
  const busy =
    mutations.submitForConfirmation.isPending ||
    mutations.approve.isPending ||
    mutations.reject.isPending;

  const canSubmit = eff === "suggested" || eff === "draft";
  const canDecide = eff === "awaiting_confirmation";
  const canRejectFromSuggested = eff === "suggested";

  const onErr = useCallback(
    (err: unknown, title: string) => {
      const msg = isOperationalError(err) ? err.message : describeError(err).message;
      toast.warning(title, msg);
    },
    [toast],
  );

  const submit = useCallback(async () => {
    try {
      await mutations.submitForConfirmation.mutateAsync(p.id);
      toast.success("Proposta", "Enviada para confirmação do coordenador.");
    } catch (e) {
      onErr(e, "Proposta");
    }
  }, [mutations.submitForConfirmation, onErr, p.id, toast]);

  const approve = useCallback(async () => {
    try {
      await mutations.approve.mutateAsync({
        proposalId: p.id,
        note: approveNote.trim() || null,
      });
      toast.success("Proposta", "Aprovada (registro apenas — sem execução automática).");
      setApproveNote("");
    } catch (e) {
      onErr(e, "Aprovação");
    }
  }, [approveNote, mutations.approve, onErr, p.id, toast]);

  const reject = useCallback(async () => {
    try {
      await mutations.reject.mutateAsync({ proposalId: p.id, justification: rejectText });
      toast.success("Proposta", "Rejeição registrada.");
      setRejectOpen(false);
      setRejectText("");
    } catch (e) {
      onErr(e, "Rejeição");
    }
  }, [mutations.reject, onErr, p.id, rejectText, toast]);

  const rejectFromSuggested = useCallback(async () => {
    if (!rejectText.trim() || rejectText.trim().length < 8) {
      toast.warning("Rejeição", "Justificativa com ao menos 8 caracteres.");
      return;
    }
    try {
      await mutations.reject.mutateAsync({ proposalId: p.id, justification: rejectText });
      toast.success("Proposta", "Sugestão rejeitada.");
      setRejectOpen(false);
      setRejectText("");
    } catch (e) {
      onErr(e, "Rejeição");
    }
  }, [mutations.reject, onErr, p.id, rejectText, toast]);

  const sourceLabel = p.source === "gpt_tool" ? "IA (tool supervisionada)" : "Manual";

  const canSimulate = eff !== "rejected" && eff !== "expired";
  const runSandbox = useCallback(async () => {
    try {
      const result = await sandboxMutation.mutateAsync({ proposalId: p.id });
      setSandboxResult(result);
      toast.success(
        "Sandbox",
        result.state === "blocked"
          ? "Simulação bloqueada pelo motor de safety."
          : `Simulação ${result.state.toUpperCase()} — nenhum dado real foi alterado.`,
      );
    } catch (e) {
      onErr(e, "Sandbox");
    }
  }, [onErr, p.id, sandboxMutation, toast]);

  return (
    <li className="border-b border-border last:border-b-0 px-4 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{p.id.slice(0, 8)}…</span>
            <ProposalStatusBadge state={eff} />
            {p.storedState !== eff ? (
              <span className="text-[10px] text-muted-foreground">
                (persistido: {STATE_LABEL[p.storedState]})
              </span>
            ) : null}
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{p.title}</h3>
          <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
            <span>{KIND_LABEL[p.actionKind]}</span>
            <span>·</span>
            <span>{sourceLabel}</span>
            {p.gptCorrelationId ? (
              <>
                <span>·</span>
                <span className="font-mono truncate max-w-[12rem]" title={p.gptCorrelationId}>
                  correlação {p.gptCorrelationId.slice(0, 8)}…
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border/80 bg-muted/15 p-3">
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          Resumo (IA / coordenação)
        </p>
        <p className="mt-1.5 text-sm text-foreground leading-relaxed">{p.summary}</p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOpenRationale((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {openRationale ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Painel de rationale e proveniência
        </button>
        {openRationale ? (
          <div className="mt-2 space-y-2 rounded-md border border-dashed border-border bg-background/60 p-3">
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {p.operationalRationale}
            </p>
            {p.references.length > 0 ? (
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                {p.references.map((r, i) => (
                  <li key={`${r.ref}-${i}`}>
                    <span className="font-mono text-foreground/90">{r.kind}</span>: {r.ref}
                    {r.note ? (
                      <span className="block pl-0 text-muted-foreground/90">{r.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground">Sem referências estruturadas.</p>
            )}
          </div>
        ) : null}
      </div>

      {canSimulate ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-[10px] text-muted-foreground">
            Sandbox · dry-run, sem mutação real. Pré-visualize impacto antes de qualquer decisão.
          </p>
          <OperationalSandboxRunButton
            isPending={sandboxMutation.isPending}
            disabled={busy}
            onClick={() => void runSandbox()}
            label={sandboxResult ? "Re-executar simulação" : "Executar simulação (dry-run)"}
          />
        </div>
      ) : null}

      {sandboxResult ? <OperationalSandboxPreview result={sandboxResult} /> : null}

      {eff === "approved" && sandboxResult?.state === "safe" ? (
        <OperationalSupervisedExecutionPanel
          proposalId={p.id}
          sandboxResult={sandboxResult}
          disabled={busy}
        />
      ) : null}

      {eff === "approved" && p.approvalNote ? (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Nota de aprovação:</span> {p.approvalNote}
        </p>
      ) : null}
      {eff === "rejected" && p.rejectionJustification ? (
        <p className="text-[11px] text-destructive/90">
          <span className="font-medium">Justificativa:</span> {p.rejectionJustification}
        </p>
      ) : null}

      {canSubmit ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {mutations.submitForConfirmation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
            Submeter para confirmação
          </button>
          {canRejectFromSuggested ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejectOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent/50 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeitar sugestão
            </button>
          ) : null}
        </div>
      ) : null}

      {rejectOpen && (canRejectFromSuggested || canDecide) ? (
        <div className="rounded-md border border-destructive/25 bg-destructive/[0.04] p-3 space-y-2">
          <label className="text-[11px] font-medium text-foreground" htmlFor={`rej-${p.id}`}>
            Justificativa obrigatória
          </label>
          <textarea
            id={`rej-${p.id}`}
            rows={3}
            value={rejectText}
            onChange={(e) => setRejectText(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Explique o motivo da rejeição (mín. 8 caracteres)."
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void (canDecide ? reject() : rejectFromSuggested())}
            className="inline-flex items-center gap-1 rounded-md bg-destructive/90 px-2.5 py-1.5 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive disabled:opacity-50"
          >
            {mutations.reject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Confirmar rejeição
          </button>
        </div>
      ) : null}

      {canDecide ? (
        <div className="flex flex-col gap-2 pt-1 border-t border-border/80">
          <p className="text-[11px] font-medium text-muted-foreground">Fluxo do coordenador</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void approve()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--success)] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {mutations.approve.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Aprovar registro
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setRejectOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 text-[11px] font-semibold hover:bg-destructive/10 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeitar
            </button>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground" htmlFor={`apnote-${p.id}`}>
              Nota opcional de aprovação
            </label>
            <input
              id={`apnote-${p.id}`}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
              maxLength={800}
              placeholder="Contexto adicional para auditoria"
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function OperationalActionProposalsPanel(props: {
  enabled: boolean;
  isFetchingCc: boolean;
  className?: string;
}) {
  const q = useOperationalActionProposalsQuery({ enabled: props.enabled });
  const mutations = useOperationalActionProposalMutations();

  const items = useMemo(() => q.data ?? [], [q.data]);

  if (!props.enabled) return null;

  return (
    <section
      id="ops-anchor-action-proposals"
      className={cn("scroll-mt-24", props.className)}
      aria-label="Propostas de ação operacional supervisionadas"
    >
      <OperationalLiveChrome
        isFetching={props.isFetchingCc || q.isFetching}
        className="p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Propostas operacionais (IA supervisionada)
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Governança humana · sem execução automática · auditável
              </p>
            </div>
          </div>
        </div>

        {q.isError ? (
          <p className="px-4 py-3 text-xs text-destructive">{describeError(q.error).message}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Nenhuma proposta registrada. Use o copiloto GPT com a tool{" "}
            <code className="text-[11px] font-mono bg-muted px-1 rounded">
              submit_operational_action_proposal
            </code>{" "}
            após consultar evidências (scores, forecast, alertas, timeline).
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((p) => (
              <ProposalCard key={p.id} proposal={p} mutations={mutations} />
            ))}
          </ul>
        )}

        <p className="px-4 py-3 text-[10px] text-muted-foreground border-t border-border leading-relaxed">
          Aprovação formaliza governança. Com sandbox <strong>safe</strong> persistido, a execução
          supervisionada aplica mutações reais com idempotência, lock por proposta e rollback
          compensatório (atribuições pendentes + marcos na timeline).
        </p>
      </OperationalLiveChrome>
    </section>
  );
}
