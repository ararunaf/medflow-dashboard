import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useRecordPilotAdoptionMutation } from "@/hooks/use-pilot-execution";
import {
  adoptionEventKey,
  shouldSkipAdoptionDedupe,
} from "@/lib/services/pilot-execution/operational-adoption-service";
import { moduleFromPath } from "@/lib/pilot-execution/module-from-path";

type Props = { enabled: boolean };

/**
 * Telemetria leve de adoção por rota — dedupe 60s, fire-and-forget.
 */
export function PilotAdoptionTracker({ enabled }: Props) {
  const location = useLocation();
  const record = useRecordPilotAdoptionMutation();
  const lastRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const pathname = location.pathname;
    if (pathname === "/login") return;

    const module = moduleFromPath(pathname);
    const eventType =
      pathname.includes("dashboard") || pathname === "/executivo"
        ? ("dashboard_view" as const)
        : pathname.includes("fechamento") || pathname.includes("conciliacao")
          ? ("financial_workflow" as const)
          : ("module_access" as const);

    const key = adoptionEventKey(eventType, module);
    if (shouldSkipAdoptionDedupe(lastRef.current?.key ?? null, key, lastRef.current?.at ?? null)) {
      return;
    }
    lastRef.current = { key, at: Date.now() };

    void record
      .mutateAsync({ eventType, module, metadata: { route: pathname } })
      .catch(() => undefined);
  }, [enabled, location.pathname, record]);

  useEffect(() => {
    if (!enabled) return;
    void record.mutateAsync({ eventType: "login", module: "session" }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, [enabled]);

  return null;
}
