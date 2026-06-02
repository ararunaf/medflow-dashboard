import { useMemo } from "react";
import { useOperationalAnalyticsQuery } from "@/hooks/use-operational-analytics";
import { useMyContextQuery } from "@/hooks/use-operations";
import { isOperationalManager } from "@/lib/auth/rbac";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalAlert } from "@/lib/operations/alerts/types";
import {
  buildOperationalContextPayload,
  buildOperationalCopilotContextBundle,
  buildOperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/operational-copilot-context-service";

export function useOperationalCopilotDerived(props: {
  snapshot: OperationalCommandCenterSnapshot | undefined;
  alerts: readonly OperationalAlert[];
}) {
  const me = useMyContextQuery({ refetchOnWindowFocus: false });
  const canSee = !!me.data?.tenant.id && isOperationalManager(me.data.role);

  const analyticsQuery = useOperationalAnalyticsQuery({
    enabled: canSee && !!props.snapshot,
    staleTime: 60_000,
  });

  const derived = useMemo(() => {
    if (!canSee || !props.snapshot) return null;
    const bundle = buildOperationalCopilotContextBundle({
      snapshot: props.snapshot,
      alerts: props.alerts,
      analytics: analyticsQuery.data,
      timeline: null,
    });
    const semantic = buildOperationalSemanticSnapshot(bundle);
    const payload = buildOperationalContextPayload(bundle);
    return { bundle, semantic, payload };
  }, [canSee, props.snapshot, props.alerts, analyticsQuery.data]);

  return { canSee, derived, analyticsQuery };
}
