import { useCallback, useMemo, useState } from "react";
import { Check, FileJson, Pencil, Sparkles, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CorrectionProposal,
  CorrectionProposalStore,
  CorrectionProposalSummaryMeta,
} from "@/lib/capture/correction";
import type { AuditReport } from "@/lib/capture/audit";
import type { CapturePhase } from "../types";
import { decideCaptureCorrectionProposal } from "../services/correction-client";

const STATUS_LABELS: Record<CorrectionProposal["status"], string> = {
  pending: "Pendente",
  accepted: "Aceita",
  edited: "Editada",
  rejected: "Rejeitada",
  applied: "Aplicada",
};

const STATUS_STYLES: Record<CorrectionProposal["status"], string> = {
  pending: "bg-muted text-muted-foreground border-border",
  accepted: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  edited: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  applied: "bg-primary/15 text-primary border-primary/30",
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.75) return "Alta";
  if (confidence >= 0.5) return "Média";
  return "Baixa";
}

function confidenceStyle(confidence: number): string {
  if (confidence >= 0.75) return "text-green-600 dark:text-green-400";
  if (confidence >= 0.5) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
}

export function CaptureCorrectionPanel({
  sessionId,
  phase,
  summary,
  store,
  auditReport,
  onDownloadJson,
  onStoreUpdated,
  onError,
  busy,
}: {
  sessionId: string;
  phase: CapturePhase;
  summary: CorrectionProposalSummaryMeta | null;
  store: CorrectionProposalStore | null;
  auditReport: AuditReport | null;
  onDownloadJson?: () => void;
  onStoreUpdated: (store: CorrectionProposalStore) => void;
  onError: (message: string) => void;
  busy?: boolean;
}) {
  const [actingId, setActingId] = useState<string | null>(null);

  const showPanel =
    phase === "auditing" ||
    phase === "completed" ||
    summary != null ||
    store != null ||
    (auditReport != null && auditReport.findings.length > 0);

  const proposals = store?.proposals ?? [];
  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === "pending").length,
    [proposals],
  );

  const handleDecision = useCallback(
    async (proposalId: string, action: "accept" | "edit" | "reject", editedValue?: string) => {
      setActingId(proposalId);
      try {
        const updated = await decideCaptureCorrectionProposal(sessionId, {
          proposalId,
          action,
          editedValue,
        });
        onStoreUpdated(updated);
      } catch (err) {
        onError(err instanceof Error ? err.message : String(err));
      } finally {
        setActingId(null);
      }
    },
    [sessionId, onStoreUpdated, onError],
  );

  if (!showPanel) return null;

  const status = summary?.status ?? (store ? "completed" : "pending");

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Sugestões de Correção</h2>
        </div>
        {onDownloadJson && status === "completed" && store ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy}
            onClick={onDownloadJson}
          >
            <FileJson className="h-3.5 w-3.5" />
            Baixar correction_proposals.json
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Analise cada sugestão e decida: aceitar, editar ou rejeitar. Nenhuma correção é aplicada
        automaticamente na guia nesta versão.
      </p>

      {store ? (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <MetricCard label="Total" value={proposals.length} />
          <MetricCard label="Pendentes" value={pendingCount} />
          <MetricCard label="Aceitas" value={summary?.acceptedCount ?? 0} />
          <MetricCard
            label="Editadas / Rejeitadas"
            value={(summary?.editedCount ?? 0) + (summary?.rejectedCount ?? 0)}
          />
        </div>
      ) : null}

      {!store && auditReport && auditReport.findings.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Aguardando geração das propostas de correção…
        </p>
      ) : null}

      {summary?.error ? <p className="text-sm text-destructive">{summary.error}</p> : null}

      {proposals.length === 0 && store ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          Nenhuma proposta de correção — auditoria sem findings corrigíveis.
        </div>
      ) : null}

      {proposals.length > 0 ? (
        <ul className="space-y-3 max-h-[32rem] overflow-y-auto">
          {proposals.map((proposal) => (
            <ProposalRow
              key={proposal.proposalId}
              proposal={proposal}
              busy={actingId === proposal.proposalId}
              onAccept={() => void handleDecision(proposal.proposalId, "accept")}
              onReject={() => void handleDecision(proposal.proposalId, "reject")}
              onEdit={(value) => void handleDecision(proposal.proposalId, "edit", value)}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProposalRow({
  proposal,
  busy,
  onAccept,
  onReject,
  onEdit,
}: {
  proposal: CorrectionProposal;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(proposal.editedValue ?? proposal.suggestedValue ?? "");

  const isPending = proposal.status === "pending";
  const displayValue =
    proposal.status === "edited"
      ? proposal.editedValue
      : proposal.status === "accepted"
        ? proposal.suggestedValue
        : proposal.suggestedValue;

  return (
    <li
      className={`rounded-md border p-3 text-sm space-y-2 ${
        proposal.blocking ? "border-destructive/40 bg-destructive/5" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[proposal.status]}`}
        >
          {STATUS_LABELS[proposal.status]}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{proposal.ruleId}</span>
        <span className="text-xs text-muted-foreground">{proposal.source}</span>
        {proposal.blocking ? (
          <span className="inline-flex items-center gap-0.5 text-xs text-destructive font-medium">
            <XCircle className="h-3 w-3" />
            Bloqueante
          </span>
        ) : null}
        <span className={`text-xs font-medium ${confidenceStyle(proposal.confidence)}`}>
          Confiança {Math.round(proposal.confidence * 100)}% ({confidenceLabel(proposal.confidence)}
          )
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Campo: <code className="font-mono">{proposal.field}</code>
      </p>

      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div className="rounded border border-border/60 p-2">
          <p className="text-muted-foreground mb-0.5">Valor atual</p>
          <code className="font-mono break-all">
            {proposal.currentValue ?? <span className="italic text-muted-foreground">—</span>}
          </code>
        </div>
        <div className="rounded border border-primary/20 bg-primary/5 p-2">
          <p className="text-muted-foreground mb-0.5">Valor sugerido</p>
          <code className="font-mono break-all">
            {displayValue ?? <span className="italic text-muted-foreground">Revisão manual</span>}
          </code>
        </div>
      </div>

      <p className="text-xs">{proposal.justification}</p>

      {proposal.legalReference ? (
        <p className="text-xs text-muted-foreground">
          Referência normativa: {proposal.legalReference}
        </p>
      ) : null}

      {isPending ? (
        editing ? (
          <div className="flex flex-wrap items-end gap-2 pt-1">
            <label className="flex-1 min-w-[12rem] space-y-1">
              <span className="text-xs text-muted-foreground">Valor corrigido</span>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                disabled={busy}
              />
            </label>
            <Button
              type="button"
              size="sm"
              className="gap-1"
              disabled={busy || !editValue.trim()}
              onClick={() => {
                onEdit(editValue);
                setEditing(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Salvar edição
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="gap-1"
              disabled={busy}
              onClick={onAccept}
            >
              <Check className="h-3.5 w-3.5" />
              Aceitar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-destructive hover:text-destructive"
              disabled={busy}
              onClick={onReject}
            >
              <X className="h-3.5 w-3.5" />
              Rejeitar
            </Button>
          </div>
        )
      ) : proposal.decidedAt ? (
        <p className="text-xs text-muted-foreground">
          Decidido em {new Date(proposal.decidedAt).toLocaleString("pt-BR")}
        </p>
      ) : null}
    </li>
  );
}
