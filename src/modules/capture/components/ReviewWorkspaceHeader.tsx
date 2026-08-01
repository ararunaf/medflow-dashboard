import { CheckCircle2, ClipboardCheck, XCircle, Clock, AlertCircle } from "lucide-react";
import type { ReviewWorkspaceHeaderMetrics } from "@/lib/capture/review";
import { REVIEW_APPROVAL_LABELS } from "@/lib/capture/review/review-workspace-service";

const APPROVAL_STYLES = {
  em_revisao: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  aguardando_correcoes:
    "bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-500/20",
  aprovada: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  reprovada: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

const APPROVAL_ICONS = {
  em_revisao: Clock,
  aguardando_correcoes: AlertCircle,
  aprovada: CheckCircle2,
  reprovada: XCircle,
} as const;

type ReviewWorkspaceHeaderProps = {
  sessionId: string;
  filename: string | null;
  metrics: ReviewWorkspaceHeaderMetrics;
};

export function ReviewWorkspaceHeader({
  sessionId,
  filename,
  metrics,
}: ReviewWorkspaceHeaderProps) {
  const ApprovalIcon = APPROVAL_ICONS[metrics.approvalStatus];

  return (
    <header className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Workspace de Revisão</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground truncate max-w-xl">
            {filename ?? "Guia TISS"} · <span className="font-mono text-xs">{sessionId}</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${APPROVAL_STYLES[metrics.approvalStatus]}`}
        >
          <ApprovalIcon className="h-4 w-4" />
          {REVIEW_APPROVAL_LABELS[metrics.approvalStatus]}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricTile label="Progresso do pipeline" value={`${metrics.pipelineProgress}%`} />
        <MetricTile
          label="Score da guia"
          value={metrics.guideScore != null ? String(metrics.guideScore) : "—"}
        />
        <MetricTile label="Findings" value={String(metrics.findingsCount)} />
        <MetricTile
          label="Correções"
          value={`${metrics.correctionsCount}${metrics.pendingCorrections > 0 ? ` (${metrics.pendingCorrections} pendentes)` : ""}`}
        />
        <MetricTile label="Situação final" value={REVIEW_APPROVAL_LABELS[metrics.approvalStatus]} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Pipeline</span>
          <span>{metrics.pipelineProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${metrics.pipelineProgress}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {metrics.steps.map((step) => (
            <span
              key={step.id}
              className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                step.completed
                  ? "bg-primary/15 text-primary"
                  : step.active
                    ? "bg-muted text-foreground ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
