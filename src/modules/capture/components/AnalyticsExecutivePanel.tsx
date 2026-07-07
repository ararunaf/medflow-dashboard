import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  ShieldAlert,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import type { ExecutiveKpis } from "@/lib/capture/analytics";
import { formatFinancialImpact } from "@/lib/capture/processing/dashboard";
import { StatCard } from "@/components/ui-kit";

type AnalyticsExecutivePanelProps = {
  kpis: ExecutiveKpis | null;
  busy: boolean;
};

export function AnalyticsExecutivePanel({ kpis, busy }: AnalyticsExecutivePanelProps) {
  if (!kpis && busy) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="analytics-executive-loading">
        Carregando indicadores executivos…
      </p>
    );
  }
  if (!kpis) return null;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="analytics-executive-panel"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Dashboard Executivo</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard label="Guias processadas" value={kpis.totalGuidesProcessed} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Aprovadas" value={kpis.guidesApproved} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatCard label="Reprovadas" value={kpis.guidesRejected} icon={<XCircle className="h-4 w-4" />} />
        <StatCard label="Em revisão" value={kpis.guidesInReview} icon={<Clock className="h-4 w-4" />} />
        <StatCard
          label="Críticas"
          value={kpis.guidesCritical}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Impacto financeiro em risco"
          value={formatFinancialImpact(kpis.financialRiskImpact)}
          icon={<Wallet className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label="Economia potencial (correções)"
          value={formatFinancialImpact(kpis.potentialSavingsFromCorrections)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border p-3 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Por operadora
          </h3>
          {kpis.guidesByOperator.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {kpis.guidesByOperator.slice(0, 8).map((row) => (
                <li key={row.label} className="flex justify-between gap-2">
                  <span className="truncate">{row.label}</span>
                  <span className="font-medium tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Por tipo de guia
          </h3>
          <ul className="space-y-1 text-sm">
            {kpis.guidesByType.map((row) => (
              <li key={row.label} className="flex justify-between gap-2">
                <span className="truncate">{row.label}</span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Distribuição de risco
          </h3>
          <ul className="space-y-1 text-sm">
            {kpis.riskDistribution.map((row) => (
              <li key={row.level} className="flex justify-between gap-2">
                <span>{row.level}</span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {kpis.guidesCritical > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {kpis.guidesCritical} guia(s) crítica(s) no recorte atual.
        </div>
      ) : null}
    </section>
  );
}
