import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Brain,
  Lightbulb,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningDashboardView } from "@/lib/capture/learning";
import { fetchCaptureLearningDashboard } from "../services/learning-client";

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function confidencePct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

const SEVERITY_STYLES = {
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-500/20",
  insight: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
} as const;

export function CaptureLearningPanel() {
  const [dashboard, setDashboard] = useState<LearningDashboardView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchCaptureLearningDashboard();
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

  const metrics = dashboard?.metrics;

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">Learning Loop — Conhecimento</h2>
            <p className="text-xs text-muted-foreground">
              Métricas observacionais das decisões de correção assistida (somente leitura)
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => void load()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {!dashboard && busy ? (
        <p className="text-sm text-muted-foreground">Carregando métricas…</p>
      ) : null}

      {metrics ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Registros"
              value={String(metrics.totalRecords)}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              label="Taxa de aceitação"
              value={pct(metrics.globalAcceptanceRate)}
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            />
            <MetricCard
              label="Taxa de edição"
              value={pct(metrics.globalEditRate)}
              icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
            />
            <MetricCard
              label="Confiança média"
              value={confidencePct(metrics.globalAverageConfidence)}
              icon={<Brain className="h-4 w-4 text-primary" />}
            />
          </div>

          {dashboard.recommendations.length > 0 ? (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5" />
                Recomendações
              </h3>
              <ul className="space-y-2">
                {dashboard.recommendations.map((rec) => (
                  <li
                    key={rec.id}
                    className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLES[rec.severity]}`}
                  >
                    {rec.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <RankingList
              title="Regras mais aceitas"
              icon={<TrendingUp className="h-3.5 w-3.5 text-green-600" />}
              items={dashboard.topAcceptedRules.map((r) => ({
                key: r.ruleId,
                primary: r.ruleId,
                secondary: `${pct(r.acceptanceRate)} aceitação · ${r.usageCount} uso(s)`,
              }))}
              empty="Sem dados suficientes"
            />
            <RankingList
              title="Regras mais rejeitadas"
              icon={<TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              items={dashboard.topRejectedRules.map((r) => ({
                key: r.ruleId,
                primary: r.ruleId,
                secondary: `${pct(r.rejectRate)} rejeição · FPR ${pct(r.falsePositiveRate)}`,
              }))}
              empty="Sem dados suficientes"
            />
            <RankingList
              title="Sugestões mais editadas"
              icon={<BarChart3 className="h-3.5 w-3.5 text-blue-600" />}
              items={dashboard.topEditedFields.map((f) => ({
                key: f.field,
                primary: f.field,
                secondary: `${pct(f.editRate)} edição · conf. ${confidencePct(f.averageConfidence)}`,
              }))}
              empty="Sem dados suficientes"
            />
          </div>

          {metrics.temporalEvolution.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Evolução temporal
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Período</th>
                      <th className="pb-2 pr-4 font-medium">Total</th>
                      <th className="pb-2 pr-4 font-medium">Aceitas</th>
                      <th className="pb-2 pr-4 font-medium">Editadas</th>
                      <th className="pb-2 pr-4 font-medium">Rejeitadas</th>
                      <th className="pb-2 font-medium">Conf. média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.temporalEvolution.map((bucket) => (
                      <tr key={bucket.period} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono">{bucket.period}</td>
                        <td className="py-2 pr-4">{bucket.total}</td>
                        <td className="py-2 pr-4 text-green-600">{bucket.accepted}</td>
                        <td className="py-2 pr-4 text-blue-600">{bucket.edited}</td>
                        <td className="py-2 pr-4 text-destructive">{bucket.rejected}</td>
                        <td className="py-2">{confidencePct(bucket.averageConfidence)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {metrics.byRule.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Métricas por regra
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Regra</th>
                      <th className="pb-2 pr-4 font-medium">Usos</th>
                      <th className="pb-2 pr-4 font-medium">Aceitação</th>
                      <th className="pb-2 pr-4 font-medium">Edição</th>
                      <th className="pb-2 pr-4 font-medium">Rejeição</th>
                      <th className="pb-2 pr-4 font-medium">FPR</th>
                      <th className="pb-2 pr-4 font-medium">Conf. média</th>
                      <th className="pb-2 font-medium">Tempo médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.byRule.map((rule) => (
                      <tr key={rule.ruleId} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono">{rule.ruleId}</td>
                        <td className="py-2 pr-4">{rule.usageCount}</td>
                        <td className="py-2 pr-4">{pct(rule.acceptanceRate)}</td>
                        <td className="py-2 pr-4">{pct(rule.editRate)}</td>
                        <td className="py-2 pr-4">{pct(rule.rejectRate)}</td>
                        <td className="py-2 pr-4">{pct(rule.falsePositiveRate)}</td>
                        <td className="py-2 pr-4">{confidencePct(rule.averageConfidence)}</td>
                        <td className="py-2">
                          {rule.averageTimeToDecisionMs > 0
                            ? `${Math.round(rule.averageTimeToDecisionMs / 1000)}s`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function RankingList({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ key: string; primary: string; secondary: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key} className="text-sm">
              <span className="font-mono font-medium">{item.primary}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {item.secondary}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
