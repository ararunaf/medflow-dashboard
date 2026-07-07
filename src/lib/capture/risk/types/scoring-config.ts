/**
 * Pesos configuráveis do Motor de Risco de Glosa.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01 — modelo determinístico heuristic_v1.
 */
import type { AuditRuleCategory, AuditSeverity } from "../../audit/types/audit-rule";
import type { TissGuideType } from "../../parser/types/tiss-guide-type";
import type { RiskLevel } from "./risk-assessment";

export type RiskScoringWeights = {
  findingSeverity: number;
  findingCount: number;
  contractRuleRisk: number;
  guideTypeRisk: number;
  operatorRisk: number;
  parserConfidence: number;
  ocrConfidence: number;
  learningObservational: number;
  blockingPenalty: number;
};

export const DEFAULT_RISK_SCORING_WEIGHTS: RiskScoringWeights = {
  findingSeverity: 1.0,
  findingCount: 0.12,
  contractRuleRisk: 0.3,
  guideTypeRisk: 0.08,
  operatorRisk: 0.06,
  parserConfidence: 0.15,
  ocrConfidence: 0.1,
  learningObservational: 0.05,
  blockingPenalty: 0.2,
};

export const SEVERITY_BASE_WEIGHTS: Record<AuditSeverity, number> = {
  critico: 40,
  alto: 20,
  medio: 8,
  baixo: 3,
};

export const CATEGORY_SCORE_CAPS: Partial<Record<AuditRuleCategory, number>> = {
  autorizacoes: 50,
  paciente: 40,
  operadora: 50,
  procedimentos: 30,
  diagnostico: 30,
  executante: 30,
  solicitante: 25,
  prestador: 25,
  datas: 25,
  assinaturas: 15,
};

export const COUNT_MULTIPLIERS: Array<{ maxCount: number; multiplier: number }> = [
  { maxCount: 1, multiplier: 1.0 },
  { maxCount: 2, multiplier: 1.25 },
  { maxCount: Infinity, multiplier: 1.5 },
];

export const RISK_LEVEL_THRESHOLDS: Array<{ min: number; level: RiskLevel }> = [
  { min: 70, level: "Crítico" },
  { min: 45, level: "Alto" },
  { min: 20, level: "Médio" },
  { min: 0, level: "Baixo" },
];

/** Risco base por tipo de guia — procedimentos complexos elevam exposição */
export const GUIDE_TYPE_BASE_RISK: Partial<Record<TissGuideType, number>> = {
  guia_sadt: 8,
  guia_honorario: 6,
  guia_consulta: 3,
  guia_resumo_internacao: 12,
  guia_tratamento_odontologico: 7,
  desconhecido: 10,
};

/** Ajuste por operadora não resolvida */
export const UNRESOLVED_OPERATOR_RISK = 12;

/** Confiança abaixo deste limiar adiciona risco proporcional */
export const CONFIDENCE_RISK_THRESHOLD = 0.75;

export function classifyRiskLevel(score: number): RiskLevel {
  for (const band of RISK_LEVEL_THRESHOLDS) {
    if (score >= band.min) return band.level;
  }
  return "Baixo";
}

export function countMultiplier(openFindings: number): number {
  for (const tier of COUNT_MULTIPLIERS) {
    if (openFindings <= tier.maxCount) return tier.multiplier;
  }
  return 1.5;
}
