import { useEffect, useRef } from "react";
import { appendOperationalTimelineObservationFn } from "@/lib/operations/api";
import type { OperationalAlert } from "@/lib/operations/alerts/types";

/**
 * Registra na timeline (audit) alertas críticos visíveis na central — uma vez por regra por sessão de montagem.
 * Somente `enabled` quando o usuário é gestor operacional (checado no call-site).
 */
export function useOperationalCriticalAlertsAudit(enabled: boolean, alerts: OperationalAlert[]) {
  const seen = useRef(new Set<string>());
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const signature = alerts.map((a) => `${a.id}:${a.severity}`).join("|");

  useEffect(() => {
    if (!enabled) return;
    const list = alertsRef.current;
    for (const a of list) {
      if (a.severity !== "critical") continue;
      if (seen.current.has(a.id)) continue;
      seen.current.add(a.id);
      void appendOperationalTimelineObservationFn({
        data: {
          eventType: "critical_alert_generated",
          entityId: a.id,
          description: a.title,
          metadata: { detail: a.detail },
        },
      }).catch(() => undefined);
    }
  }, [enabled, signature]);
}
