import type { OperationalRouteTarget } from "./types";

/** Adapta destino operacional para props de `Link` (navegação contextual tipada). */
export function operationalLinkProps(target: OperationalRouteTarget): {
  to: OperationalRouteTarget["to"];
  search?: Record<string, string | undefined>;
} {
  if (target.to === "/perfil") {
    return { to: "/perfil" };
  }
  return { to: target.to, search: target.search };
}

export function operationalHrefKey(target: OperationalRouteTarget): string {
  if (target.to === "/perfil") return "/perfil";
  return `${target.to}:${JSON.stringify(target.search ?? {})}`;
}
