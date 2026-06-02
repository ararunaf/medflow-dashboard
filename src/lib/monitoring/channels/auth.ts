import type { SecurityAuditInput } from "@/lib/security/security-audit-types";
import { emitMonitor } from "../emit";
import { messageFromError, normalizeMonitorError } from "../normalize";
import type { MonitorLogOptions } from "../types";

export function logAuth(event: string, options: MonitorLogOptions = {}): void {
  const { level = "warn", err, message, metadata } = options;
  emitMonitor({
    channel: "auth",
    level,
    event,
    message: message ?? messageFromError(err, event),
    error: normalizeMonitorError(err),
    metadata,
  });
}

/** Emite log de auth e persiste auditoria de segurança (server-only, best-effort). */
export async function logAuthAndAudit(input: SecurityAuditInput): Promise<void> {
  const level =
    input.outcome === "error" || input.outcome === "failure" ? "error" : "warn";

  logAuth(input.eventType, {
    level,
    message: input.message,
    metadata: {
      category: input.category,
      outcome: input.outcome,
      tenant_id: input.tenantId ?? null,
      profile_id: input.profileId ?? null,
      ...input.metadata,
    },
  });

  if (typeof window !== "undefined") return;

  const { writeSecurityAudit } = await import("@/lib/server/security-audit-writer");
  await writeSecurityAudit(input);
}
