/** CSP básico para produção — restritivo sem quebrar Supabase/fonts. */
export function buildContentSecurityPolicy(isProduction: boolean): string {
  if (!isProduction) {
    return "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src * data: blob:;";
  }
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function securityHeaders(isProduction: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "off",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": buildContentSecurityPolicy(isProduction),
  };
  if (isProduction) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }
  return headers;
}

/** Aplica headers de segurança a um objeto Headers existente. */
export function applySecurityHeadersTo(headers: Headers, isProduction: boolean): void {
  for (const [key, value] of Object.entries(securityHeaders(isProduction))) {
    headers.set(key, value);
  }
}
