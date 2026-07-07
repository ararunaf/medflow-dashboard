import { useMemo, useState } from "react";
import {
  BookOpen,
  FileJson,
  Scale,
  Shield,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ContractIntelligenceReport,
  ContractIntelligenceSummaryMeta,
  EnrichedAuditFinding,
} from "@/lib/capture/contract";
import type { CapturePhase } from "../types";

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function EnrichedFindingCard({ item }: { item: EnrichedAuditFinding }) {
  const { finding, enrichment, matchedRuleIds } = item;
  if (!enrichment) return null;

  return (
    <article
      className="rounded-md border bg-background p-3 space-y-2"
      data-testid={`contract-finding-${finding.ruleId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{finding.ruleId}</p>
          <p className="text-sm font-medium">{finding.message}</p>
        </div>
        <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
          Risco {enrichment.estimatedDenialRisk}%
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{enrichment.expandedJustification}</p>

      <dl className="grid gap-1.5 text-xs">
        <div>
          <dt className="font-medium text-foreground">Fundamento contratual</dt>
          <dd className="text-muted-foreground">{enrichment.contractualBasis}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Fundamento TISS</dt>
          <dd className="text-muted-foreground">{enrichment.tissBasis}</dd>
        </div>
        {enrichment.tussBasis !== "N/A — finding não relacionado a procedimento TUSS" ? (
          <div>
            <dt className="font-medium text-foreground">Fundamento TUSS</dt>
            <dd className="text-muted-foreground">{enrichment.tussBasis}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-medium text-foreground">Impacto esperado</dt>
          <dd className="text-muted-foreground">{enrichment.expectedImpact}</dd>
        </div>
        {enrichment.observations ? (
          <div>
            <dt className="font-medium text-foreground">Observações</dt>
            <dd className="text-muted-foreground">{enrichment.observations}</dd>
          </div>
        ) : null}
      </dl>

      {matchedRuleIds.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {matchedRuleIds.map((id) => (
            <span
              key={id}
              className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary"
            >
              {id}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function CaptureContractPanel({
  phase,
  summary,
  report,
  onDownloadJson,
  busy,
}: {
  phase: CapturePhase;
  summary: ContractIntelligenceSummaryMeta | null;
  report: ContractIntelligenceReport | null;
  onDownloadJson?: () => void;
  busy?: boolean;
}) {
  const [showRules, setShowRules] = useState(true);

  const showPanel =
    phase === "auditing" ||
    phase === "completed" ||
    summary != null ||
    report != null;

  const enrichedFindings = useMemo(
    () => report?.findings.filter((f) => f.enrichment != null) ?? [],
    [report?.findings],
  );

  if (!showPanel) return null;

  const status = summary?.status ?? (report ? "completed" : "pending");
  const operatorResolved = report?.summary.operatorResolved ?? summary?.operatorResolved;
  const contractResolved = report?.summary.contractResolved ?? summary?.contractResolved;
  const appliedRulesCount = report?.summary.appliedRulesCount ?? summary?.appliedRulesCount ?? 0;
  const enrichedCount = report?.summary.enrichedCount ?? summary?.enrichedCount ?? 0;
  const totalImpact =
    report?.summary.totalEstimatedFinancialImpactCents ??
    summary?.totalEstimatedFinancialImpactCents ??
    0;
  const avgRisk = report?.summary.averageDenialRisk ?? summary?.averageDenialRisk ?? 0;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="capture-contract-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Conhecimento Contratual</h2>
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
          Aguardando conclusão da auditoria preventiva para enriquecer findings com conhecimento
          contratual.
        </p>
      ) : null}

      {status === "completed" && report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Operadora
              </div>
              <p className="mt-1 text-sm font-medium">
                {report.context.operator.name ?? report.context.operator.ansCode ?? "Não identificada"}
              </p>
              <p className="text-xs text-muted-foreground">
                {operatorResolved ? "Identificada" : "Não resolvida — regras genéricas"}
              </p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Scale className="h-3.5 w-3.5" />
                Contrato
              </div>
              <p className="mt-1 text-sm font-medium">
                {report.context.contract.contractName ?? "Não identificado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {contractResolved
                  ? `v${report.context.contract.registryVersion}`
                  : "Regras genéricas ANS/TISS"}
              </p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5" />
                Risco médio de glosa
              </div>
              <p className="mt-1 text-sm font-medium">{avgRisk}%</p>
              <p className="text-xs text-muted-foreground">
                {enrichedCount} finding(s) enriquecido(s)
              </p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                Impacto financeiro estimado
              </div>
              <p className="mt-1 text-sm font-medium">
                {totalImpact > 0 ? formatCurrency(totalImpact) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {appliedRulesCount} regra(s) aplicada(s)
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setShowRules((v) => !v)}
            >
              {showRules ? "Ocultar" : "Mostrar"} regras aplicadas ({appliedRulesCount})
            </button>

            {showRules ? (
              <ul className="mt-2 space-y-1.5" data-testid="applied-rules-list">
                {report.appliedRules.map((rule) => (
                  <li
                    key={rule.ruleId}
                    className="rounded border bg-muted/30 px-2 py-1.5 text-xs"
                  >
                    <span className="font-mono font-medium">{rule.ruleId}</span>
                    <span className="text-muted-foreground"> — {rule.description}</span>
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      (prioridade {rule.priority})
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {enrichedFindings.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Findings enriquecidos
              </h3>
              <div className="space-y-2">
                {enrichedFindings.map((item) => (
                  <EnrichedFindingCard
                    key={`${item.finding.ruleId}::${item.finding.field}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum finding enriquecido com regras contratuais para este atendimento.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
