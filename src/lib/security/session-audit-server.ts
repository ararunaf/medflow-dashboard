/**
 * Server function para eventos de sessao reportados pelo cliente (AuthSync).
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import type { SecurityAuditEventType } from "@/lib/security/security-audit-types";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { requireObject, requireString } from "@/lib/server/fn-helpers";

const ALLOWED_SESSION_EVENTS = new Set<SecurityAuditEventType>([
  "session_expired",
  "token_refresh_failed",
  "sign_out",
]);

function resolveClientIp(): string {
  return getRequestIP({ xForwardedFor: true }) ?? "unknown";
}

export const reportSessionAuditFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const eventType = requireString(o.eventType, "eventType") as SecurityAuditEventType;
    if (!ALLOWED_SESSION_EVENTS.has(eventType)) {
      throw new Error("eventType inválido.");
    }
    const reason =
      typeof o.reason === "string" && o.reason.length > 0 ? o.reason.slice(0, 128) : undefined;
    return { eventType, reason };
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { writeSecurityAudit } = await import("@/lib/server/security-audit-writer");
    const ip = resolveClientIp();
    const rl = checkRateLimit(rateLimitKey(ip, "session_audit"), {
      max: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return { ok: true };
    }

    const outcome =
      data.eventType === "token_refresh_failed" ? ("error" as const) : ("failure" as const);

    await writeSecurityAudit({
      category: "session",
      eventType: data.eventType,
      outcome,
      ip,
      message: data.reason,
      metadata: { source: "auth_sync" },
    });

    return { ok: true };
  });
