const BLOCKED_SCHEMES = /^(javascript|data|vbscript):/i;

export function isSafeExternalHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || BLOCKED_SCHEMES.test(trimmed)) return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

export function externalLinkProps(href: string): { href: string; target?: string; rel?: string } {
  if (!isSafeExternalHref(href)) {
    return { href: "#" };
  }
  if (href.startsWith("/") || href.startsWith("#")) {
    return { href };
  }
  return { href, target: "_blank", rel: "noopener noreferrer" };
}
