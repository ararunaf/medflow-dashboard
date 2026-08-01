import type { AuthContext } from "./types";

export type RouteGuardRedirect = "/login" | "/";

export type RouteGuardResult =
  | { allowed: true }
  | { allowed: false; redirectTo: RouteGuardRedirect };

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/site" ||
    pathname.startsWith("/site/")
  );
}

/** Espelha as regras de `__root.tsx` beforeLoad — testável sem router. */
export function evaluateRouteGuard(pathname: string, auth: AuthContext): RouteGuardResult {
  const isPublic = isPublicPath(pathname);

  if (!auth.user && !isPublic) {
    return { allowed: false, redirectTo: "/login" };
  }
  if (auth.user && !auth.profile && !isPublic) {
    return { allowed: false, redirectTo: "/login" };
  }
  if (auth.user && auth.profile && (pathname === "/login" || pathname === "/login/esqueci-senha")) {
    return { allowed: false, redirectTo: "/" };
  }

  return { allowed: true };
}
