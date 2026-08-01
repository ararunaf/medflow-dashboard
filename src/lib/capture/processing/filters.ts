/**
 * Filtros do Centro de Processamento — MEDICFLOW-PROCESSING-CENTER-01.
 */
import type { ProcessingCenterFilters, ProcessingGuideItem, ProcessingQueueId } from "./types";

function matchesPeriod(createdAt: string, periodFrom?: string, periodTo?: string): boolean {
  const created = new Date(createdAt).getTime();
  if (periodFrom) {
    const from = new Date(periodFrom).getTime();
    if (created < from) return false;
  }
  if (periodTo) {
    const to = new Date(periodTo).getTime();
    if (created > to) return false;
  }
  return true;
}

function matchesOperator(item: ProcessingGuideItem, operator?: string): boolean {
  if (!operator?.trim()) return true;
  const q = operator.trim().toLowerCase();
  const name = (item.operatorName ?? "").toLowerCase();
  const ans = (item.operatorAnsCode ?? "").toLowerCase();
  return name.includes(q) || ans.includes(q);
}

export function applyProcessingFilters(
  items: ProcessingGuideItem[],
  filters: ProcessingCenterFilters = {},
  activeQueue?: ProcessingQueueId,
): ProcessingGuideItem[] {
  const queue = filters.queue ?? activeQueue;

  return items.filter((item) => {
    if (queue && item.queue !== queue) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.guideType && item.guideType !== filters.guideType) return false;
    if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
    if (!matchesOperator(item, filters.operator)) return false;
    if (!matchesPeriod(item.createdAt, filters.periodFrom, filters.periodTo)) return false;
    if (filters.responsible) {
      const resp = filters.responsible.trim();
      if (item.responsibleProfileId !== resp) return false;
    }
    return true;
  });
}

export function countByQueue(items: ProcessingGuideItem[]): Record<ProcessingQueueId, number> {
  const counts: Record<ProcessingQueueId, number> = {
    ocr_pendente: 0,
    parser: 0,
    auditoria: 0,
    correcao: 0,
    aguardando_revisao: 0,
    aprovadas: 0,
    reprovadas: 0,
  };
  for (const item of items) {
    counts[item.queue] += 1;
  }
  return counts;
}
