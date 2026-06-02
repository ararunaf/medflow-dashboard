import { useEffect } from "react";
import { OPERATIONAL_HEARTBEAT_INTERVAL_MS } from "@/lib/operational/constants";
import { recordOperationalHeartbeatFn } from "@/lib/operational-observability/api/operational-observability-server";

type Props = { enabled: boolean };

/**
 * Heartbeat leve para métricas de saúde — não bloqueia a UI; falhas são ignoradas.
 */
export function OperationalHeartbeat({ enabled }: Props) {
  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      void recordOperationalHeartbeatFn({ data: {} }).catch(() => undefined);
    };

    run();
    const id = window.setInterval(run, OPERATIONAL_HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);

  return null;
}
