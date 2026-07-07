import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BarChart3, ShieldAlert, TrendingUp } from "lucide-react";
import type { RiskDashboardView } from "@/lib/capture/risk";
import { fetchCaptureRiskDashboard } from "../services/risk-client";

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof ShieldAlert;
  accent?: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

export function CaptureRiskDashboard() {
  const [dashboard, setDashboard] = useState<RiskDashboardView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchCaptureRiskDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="capture-risk-dashboard"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Dashboard — Risco de Glosa</h2>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {!dashboard && busy ? (
        <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
      ) : null}

      {dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Guias com risco crítico"
              value={dashboard.criticalCount}
              icon={ShieldAlert}
              accent="text-red-600"
            />
            <MetricCard
              label="Guias com risco alto"
              value={dashboard.highCount}
              icon={AlertTriangle}
              accent="text-orange-600"
            />
            <MetricCard
              label="Total avaliadas"
              value={dashboard.totalAssessed}
              icon={TrendingUp}
            />
            <MetricCard
              label="Risco médio/baixo"
              value={dashboard.mediumCount + dashboard.lowCount}
              icon={BarChart3}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Distribuição por operadora
              </h3>
              {dashboard.byOperator.length > 0 ? (
                <ul className="space-y-1 text-sm" data-testid="risk-by-operator">
                  {dashboard.byOperator.map((item) => (
                    <li
                      key={item.operator}
                      className="flex justify-between rounded border bg-muted/30 px-2 py-1"
                    >
                      <span>{item.operator}</span>
                      <span className="text-muted-foreground">
                        {item.count} guia(s) — score médio {item.avgRiskScore}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma guia avaliada ainda.</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Distribuição por tipo de guia
              </h3>
              {dashboard.byGuideType.length > 0 ? (
                <ul className="space-y-1 text-sm" data-testid="risk-by-guide-type">
                  {dashboard.byGuideType.map((item) => (
                    <li
                      key={item.guideType}
                      className="flex justify-between rounded border bg-muted/30 px-2 py-1"
                    >
                      <span className="font-mono text-xs">{item.guideType}</span>
                      <span className="text-muted-foreground">
                        {item.count} — média {item.avgRiskScore}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma guia avaliada ainda.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Top 10 causas de risco
            </h3>
            {dashboard.topRiskCauses.length > 0 ? (
              <ul className="space-y-1 text-sm" data-testid="top-risk-causes">
                {dashboard.topRiskCauses.map((cause, i) => (
                  <li
                    key={cause.factorId}
                    className="flex items-center justify-between rounded border bg-background px-2 py-1"
                  >
                    <span>
                      <span className="font-mono text-primary mr-2">#{i + 1}</span>
                      {cause.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {cause.count}× — contrib. {cause.totalContribution}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados de causas ainda.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
