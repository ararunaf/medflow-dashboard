import type {
  SecurityAuditEventType,
  SecurityAuditInput,
} from "@/lib/security/security-audit-types";
import { emitMonitor } from "../emit";
import { messageFromError, normalizeMonitorError } from "../normalize";
import type { MonitorLogOptions } from "../types";

export type SsrMonitorEvent = Extract<
  SecurityAuditEventType,
  "ssr_catastrophic" | "ssr_middleware_error" | "ssr_worker_uncaught"
>;

export function logSsr(event: SsrMonitorEvent, options: MonitorLogOptions = {}): void {
  const { level = "error", err, message, metadata } = options;
  emitMonitor({
    channel: "ssr",
    level,
    event,
    message: message ?? messageFromError(err, event),
    error: normalizeMonitorError(err),
    metadata,
  });
}

/** Emite log SSR e persiste em security_audit_logs (server-only, best-effort). */
export async function logSsrAndAudit(
  event: SsrMonitorEvent,
  options: MonitorLogOptions & Pick<SecurityAuditInput, "metadata" | "message"> = {},
): Promise<void> {
  logSsr(event, options);

  if (typeof window !== "undefined") return;

  const { writeSecurityAudit } = await import("@/lib/server/security-audit-writer");
  void writeSecurityAudit({
    category: "ssr",
    eventType: event,
    outcome: "error",
    message: options.message ?? messageFromError(options.err, event),
    metadata: options.metadata,
  });
}
