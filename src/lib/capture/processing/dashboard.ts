/**
 * Dashboard operacional do Centro de Processamento — MEDICFLOW-PROCESSING-CENTER-01.
 */
import type { ProcessingGuideItem, ProcessingOperationalDashboard } from "./types";
import { PROCESSING_QUEUE_IDS, PROCESSING_QUEUE_LABELS } from "./types";

export function buildProcessingDashboard(
  items: ProcessingGuideItem[],
): ProcessingOperationalDashboard {
  const totalGuides = items.length;
  const criticalGuides = items.filter((i) => i.isCritical).length;
  const totalFinancialRisk = items.reduce((sum, i) => sum + i.estimatedFinancialImpact, 0);

  let processingTimeSum = 0;
  let processingTimeCount = 0;
  for (const item of items) {
    if (item.queue === "aprovadas" || item.queue === "reprovadas") {
      const created = new Date(item.createdAt).getTime();
      const updated = new Date(item.updatedAt).getTime();
      if (updated > created) {
        processingTimeSum += updated - created;
        processingTimeCount += 1;
      }
    }
  }

  const operatorMap = new Map<string, number>();
  for (const item of items) {
    const key = item.operatorName ?? item.operatorAnsCode ?? "Não identificada";
    operatorMap.set(key, (operatorMap.get(key) ?? 0) + 1);
  }

  const byOperator = [...operatorMap.entries()]
    .map(([operator, count]) => ({ operator, count }))
    .sort((a, b) => b.count - a.count);

  const statusMap = new Map<string, number>();
  for (const item of items) {
    statusMap.set(item.queue, (statusMap.get(item.queue) ?? 0) + 1);
  }

  const byStatus = PROCESSING_QUEUE_IDS.map((queue) => ({
    queue,
    label: PROCESSING_QUEUE_LABELS[queue],
    count: statusMap.get(queue) ?? 0,
  }));

  return {
    totalGuides,
    averageProcessingTimeMs:
      processingTimeCount > 0 ? Math.round(processingTimeSum / processingTimeCount) : 0,
    criticalGuides,
    totalFinancialRisk,
    byOperator,
    byStatus,
  };
}

export function formatProcessingDuration(ms: number): string {
  if (ms <= 0) return "—";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function formatFinancialImpact(value: number): string {
  if (value <= 0) return "R$ 0";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
