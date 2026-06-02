import { useMemo } from "react";
import {
  readPilotManualFlag,
  type PilotManualKey,
} from "@/lib/services/deployment-checklist/deployment-checklist-service";
import { useClientMounted } from "@/hooks/use-client-mounted";

export function usePilotManualFlags(
  tenantId: string | undefined,
  refreshKey = 0,
): Partial<Record<PilotManualKey, boolean>> {
  const mounted = useClientMounted();
  return useMemo(
    () =>
      mounted
        ? {
            permissions_reviewed: readPilotManualFlag(tenantId, "permissions_reviewed"),
            readiness_validated: readPilotManualFlag(tenantId, "readiness_validated"),
            competence_acknowledged: readPilotManualFlag(tenantId, "competence_acknowledged"),
          }
        : {},
    [mounted, tenantId, refreshKey],
  );
}
