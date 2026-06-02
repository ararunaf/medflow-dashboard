import type { OperationalPolicyFinding } from "./types";

/**
 * Consolida narrativa de governança a partir de achados determinísticos (explainável, auditável).
 */
export function buildGovernanceNarrative(findings: OperationalPolicyFinding[]): string {
  if (findings.length === 0) {
    return "Nenhum padrão crítico detectado na amostra limitada — continue coletando memória operacional e feedback supervisionado para enriquecer análises futuras.";
  }
  const ordered = [...findings].sort((a, b) => {
    const rank = (s: OperationalPolicyFinding["severity"]) =>
      s === "critical" ? 0 : s === "warning" ? 1 : 2;
    return rank(a.severity) - rank(b.severity);
  });
  const head = ordered[0];
  const tail = ordered.length > 1 ? ` +${ordered.length - 1} achado(s) complementar(es).` : "";
  return `${head.headline} (${head.severity}) lidera o recorte atual.${tail} Todas as recomendações permanecem sob revisão humana explícita.`;
}
