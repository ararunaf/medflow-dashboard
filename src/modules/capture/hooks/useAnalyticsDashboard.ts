import { useCallback, useEffect, useState } from "react";
import type { AnalyticsFilters, AnalyticsSnapshot } from "@/lib/capture/analytics";
import { fetchAnalyticsSnapshot } from "../services/analytics-client";

export function useAnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchAnalyticsSnapshot({ filters });
      setSnapshot(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar analytics.");
    } finally {
      setBusy(false);
    }
  }, [filters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateFilters = useCallback((next: AnalyticsFilters) => {
    setFilters(next);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    snapshot,
    filters,
    busy,
    error,
    refresh,
    updateFilters,
    clearFilters,
  };
}
