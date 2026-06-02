/** Extrai IP do cliente a partir do Request (Cloudflare / proxy). */
export function getClientIpFromRequest(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf?.trim()) return cf.trim();

  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("X-Real-IP");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}
