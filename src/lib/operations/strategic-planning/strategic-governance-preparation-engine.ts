import type { OperationalPolicyIntelligenceLayerSummary } from "@/lib/services/operations/operational-policy-intelligence-service";
import type { GovernancePreparednessInsight } from "./types";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/**
 * Prepara insights de governança a partir da policy intelligence atual (sem auto-governança).
 */
export function buildGovernancePreparednessInsight(input: {
  policyLayer: OperationalPolicyIntelligenceLayerSummary;
}): GovernancePreparednessInsight {
  const { criticalFindings, warningFindings, infoFindings } =
    input.policyLayer.effectivenessSummary;
  const denom = Math.max(1, criticalFindings + warningFindings + infoFindings);
  const stress = (criticalFindings * 0.55 + warningFindings * 0.28 + infoFindings * 0.08) / denom;
  const readinessScore = clamp01(1 - Math.min(1, stress * 1.4));

  const narrative: string[] = [];
  if (input.policyLayer.cycle?.governanceNarrative) {
    narrative.push(input.policyLayer.cycle.governanceNarrative.slice(0, 400));
  } else {
    narrative.push(
      "Nenhum ciclo de policy intelligence persistido ainda — executar análise supervisionada quando conveniente.",
    );
  }
  if (criticalFindings > 0)
    narrative.push(
      `${criticalFindings} achado(s) crítico(s) exigem revisão humana antes de expandir planos operacionais.`,
    );

  const boundaries = [
    "Planejamento não executa mutações nem altera políticas — apenas prepara readiness e narrativas explicáveis.",
    "Promoção de estados de ciclo exige gestor operacional autenticado (RBAC + RLS).",
    "Bundles persistidos são compactos: sem reprocessar janelas históricas completas nesta camada.",
  ];

  return {
    readinessScore,
    narrative: narrative.slice(0, 4),
    policyCycleRef: input.policyLayer.cycle?.id ?? null,
    boundaries,
  };
}
