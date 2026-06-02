/** Mapeia rota atual para módulo de adoção/analytics — leve, sem PII. */
export function moduleFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  const seg = pathname.split("/").filter(Boolean)[0] ?? "unknown";
  const map: Record<string, string> = {
    piloto: "piloto",
    ajuda: "ajuda",
    operacao: "operacao",
    executivo: "executivo",
    financeiro: "financeiro",
    escalas: "escalas",
    plantoes: "plantoes",
    tiss: "tiss",
    instituicao: "instituicao",
    central: "central",
    perfil: "perfil",
  };
  return map[seg] ?? seg;
}
