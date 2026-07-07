import { useCallback, useEffect, useState } from "react";
import type {
  ProcessingCenterFilters,
  ProcessingCenterListResult,
  ProcessingOperationalDashboard,
  ProcessingQueueId,
} from "@/lib/capture/processing";
import { fetchProcessingCenter, fetchProcessingDashboard } from "../services/processing-client";

export function useProcessingCenter(initialQueue?: ProcessingQueueId) {
  const [activeQueue, setActiveQueue] = useState<ProcessingQueueId | undefined>(initialQueue);
  const [filters, setFilters] = useState<ProcessingCenterFilters>({});
  const [list, setList] = useState<ProcessingCenterListResult | null>(null);
  const [dashboard, setDashboard] = useState<ProcessingOperationalDashboard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQueue) {
      setActiveQueue(initialQueue);
    }
  }, [initialQueue]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [listResult, dashboardResult] = await Promise.all([
        fetchProcessingCenter({ filters, queue: activeQueue }),
        fetchProcessingDashboard(filters),
      ]);
      setList(listResult);
      setDashboard(dashboardResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [filters, activeQueue]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectQueue = useCallback((queue: ProcessingQueueId | undefined) => {
    setActiveQueue(queue);
  }, []);

  const updateFilters = useCallback((next: ProcessingCenterFilters) => {
    setFilters(next);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    activeQueue,
    filters,
    list,
    dashboard,
    busy,
    error,
    refresh,
    selectQueue,
    updateFilters,
    clearFilters,
  };
}

export type ProcessingCenterController = ReturnType<typeof useProcessingCenter>;
