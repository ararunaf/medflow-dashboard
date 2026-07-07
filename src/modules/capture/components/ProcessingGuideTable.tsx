import { Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import {
  PROCESSING_QUEUE_LABELS,
  type ProcessingGuideItem,
  type ProcessingQueueId,
} from "@/lib/capture/processing";
import {
  formatFinancialImpact,
  formatProcessingDuration,
} from "@/lib/capture/processing/dashboard";
import { cn } from "@/lib/utils";

type ProcessingGuideTableProps = {
  items: ProcessingGuideItem[];
  busy: boolean;
  activeQueue?: ProcessingQueueId;
};

function riskBadgeClass(level: ProcessingGuideItem["riskLevel"]): string {
  switch (level) {
    case "Crítico":
      return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
    case "Alto":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200";
    case "Médio":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
    case "Baixo":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ProcessingGuideTable({ items, busy, activeQueue }: ProcessingGuideTableProps) {
  if (busy && items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center" data-testid="guide-table-loading">
        Carregando fila…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
        data-testid="guide-table-empty"
      >
        Nenhuma guia nesta fila com os filtros aplicados.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden" data-testid="processing-guide-table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Prioridade</th>
              <th className="px-3 py-2 text-left font-medium">Guia</th>
              <th className="px-3 py-2 text-left font-medium">Fila</th>
              <th className="px-3 py-2 text-left font-medium">Operadora</th>
              <th className="px-3 py-2 text-left font-medium">Risco</th>
              <th className="px-3 py-2 text-right font-medium">Impacto</th>
              <th className="px-3 py-2 text-right font-medium">Espera</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => (
              <tr
                key={item.sessionId}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  item.isCritical && "bg-red-50/50 dark:bg-red-950/10",
                )}
                data-testid={`guide-row-${item.sessionId}`}
              >
                <td className="px-3 py-2 tabular-nums text-muted-foreground">#{index + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 min-w-[10rem]">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {item.filename ?? `Sessão ${item.sessionId.slice(0, 8)}`}
                      </p>
                      {item.guideType ? (
                        <p className="text-xs text-muted-foreground truncate">{item.guideType}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {PROCESSING_QUEUE_LABELS[item.queue]}
                </td>
                <td className="px-3 py-2 text-xs truncate max-w-[8rem]">
                  {item.operatorName ?? item.operatorAnsCode ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {item.riskLevel ? (
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        riskBadgeClass(item.riskLevel),
                      )}
                    >
                      {item.riskLevel}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-xs">
                  {formatFinancialImpact(item.estimatedFinancialImpact)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">
                  {formatProcessingDuration(item.waitTimeMs)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    to="/captura/revisao/$sessionId"
                    params={{ sessionId: item.sessionId }}
                    search={{
                      returnTo: "/processamento",
                      queue: activeQueue ?? item.queue,
                    }}
                    className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-primary/10 text-primary"
                    title="Abrir workspace de revisão"
                    data-testid={`open-workspace-${item.sessionId}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
