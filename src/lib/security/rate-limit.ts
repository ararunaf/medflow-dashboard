/** Rate limiting leve em memória (por instância Worker). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number } = { max: 30, windowMs: 60_000 },
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true };
  }
  if (entry.count >= opts.max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true };
}

export function rateLimitKey(userId: string, action: string): string {
  return `${userId}:${action}`;
}

/** Remove bucket (ex.: após login bem-sucedido). */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
