import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileJson,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AuditFinding,
  AuditReport,
  AuditReportSummaryMeta,
  AuditSeverity,
} from "@/lib/capture/audit";
import type { CapturePhase } from "../types";

const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  critico: "bg-destructive/15 text-destructive border-destructive/30",
  alto: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  medio: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-400 border-yellow-500/30",
  baixo: "bg-muted text-muted-foreground border-border",
};

type SeverityFilter = AuditSeverity | "all";

export function CaptureAuditPanel({
  phase,
  summary,
  report,
  onDownloadJson,
  busy,
}: {
  phase: CapturePhase;
  summary: AuditReportSummaryMeta | null;
  report: AuditReport | null;
  onDownloadJson?: () => void;
  busy?: boolean;
}) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const showPanel =
    phase === "parser_completed" ||
    phase === "auditing" ||
    phase === "completed" ||
    summary != null ||
    report != null;

  const filteredFindings = useMemo(() => {
    if (!report?.findings) return [];
    if (severityFilter === "all") return report.findings;
    return report.findings.filter((f) => f.severity === severityFilter);
  }, [report?.findings, severityFilter]);

  const blockingFields = useMemo(() => {
    if (!report?.findings) return new Set<string>();
    return new Set(report.findings.filter((f) => f.blocking).map((f) => f.field));
  }, [report?.findings]);

  if (!showPanel) return null;

  const status = summary?.status ?? (report ? "completed" : "pending");
  const score = report?.score.overall ?? summary?.score;
  const approved = report?.score.approved ?? summary?.approved;
  const blocking = report?.score.blocking ?? summary?.blocking;
  const criticalCount = report?.summary.criticalCount ?? summary?.criticalCount ?? 0;
  const highCount = report?.summary.highCount ?? summary?.highCount ?? 0;
  const mediumCount = report?.summary.mediumCount ?? summary?.mediumCount ?? 0;
  const lowCount = report?.summary.lowCount ?? summary?.lowCount ?? 0;
  const totalFindings = report?.summary.totalFindings ?? summary?.totalFindings ?? 0;

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Auditoria Preventiva</h2>
        </div>
        {onDownloadJson && status === "completed" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy}
            onClick={onDownloadJson}
          >
            <FileJson className="h-3.5 w-3.5" />
            Baixar audit_report.json
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <ScoreCard score={score} approved={approved} blocking={blocking} />
        <MetricCard label="Erros críticos" value={criticalCount} variant="critical" />
        <MetricCard label="Alertas (alto)" value={highCount} variant="warning" />
        <MetricCard label="Sugestões (médio/baixo)" value={mediumCount + lowCount} />
      </div>

      {report ? (
        <div className="flex flex-wrap gap-2">
          {(["all", "critico", "alto", "medio", "baixo"] as SeverityFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverityFilter(s)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                severityFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "all" ? "Todos" : SEVERITY_LABELS[s]}
              {s !== "all" && report.score.distribution[s] > 0
                ? ` (${report.score.distribution[s]})`
                : ""}
            </button>
          ))}
        </div>
      ) : null}

      {!report && phase === "parser_completed" && status === "pending" ? (
        <p className="text-xs text-muted-foreground">Aguardando auditoria preventiva…</p>
      ) : null}

      {summary?.error ? (
        <p className="text-sm text-destructive">{summary.error}</p>
      ) : null}

      {report && filteredFindings.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Nenhum finding neste filtro — {totalFindings === 0 ? "guia aprovada." : "todos filtrados."}
        </div>
      ) : null}

      {filteredFindings.length > 0 ? (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {filteredFindings.map((finding) => (
            <FindingRow
              key={`${finding.ruleId}-${finding.field}`}
              finding={finding}
              isBlockingField={blockingFields.has(finding.field)}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ScoreCard({
  score,
  approved,
  blocking,
}: {
  score?: number;
  approved?: boolean;
  blocking?: boolean;
}) {
  const display = score != null ? `${score}/100` : "—";
  const Icon = blocking ? XCircle : approved ? ShieldCheck : AlertTriangle;
  const color = blocking
    ? "text-destructive"
    : approved
      ? "text-green-600 dark:text-green-400"
      : "text-yellow-600 dark:text-yellow-400";

  return (
    <div className="col-span-2 sm:col-span-1 rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">Score da guia</p>
      <div className={`flex items-center gap-1.5 mt-1 font-semibold text-lg ${color}`}>
        <Icon className="h-4 w-4" />
        {display}
      </div>
      {blocking ? (
        <p className="text-xs text-destructive mt-0.5">Guia bloqueante</p>
      ) : approved ? (
        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Aprovada</p>
      ) : score != null ? (
        <p className="text-xs text-muted-foreground mt-0.5">Revisão necessária</p>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "critical" | "warning";
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          variant === "critical"
            ? "text-destructive"
            : variant === "warning"
              ? "text-orange-600 dark:text-orange-400"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FindingRow({
  finding,
  isBlockingField,
}: {
  finding: AuditFinding;
  isBlockingField: boolean;
}) {
  return (
    <li
      className={`rounded-md border p-3 text-sm space-y-1 ${
        finding.blocking ? "border-destructive/40 bg-destructive/5" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[finding.severity]}`}
        >
          {SEVERITY_LABELS[finding.severity]}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{finding.ruleId}</span>
        <span className="text-xs text-muted-foreground capitalize">{finding.category}</span>
        {finding.blocking || isBlockingField ? (
          <span className="inline-flex items-center gap-0.5 text-xs text-destructive font-medium">
            <XCircle className="h-3 w-3" />
            Bloqueante
          </span>
        ) : null}
      </div>
      <p className="font-medium">{finding.message}</p>
      <p className="text-xs text-muted-foreground">
        Campo: <code className="font-mono">{finding.field}</code>
        {finding.detectedValue != null ? (
          <> · Valor: <code className="font-mono">{finding.detectedValue}</code></>
        ) : null}
        {finding.expectedValue != null ? (
          <> · Esperado: <code className="font-mono">{finding.expectedValue}</code></>
        ) : null}
      </p>
      <p className="text-xs text-primary/80">{finding.suggestedCorrection}</p>
    </li>
  );
}
