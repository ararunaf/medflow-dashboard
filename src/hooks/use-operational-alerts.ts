import { useMemo } from "react";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import { evaluateOperationalAlerts } from "@/lib/operations/alerts/engine";
import type { OperationalAlert, OperationalAlertSeverity } from "@/lib/operations/alerts/types";

export type OperationalAlertsBundle = {
  alerts: OperationalAlert[];
  counts: Record<OperationalAlertSeverity, number>;
  topSeverity: OperationalAlertSeverity | null;
  hasAlerts: boolean;
};

function countBySeverity(alerts: OperationalAlert[]): Record<OperationalAlertSeverity, number> {
  const counts: Record<OperationalAlertSeverity, number> = {
    critical: 0,
    warning: 0,
    info: 0,
  };
  for (const a of alerts) counts[a.severity] += 1;
  return counts;
}

function topSeverityFrom(
  counts: Record<OperationalAlertSeverity, number>,
): OperationalAlertSeverity | null {
  if (counts.critical > 0) return "critical";
  if (counts.warning > 0) return "warning";
  if (counts.info > 0) return "info";
  return null;
}

/**
 * Deriva alertas operacionais do snapshot já carregado pelo TanStack Query.
 * O realtime invalida `opsKeys.commandCenter()` — alertas aparecem/somem sem polling dedicado.
 */
export function useOperationalAlerts(
  data: OperationalCommandCenterSnapshot | undefined,
): OperationalAlertsBundle {
  return useMemo(() => {
    if (!data) {
      return {
        alerts: [],
        counts: { critical: 0, warning: 0, info: 0 },
        topSeverity: null,
        hasAlerts: false,
      };
    }
    const alerts = evaluateOperationalAlerts(data);
    const counts = countBySeverity(alerts);
    return {
      alerts,
      counts,
      topSeverity: topSeverityFrom(counts),
      hasAlerts: alerts.length > 0,
    };
  }, [data]);
}
