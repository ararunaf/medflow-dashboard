/**
 * Priorização operacional de guias — MEDICFLOW-PROCESSING-CENTER-01.
 *
 * Ordena por: risco de glosa, impacto financeiro, prioridade contratual,
 * tempo de espera e operadora.
 */
import type { RiskLevel } from "../risk/types/risk-assessment";
import type { ProcessingGuideItem } from "./types";

export const PRIORITY_WEIGHTS = {
  riskScore: 0.35,
  financialImpact: 0.3,
  contractualPriority: 0.15,
  waitTime: 0.15,
  operator: 0.05,
} as const;

const RISK_LEVEL_SCORE: Record<RiskLevel, number> = {
  Crítico: 100,
  Alto: 75,
  Médio: 50,
  Baixo: 25,
};

const MAX_FINANCIAL_IMPACT = 500_000;
const MAX_WAIT_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CONTRACT_PRIORITY = 100;

export function normalizeRiskScore(riskScore: number | null, riskLevel: RiskLevel | null): number {
  if (riskScore != null && riskScore > 0) {
    return Math.min(100, riskScore) / 100;
  }
  if (riskLevel) {
    return RISK_LEVEL_SCORE[riskLevel] / 100;
  }
  return 0;
}

export function normalizeFinancialImpact(impact: number): number {
  if (impact <= 0) return 0;
  return Math.min(1, impact / MAX_FINANCIAL_IMPACT);
}

export function normalizeWaitTime(waitTimeMs: number): number {
  if (waitTimeMs <= 0) return 0;
  return Math.min(1, waitTimeMs / MAX_WAIT_MS);
}

export function normalizeContractualPriority(priority: number): number {
  if (priority <= 0) return 0;
  return Math.min(1, priority / MAX_CONTRACT_PRIORITY);
}

/** Hash estável 0–1 para desempate por operadora (ordem alfabética favorecida). */
export function operatorTieBreaker(operatorName: string | null): number {
  if (!operatorName) return 0;
  let hash = 0;
  for (let i = 0; i < operatorName.length; i++) {
    hash = (hash + operatorName.charCodeAt(i) * (i + 1)) % 1000;
  }
  return hash / 1000;
}

export function computePriorityScore(input: {
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  estimatedFinancialImpact: number;
  contractualPriority: number;
  waitTimeMs: number;
  operatorName: string | null;
}): number {
  const risk = normalizeRiskScore(input.riskScore, input.riskLevel);
  const financial = normalizeFinancialImpact(input.estimatedFinancialImpact);
  const contractual = normalizeContractualPriority(input.contractualPriority);
  const wait = normalizeWaitTime(input.waitTimeMs);
  const operator = operatorTieBreaker(input.operatorName);

  return (
    risk * PRIORITY_WEIGHTS.riskScore +
    financial * PRIORITY_WEIGHTS.financialImpact +
    contractual * PRIORITY_WEIGHTS.contractualPriority +
    wait * PRIORITY_WEIGHTS.waitTime +
    operator * PRIORITY_WEIGHTS.operator
  );
}

export function sortByPriority(items: ProcessingGuideItem[]): ProcessingGuideItem[] {
  return [...items].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (b.waitTimeMs !== a.waitTimeMs) {
      return b.waitTimeMs - a.waitTimeMs;
    }
    const opA = a.operatorName ?? "";
    const opB = b.operatorName ?? "";
    return opA.localeCompare(opB, "pt-BR");
  });
}

export function isCriticalGuide(riskLevel: RiskLevel | null, riskScore: number | null): boolean {
  if (riskLevel === "Crítico") return true;
  if (riskScore != null && riskScore >= 80) return true;
  return false;
}
