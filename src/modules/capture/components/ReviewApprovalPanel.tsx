import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewApprovalStatus, ReviewWorkspaceMetadata } from "@/lib/capture/review";
import { REVIEW_APPROVAL_LABELS } from "@/lib/capture/review/review-workspace-service";
import {
  evaluateApprovalGate,
  MIN_BLOCKING_OVERRIDE_JUSTIFICATION,
  type BlockingFinding,
} from "@/lib/capture/review/approval-gate";

const STATUS_OPTIONS: Array<{
  status: ReviewApprovalStatus;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  variant: "default" | "outline" | "destructive" | "secondary";
}> = [
  {
    status: "em_revisao",
    label: REVIEW_APPROVAL_LABELS.em_revisao,
    description: "Guia em análise — pipeline concluído, aguardando decisão do revisor.",
    icon: Clock,
    variant: "secondary",
  },
  {
    status: "aguardando_correcoes",
    label: REVIEW_APPROVAL_LABELS.aguardando_correcoes,
    description: "Correções pendentes antes de aprovação final.",
    icon: AlertTriangle,
    variant: "outline",
  },
  {
    status: "aprovada",
    label: REVIEW_APPROVAL_LABELS.aprovada,
    description: "Guia aprovada para submissão — decisão persistida.",
    icon: CheckCircle2,
    variant: "default",
  },
  {
    status: "reprovada",
    label: REVIEW_APPROVAL_LABELS.reprovada,
    description: "Guia reprovada — requer retrabalho.",
    icon: XCircle,
    variant: "destructive",
  },
];

type ReviewApprovalPanelProps = {
  review: ReviewWorkspaceMetadata;
  /** Achados bloqueantes em aberto (auditoria + cláusula de contrato) — ver approval-gate. */
  blockingFindings?: BlockingFinding[];
  busy: boolean;
  onSubmit: (status: ReviewApprovalStatus, note?: string) => Promise<void>;
};

export function ReviewApprovalPanel({
  review,
  blockingFindings = [],
  busy,
  onSubmit,
}: ReviewApprovalPanelProps) {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<ReviewApprovalStatus>(review.approvalStatus);
  const gate = evaluateApprovalGate(selected, blockingFindings, note);
  const overriding = selected === "aprovada" && blockingFindings.length > 0;

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Aprovação Final</h2>
        <p className="text-xs text-muted-foreground">
          Registre a decisão de revisão. Nenhuma automação é disparada nesta sprint.
        </p>
      </div>

      {blockingFindings.length > 0 ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm"
          data-testid="approval-blocking-findings"
        >
          <p className="flex items-center gap-1.5 font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {blockingFindings.length} achado(s) bloqueante(s) em aberto
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {blockingFindings.map((b) => (
              <li key={b.key}>
                <span className="font-mono">{b.ruleId}</span>{" "}
                <span className="text-muted-foreground">
                  ({b.source === "contrato" ? "contrato" : "auditoria"} · {b.field})
                </span>{" "}
                — {b.message}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Corrija a guia, ou aprove mesmo assim com justificativa registrada (mínimo{" "}
            {MIN_BLOCKING_OVERRIDE_JUSTIFICATION} caracteres).
          </p>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isCurrent = review.approvalStatus === opt.status;
          const isSelected = selected === opt.status;
          return (
            <button
              key={opt.status}
              type="button"
              disabled={busy}
              onClick={() => setSelected(opt.status)}
              className={`rounded-md border p-3 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{opt.label}</span>
                {isCurrent ? (
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-primary">
                    Atual
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="review-note" className="text-xs font-medium text-muted-foreground">
          {overriding ? "Justificativa da aprovação com pendência bloqueante (obrigatória)" : "Observação (opcional)"}
        </label>
        <textarea
          id="review-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Justificativa da decisão…"
        />
      </div>

      <Button
        type="button"
        disabled={busy || selected === review.approvalStatus || !gate.allowed}
        onClick={() => void onSubmit(selected, note.trim() || undefined)}
      >
        {busy ? "Salvando…" : "Persistir decisão"}
      </Button>

      {review.decisions.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico de decisões
          </h3>
          <ul className="space-y-2">
            {[...review.decisions].reverse().map((d, i) => (
              <li key={`${d.at}-${i}`} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{REVIEW_APPROVAL_LABELS[d.status]}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(d.at).toLocaleString("pt-BR")}
                  </time>
                </div>
                {d.note ? <p className="mt-1 text-xs text-muted-foreground">{d.note}</p> : null}
                {d.overriddenBlockingFindings?.length ? (
                  <p className="mt-1 text-xs text-destructive">
                    Aprovada sobre pendência bloqueante: {d.overriddenBlockingFindings.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
