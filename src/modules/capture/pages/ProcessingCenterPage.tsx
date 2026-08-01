import { Link } from "@tanstack/react-router";
import { Layers, RefreshCw, ScanLine } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader } from "@/components/ui-kit";
import { ProcessingFilters } from "../components/ProcessingFilters";
import { ProcessingGuideTable } from "../components/ProcessingGuideTable";
import { ProcessingOperationalDashboardPanel } from "../components/ProcessingOperationalDashboard";
import { ProcessingQueueTabs } from "../components/ProcessingQueueTabs";
import { useProcessingCenter } from "../hooks/useProcessingCenter";
import type { ProcessingQueueId } from "@/lib/capture/processing";

type ProcessingCenterPageProps = {
  initialQueue?: ProcessingQueueId;
};

export function ProcessingCenterPage({ initialQueue }: ProcessingCenterPageProps) {
  const center = useProcessingCenter(initialQueue);

  return (
    <AppShell>
      <PageHeader
        title="Centro de Processamento"
        subtitle="Filas operacionais para revisão em escala — priorização por risco, impacto e tempo de espera."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={center.busy}
              onClick={() => void center.refresh()}
            >
              <RefreshCw className={center.busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Atualizar
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to="/captura">
                <ScanLine className="h-3.5 w-3.5" />
                Captura
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-6" data-testid="processing-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>
            Fluxo:{" "}
            <strong className="text-foreground">
              Fila → Workspace → Correção → Aprovação → Próxima Guia
            </strong>
          </span>
        </div>

        {center.error ? (
          <ErrorState message={center.error} onRetry={() => void center.refresh()} />
        ) : null}

        <ProcessingOperationalDashboardPanel dashboard={center.dashboard} busy={center.busy} />

        <ProcessingFilters
          filters={center.filters}
          onChange={center.updateFilters}
          onClear={center.clearFilters}
        />

        <ProcessingQueueTabs
          activeQueue={center.activeQueue}
          queueCounts={center.list?.queueCounts}
          onSelect={center.selectQueue}
        />

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {center.list ? (
              <>
                Exibindo <strong className="text-foreground">{center.list.items.length}</strong> de{" "}
                <strong className="text-foreground">{center.list.total}</strong> guias — ordenadas
                por prioridade operacional
              </>
            ) : (
              "Carregando fila…"
            )}
          </span>
        </div>

        <ProcessingGuideTable
          items={center.list?.items ?? []}
          busy={center.busy}
          activeQueue={center.activeQueue}
        />
      </div>
    </AppShell>
  );
}
