import { useCallback, useEffect, useRef, useState } from "react";
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

  // Sincroniza sempre com a URL (?queue=), inclusive para limpar o filtro
  // quando initialQueue volta a ser undefined (ex.: sidebar "Processamento
  // de Guias" depois de "Auditoria de Guias"/"Correções Pendentes") — um
  // guard `if (initialQueue)` aqui deixava a fila anterior "presa".
  useEffect(() => {
    setActiveQueue(initialQueue);
  }, [initialQueue]);

  // Trocas rápidas de fila disparam requisições concorrentes; só a mais
  // recente pode atualizar a tela — senão uma resposta atrasada de outra fila
  // (ex.: "Parser", 0 guias) sobrescreve a de "Todas" e a lista aparece zerada.
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    setBusy(true);
    setError(null);
    try {
      const [listResult, dashboardResult] = await Promise.all([
        fetchProcessingCenter({ filters, queue: activeQueue }),
        fetchProcessingDashboard(filters),
      ]);
      if (seq !== requestSeq.current) return;
      setList(listResult);
      setDashboard(dashboardResult);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (seq === requestSeq.current) setBusy(false);
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
