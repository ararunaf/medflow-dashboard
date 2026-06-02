/**
 * Server functions públicas para rate limit e proteção brute-force no login.
 * Chamadas pelo cliente antes/depois de signInWithPassword (Supabase).
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import {
  evaluateLoginGate,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/security/brute-force";
import { isValidEmailFormat, sanitizeEmail } from "@/lib/security/sanitize-input";
import { ValidationError } from "@/lib/domain/operations/errors";
import { requireObject, requireString } from "@/lib/server/fn-helpers";

export type LoginGateResponse = {
  allowed: boolean;
  retryAfterSec?: number;
  message?: string;
};

export type LoginOutcomeReason =
  | "success"
  | "supabase_auth_error"
  | "no_user"
  | "no_profile"
  | "tenant_mismatch"
  | "unknown_error";

function blockedMessage(retryAfterSec?: number): string {
  if (retryAfterSec != null && retryAfterSec > 0) {
    const min = Math.max(1, Math.ceil(retryAfterSec / 60));
    return `Muitas tentativas. Aguarde ${min} minuto(s) e tente novamente.`;
  }
  return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
}

function resolveClientIp(): string {
  return getRequestIP({ xForwardedFor: true }) ?? "unknown";
}

function gateReasonToEventType(
  reason: "rate_limit" | "brute_force" | "invalid_email" | undefined,
): "login_gate_blocked" {
  void reason;
  return "login_gate_blocked";
}

export const checkLoginGateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const email = sanitizeEmail(requireString(o.email, "email"));
    if (!isValidEmailFormat(email)) {
      throw new ValidationError("E-mail inválido.", { field: "email" });
    }
    const tenantId = typeof o.tenantId === "string" ? o.tenantId : undefined;
    const tenantSlug = typeof o.tenantSlug === "string" ? o.tenantSlug.slice(0, 64) : undefined;
    return { email, tenantId, tenantSlug };
  })
  .handler(async ({ data }): Promise<LoginGateResponse> => {
    const { writeSecurityAudit } = await import("@/lib/server/security-audit-writer");
    const ip = resolveClientIp();
    const gate = evaluateLoginGate(ip, data.email);
    if (gate.allowed) {
      return { allowed: true };
    }
    const retryAfterSec = gate.retryAfterMs ? Math.ceil(gate.retryAfterMs / 1000) : undefined;

    void writeSecurityAudit({
      category: "login_attempt",
      eventType: gateReasonToEventType(gate.reason),
      outcome: "blocked",
      email: data.email,
      ip,
      tenantId: data.tenantId ?? null,
      message: gate.reason ?? "login_gate",
      metadata: {
        gate_reason: gate.reason ?? "unknown",
        tenant_slug: data.tenantSlug,
        retry_after_sec: retryAfterSec,
      },
    });

    if (gate.reason === "invalid_email") {
      return { allowed: false, message: "Informe um e-mail válido." };
    }
    return {
      allowed: false,
      retryAfterSec,
      message: blockedMessage(retryAfterSec),
    };
  });

export const recordLoginOutcomeFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const email = sanitizeEmail(requireString(o.email, "email"));
    const success = o.success === true;
    const reason =
      typeof o.reason === "string" ? (o.reason as LoginOutcomeReason) : undefined;
    const tenantId = typeof o.tenantId === "string" ? o.tenantId : undefined;
    const tenantSlug = typeof o.tenantSlug === "string" ? o.tenantSlug.slice(0, 64) : undefined;
    const profileId = typeof o.profileId === "string" ? o.profileId : undefined;
    return { email, success, reason, tenantId, tenantSlug, profileId };
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { writeSecurityAudit } = await import("@/lib/server/security-audit-writer");
    const ip = resolveClientIp();
    if (data.success) {
      recordLoginSuccess(ip, data.email);
      await writeSecurityAudit({
        category: "auth",
        eventType: "sign_in_success",
        outcome: "success",
        email: data.email,
        ip,
        tenantId: data.tenantId ?? null,
        profileId: data.profileId ?? null,
        metadata: { tenant_slug: data.tenantSlug },
      });
    } else {
      recordLoginFailure(ip, data.email);
      const reason = data.reason ?? "unknown_error";
      const isTenantMismatch = reason === "tenant_mismatch";
      await writeSecurityAudit({
        category: isTenantMismatch ? "tenant_access" : "login_attempt",
        eventType: isTenantMismatch
          ? "tenant_mismatch"
          : reason === "no_profile"
            ? "no_profile"
            : "sign_in_failure",
        outcome: "failure",
        email: data.email,
        ip,
        tenantId: data.tenantId ?? null,
        profileId: data.profileId ?? null,
        message: reason,
        metadata: { tenant_slug: data.tenantSlug, failure_reason: reason },
      });
    }
    return { ok: true };
  });
