import { useCallback, useEffect, useState } from "react";
import type { OperatorContractSummary } from "@/lib/capture/contract/review/contract-rule-review-service";
import { fetchOperatorContractsForReview } from "../services/contract-rule-review-client";

export function useOperatorContractsForReview() {
  const [contracts, setContracts] = useState<OperatorContractSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchOperatorContractsForReview();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { contracts, busy, error, refresh };
}
