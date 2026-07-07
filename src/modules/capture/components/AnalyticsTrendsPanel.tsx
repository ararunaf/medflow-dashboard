import { LineChart } from "lucide-react";
import type { AnalyticsTrends } from "@/lib/capture/analytics";
import { formatFinancialImpact } from "@/lib/capture/processing/dashboard";

type AnalyticsTrendsPanelProps = {
  trends: AnalyticsTrends | null;
  busy: boolean;
};

const SERIES: Array<{
  key: keyof AnalyticsTrends;
  label: string;
  format?: (n: number) => string;
}> = [
  { key: "volume", label: "Volume de guias" },
  { key: "risk", label: "Risco médio (score)" },
  { key: "corrections", label: "Correções decididas" },
  {
    key: "estimatedGlosasAvoided",
    label: "Glosas evitadas (estim.)",
    format: (n) => formatFinancialImpact(n),
  },
  { key: "productivity", label: "Produtividade (aprovações/dia)" },
];

export function AnalyticsTrendsPanel({ trends, busy }: AnalyticsTrendsPanelProps) {
  if (!trends && busy) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="analytics-trends-loading">
        Carregando tendências…
      </p>
    );
  }
  if (!trends) return null;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="analytics-trends-panel"
    >
      <div className="flex items-center gap-2">
        <LineChart className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Tendências (28 dias)</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SERIES.map((series) => {
          const points = trends[series.key];
          const max = Math.max(...points.map((p) => p.value), 1);
          const recent = points.slice(-7);
          const total = points.reduce((s, p) => s + p.value, 0);

          return (
            <div key={series.key} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {series.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Σ {series.format ? series.format(total) : total}
                </span>
              </div>
              <div className="flex items-end gap-0.5 h-16">
                {recent.map((p) => (
                  <div
                    key={p.dayKey}
                    className="flex-1 bg-primary/20 rounded-t-sm relative group"
                    style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
                    title={`${p.dayKey}: ${series.format ? series.format(p.value) : p.value}`}
                  >
                    <span className="sr-only">
                      {p.dayKey} {p.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Últimos 7 dias · barras proporcionais ao período
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
