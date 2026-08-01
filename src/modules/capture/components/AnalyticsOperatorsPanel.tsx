import type { OperatorComparisonRow } from "@/lib/capture/analytics";
import {
  formatFinancialImpact,
  formatProcessingDuration,
} from "@/lib/capture/processing/dashboard";
import { Building2 } from "lucide-react";

type AnalyticsOperatorsPanelProps = {
  operators: OperatorComparisonRow[] | null;
  busy: boolean;
};

export function AnalyticsOperatorsPanel({ operators, busy }: AnalyticsOperatorsPanelProps) {
  if (!operators && busy) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="analytics-operators-loading">
        Carregando comparativo por operadora…
      </p>
    );
  }
  if (!operators) return null;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="analytics-operators-panel"
    >
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Análise por Operadora</h2>
      </div>

      {operators.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem operadoras no recorte.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Operadora</th>
                <th className="px-3 py-2 text-right">Guias</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-right">Risco médio</th>
                <th className="px-3 py-2 text-right">Tempo médio</th>
                <th className="px-3 py-2">Principais erros</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((row) => (
                <tr key={row.operator} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{row.operationalRank}</td>
                  <td className="px-3 py-2">{row.operator}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.guideCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatFinancialImpact(row.financialValue)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.avgRiskScore ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {formatProcessingDuration(row.avgProcessingTimeMs)}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                    {row.topErrors.length === 0
                      ? "—"
                      : row.topErrors.map((e) => `${e.ruleId} (${e.count})`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
