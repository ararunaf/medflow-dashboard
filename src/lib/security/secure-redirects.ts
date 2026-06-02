import { getInstitutionalDomain } from "@/lib/env/startup-checks";

/** Evita open redirect — apenas paths internos ou domínio institucional. */
export function isSafeRedirectTarget(target: string, origin?: string): boolean {
  const trimmed = target.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    const institutional = getInstitutionalDomain();
    if (institutional) {
      const allowed = new URL(
        institutional.startsWith("http") ? institutional : `https://${institutional}`,
      );
      if (url.origin === allowed.origin) return true;
    }
    if (origin) {
      const o = new URL(origin);
      if (url.origin === o.origin) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function sanitizePostLoginPath(path: string | undefined): string {
  if (!path || !isSafeRedirectTarget(path)) return "/";
  return path;
}
