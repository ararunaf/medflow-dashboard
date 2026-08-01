import { Link } from "@tanstack/react-router";
import { BarChart3, Layers, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader } from "@/components/ui-kit";
import { ProcessingFilters } from "../components/ProcessingFilters";
import { AnalyticsExecutivePanel } from "../components/AnalyticsExecutivePanel";
import { AnalyticsQualityPanel } from "../components/AnalyticsQualityPanel";
import { AnalyticsOperatorsPanel } from "../components/AnalyticsOperatorsPanel";
import { AnalyticsTrendsPanel } from "../components/AnalyticsTrendsPanel";
import { AnalyticsExportBar } from "../components/AnalyticsExportBar";
import { useAnalyticsDashboard } from "../hooks/useAnalyticsDashboard";

export function AnalyticsDashboardPage() {
  const analytics = useAnalyticsDashboard();

  return (
    <AppShell>
      <PageHeader
        title="Analytics Executivo"
        subtitle="Indicadores operacionais, financeiros e de qualidade — calculados de forma determinística a partir do pipeline de captura."
        actions={
          <div className="flex flex-wrap gap-2">
            <AnalyticsExportBar snapshot={analytics.snapshot} disabled={analytics.busy} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={analytics.busy}
              onClick={() => void analytics.refresh()}
            >
              <RefreshCw className={analytics.busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Atualizar
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to="/processamento" search={{ queue: undefined }}>
                <Layers className="h-3.5 w-3.5" />
                Processamento
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-6" data-testid="analytics-dashboard">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>
            Base: <strong className="text-foreground">capture_sessions</strong> + métricas do
            Learning Loop — sem IA generativa.
          </span>
        </div>

        {analytics.error ? (
          <ErrorState message={analytics.error} onRetry={() => void analytics.refresh()} />
        ) : null}

        <ProcessingFilters
          filters={analytics.filters}
          onChange={analytics.updateFilters}
          onClear={analytics.clearFilters}
        />

        <AnalyticsExecutivePanel
          kpis={analytics.snapshot?.executive ?? null}
          busy={analytics.busy}
        />
        <AnalyticsQualityPanel
          quality={analytics.snapshot?.quality ?? null}
          busy={analytics.busy}
        />
        <AnalyticsOperatorsPanel
          operators={analytics.snapshot?.operators ?? null}
          busy={analytics.busy}
        />
        <AnalyticsTrendsPanel trends={analytics.snapshot?.trends ?? null} busy={analytics.busy} />

        {analytics.snapshot ? (
          <p className="text-xs text-muted-foreground">
            Recorte: <strong>{analytics.snapshot.sessionCount}</strong> sessão(ões) · atualizado em{" "}
            {new Date(analytics.snapshot.asOf).toLocaleString("pt-BR")}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
