import { useMemo } from "react";
import {
  AlertTriangle,
  FileJson,
  ShieldAlert,
  TrendingDown,
  ListOrdered,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RiskAssessmentReport,
  RiskAssessmentSummaryMeta,
  RiskLevel,
} from "@/lib/capture/risk";
import type { CapturePhase } from "../types";

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "Crítico":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "Alto":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
    case "Médio":
      return "bg-yellow-500/15 text-yellow-800 dark:text-yellow-400";
    default:
      return "bg-green-500/15 text-green-700 dark:text-green-400";
  }
}

export function CaptureRiskPanel({
  phase,
  summary,
  report,
  onDownloadJson,
  busy,
}: {
  phase: CapturePhase;
  summary: RiskAssessmentSummaryMeta | null;
  report: RiskAssessmentReport | null;
  onDownloadJson?: () => void;
  busy?: boolean;
}) {
  const showPanel =
    phase === "auditing" ||
    phase === "completed" ||
    summary != null ||
    report != null;

  const assessment = report?.assessment;
  const status = summary?.status ?? (report ? "completed" : "pending");

  const topFactors = useMemo(
    () => assessment?.topRiskFactors.slice(0, 5) ?? [],
    [assessment?.topRiskFactors],
  );

  if (!showPanel) return null;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="capture-risk-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Risco de Glosa</h2>
        </div>
        {onDownloadJson ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy || !report}
            onClick={onDownloadJson}
          >
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </Button>
        ) : null}
      </div>

      {status === "pending" ? (
        <p className="text-sm text-muted-foreground">
          Aguardando conclusão da inteligência contratual para calcular o risco de glosa.
        </p>
      ) : null}

      {status === "completed" && assessment ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                Score geral
              </div>
              <p className="mt-1 text-2xl font-bold">{assessment.overallRiskScore}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${riskLevelColor(assessment.overallRiskLevel)}`}
              >
                {assessment.overallRiskLevel}
              </span>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5" />
                Probabilidade de glosa
              </div>
              <p className="mt-1 text-2xl font-bold">
                {Math.round(assessment.estimatedDenialProbability * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Estimativa determinística</p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                Impacto financeiro
              </div>
              <p className="mt-1 text-sm font-medium">
                {assessment.estimatedFinancialImpact > 0
                  ? formatCurrency(assessment.estimatedFinancialImpact)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {assessment.blockingIssues.length} bloqueio(s)
              </p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListOrdered className="h-3.5 w-3.5" />
                Findings avaliados
              </div>
              <p className="mt-1 text-sm font-medium">{report?.findingRisks.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                {report?.categoryRisks.length ?? 0} categoria(s) com risco
              </p>
            </div>
          </div>

          {topFactors.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fatores que mais contribuíram
              </h3>
              <ul className="space-y-1.5" data-testid="top-risk-factors">
                {topFactors.map((factor) => (
                  <li
                    key={factor.factorId}
                    className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">{factor.label}</span>
                    <span className="font-mono font-medium">+{factor.contribution}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {report && report.correctionPriorityRanking.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ranking de prioridade de correção
              </h3>
              <ol className="space-y-1.5" data-testid="correction-priority-ranking">
                {report.correctionPriorityRanking.slice(0, 8).map((item) => (
                  <li
                    key={`${item.ruleId}::${item.field}`}
                    className="flex items-start gap-2 rounded border bg-background px-2 py-1.5 text-xs"
                  >
                    <span className="font-mono font-bold text-primary">#{item.rank}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {item.ruleId} — {item.field}
                      </p>
                      <p className="text-muted-foreground truncate">{item.message}</p>
                    </div>
                    <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px]">
                      {item.riskScore}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {assessment.recommendations.length > 0 ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recomendações
              </h3>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                {assessment.recommendations.map((rec) => (
                  <li key={rec}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
