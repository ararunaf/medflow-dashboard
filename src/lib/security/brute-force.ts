import { checkRateLimit, clearRateLimit, rateLimitKey } from "./rate-limit";
import { sanitizeEmail } from "./sanitize-input";

const FAILURE_MAX = 5;
const FAILURE_WINDOW_MS = 15 * 60_000;
const LOCKOUT_MS = 15 * 60_000;

const failureBuckets = new Map<string, { count: number; resetAt: number }>();
const lockouts = new Map<string, number>();

function loginIdentityKey(ip: string, email: string): string {
  const normalized = sanitizeEmail(email);
  return rateLimitKey(ip, `login:${normalized}`);
}

export type LoginGateResult = {
  allowed: boolean;
  retryAfterMs?: number;
  reason?: "rate_limit" | "brute_force" | "invalid_email";
};

/** Verifica rate limit por IP/e-mail e lockout por tentativas falhas. */
export function evaluateLoginGate(ip: string, email: string): LoginGateResult {
  const normalized = sanitizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { allowed: false, reason: "invalid_email" };
  }

  const identity = loginIdentityKey(ip, normalized);
  const lockedUntil = lockouts.get(identity);
  const now = Date.now();
  if (lockedUntil != null && now < lockedUntil) {
    return {
      allowed: false,
      retryAfterMs: lockedUntil - now,
      reason: "brute_force",
    };
  }
  if (lockedUntil != null && now >= lockedUntil) {
    lockouts.delete(identity);
    clearRateLimit(`${identity}:fail`);
  }

  const ipRl = checkRateLimit(rateLimitKey(ip, "login_attempt"), {
    max: 25,
    windowMs: 60_000,
  });
  if (!ipRl.allowed) {
    return { allowed: false, retryAfterMs: ipRl.retryAfterMs, reason: "rate_limit" };
  }

  const emailRl = checkRateLimit(rateLimitKey(ip, `login_email:${normalized}`), {
    max: 8,
    windowMs: 60_000,
  });
  if (!emailRl.allowed) {
    return { allowed: false, retryAfterMs: emailRl.retryAfterMs, reason: "rate_limit" };
  }

  return { allowed: true };
}

/** Registra falha de login; após limite, aplica lockout temporário. */
export function recordLoginFailure(ip: string, email: string): void {
  const identity = loginIdentityKey(ip, sanitizeEmail(email));
  const now = Date.now();
  const failKey = `${identity}:fail`;
  const entry = failureBuckets.get(failKey);

  if (!entry || now >= entry.resetAt) {
    failureBuckets.set(failKey, { count: 1, resetAt: now + FAILURE_WINDOW_MS });
    if (1 >= FAILURE_MAX) {
      lockouts.set(identity, now + LOCKOUT_MS);
    }
    return;
  }

  entry.count += 1;
  if (entry.count >= FAILURE_MAX) {
    lockouts.set(identity, now + LOCKOUT_MS);
  }
}

/** Limpa contadores de falha após login bem-sucedido. */
export function recordLoginSuccess(ip: string, email: string): void {
  const identity = loginIdentityKey(ip, sanitizeEmail(email));
  lockouts.delete(identity);
  failureBuckets.delete(`${identity}:fail`);
  clearRateLimit(`${identity}:fail`);
}
