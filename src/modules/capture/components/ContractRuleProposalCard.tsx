import { useState } from "react";
import { CheckCircle2, Pencil, Quote, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContractRuleProposalView } from "@/lib/capture/contract/review/contract-rule-review-service";
import type { ContractRuleCategory } from "@/lib/capture/contract/types/contract-rule-proposal";

const CATEGORY_LABELS: Record<ContractRuleCategory, string> = {
  cobertura: "Cobertura",
  preco: "Preço",
  pre_autorizacao: "Pré-autorização",
  prazo: "Prazo",
  campo_obrigatorio: "Campo obrigatório",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  edited: "border-sky-300 bg-sky-50 text-sky-800",
  rejected: "border-rose-300 bg-rose-50 text-rose-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  edited: "Aprovada (editada)",
  rejected: "Rejeitada",
};

type Props = {
  proposal: ContractRuleProposalView;
  busy: boolean;
  onReview: (input: {
    proposalId: string;
    decision: "approved" | "rejected" | "edited";
    reviewNotes?: string;
    editedDescription?: string;
    editedJustification?: string;
  }) => Promise<void>;
};

export function ContractRuleProposalCard({ proposal, busy, onReview }: Props) {
  const [mode, setMode] = useState<"idle" | "editing">("idle");
  const [notes, setNotes] = useState("");
  const [editedDescription, setEditedDescription] = useState(proposal.description);
  const [editedJustification, setEditedJustification] = useState(proposal.justification);

  const isPending = proposal.status === "pending";

  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
            {CATEGORY_LABELS[proposal.category]}
          </span>
          <span className="text-xs text-muted-foreground">
            confiança do modelo: {Math.round(proposal.confidence)}%
          </span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            STATUS_STYLES[proposal.status] ?? "border-border bg-muted/50 text-muted-foreground"
          }`}
        >
          {STATUS_LABELS[proposal.status] ?? proposal.status}
        </span>
      </div>

      {mode === "editing" ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`desc-${proposal.id}`}>
            Descrição da regra
          </label>
          <textarea
            id={`desc-${proposal.id}`}
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`just-${proposal.id}`}>
            Justificativa
          </label>
          <textarea
            id={`just-${proposal.id}`}
            value={editedJustification}
            onChange={(e) => setEditedJustification(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium">{proposal.editedDescription ?? proposal.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {proposal.editedJustification ?? proposal.justification}
          </p>
        </div>
      )}

      <blockquote className="flex items-start gap-2 rounded-md border-l-2 border-primary/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Quote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          {proposal.citationHeading ? <span className="font-medium">{proposal.citationHeading}: </span> : null}
          &ldquo;{proposal.citationExcerpt}&rdquo;
        </span>
      </blockquote>

      {isPending ? (
        <div className="space-y-2 pt-1">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Observação da revisão (opcional)…"
            className="w-full rounded-md border bg-background px-3 py-2 text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void onReview({
                  proposalId: proposal.id,
                  decision: mode === "editing" ? "edited" : "approved",
                  reviewNotes: notes.trim() || undefined,
                  editedDescription: mode === "editing" ? editedDescription : undefined,
                  editedJustification: mode === "editing" ? editedJustification : undefined,
                })
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              {mode === "editing" ? "Aprovar edição" : "Aprovar"}
            </Button>
            {mode === "idle" ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode("editing")}>
                <Pencil className="h-4 w-4" />
                Editar antes de aprovar
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode("idle")}>
                Cancelar edição
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void onReview({
                  proposalId: proposal.id,
                  decision: "rejected",
                  reviewNotes: notes.trim() || undefined,
                })
              }
            >
              <XCircle className="h-4 w-4" />
              Rejeitar
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleString("pt-BR") : null}
          {proposal.reviewNotes ? <p className="mt-1">{proposal.reviewNotes}</p> : null}
        </div>
      )}
    </article>
  );
}
