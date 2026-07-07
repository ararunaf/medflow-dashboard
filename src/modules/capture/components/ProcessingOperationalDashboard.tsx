import { AlertTriangle, BarChart3, Clock, ShieldAlert, Wallet } from "lucide-react";
import type { ProcessingOperationalDashboard } from "@/lib/capture/processing";
import {
  formatFinancialImpact,
  formatProcessingDuration,
} from "@/lib/capture/processing/dashboard";

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof ShieldAlert;
  accent?: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3" data-testid={`metric-${label}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

type ProcessingOperationalDashboardProps = {
  dashboard: ProcessingOperationalDashboard | null;
  busy: boolean;
};

export function ProcessingOperationalDashboardPanel({
  dashboard,
  busy,
}: ProcessingOperationalDashboardProps) {
  if (!dashboard && busy) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="processing-dashboard-loading">
        Carregando indicadores operacionais…
      </p>
    );
  }

  if (!dashboard) return null;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="processing-operational-dashboard"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Dashboard Operacional</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Guias" value={dashboard.totalGuides} icon={BarChart3} />
        <MetricCard
          label="Tempo médio"
          value={formatProcessingDuration(dashboard.averageProcessingTimeMs)}
          icon={Clock}
        />
        <MetricCard
          label="Guias críticas"
          value={dashboard.criticalGuides}
          icon={ShieldAlert}
          accent="text-red-600"
        />
        <MetricCard
          label="Impacto em risco"
          value={formatFinancialImpact(dashboard.totalFinancialRisk)}
          icon={Wallet}
          accent="text-amber-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border p-3 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Por operadora
          </h3>
          {dashboard.byOperator.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma guia listada.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {dashboard.byOperator.slice(0, 6).map((row) => (
                <li key={row.operator} className="flex justify-between gap-2">
                  <span className="truncate">{row.operator}</span>
                  <span className="font-medium tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Por status (fila)
          </h3>
          <ul className="space-y-1 text-sm">
            {dashboard.byStatus.map((row) => (
              <li key={row.queue} className="flex justify-between gap-2">
                <span className="truncate">{row.label}</span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {dashboard.criticalGuides > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {dashboard.criticalGuides} guia(s) com risco crítico requerem atenção imediata.
        </div>
      ) : null}
    </section>
  );
}
