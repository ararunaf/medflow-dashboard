/**
 * Cliente — Centro Operacional de Processamento.
 */
import {
  getProcessingDashboardFn,
  listProcessingCenterFn,
} from "@/lib/capture/api/processing-server";
import type {
  ProcessingCenterFilters,
  ProcessingCenterListResult,
  ProcessingOperationalDashboard,
  ProcessingQueueId,
} from "@/lib/capture/processing";

export async function fetchProcessingCenter(input?: {
  filters?: ProcessingCenterFilters;
  queue?: ProcessingQueueId;
  limit?: number;
  offset?: number;
}): Promise<ProcessingCenterListResult> {
  const res = await listProcessingCenterFn({ data: input ?? {} });
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}

export async function fetchProcessingDashboard(
  filters?: ProcessingCenterFilters,
): Promise<ProcessingOperationalDashboard> {
  const res = await getProcessingDashboardFn({ data: { filters } });
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}
