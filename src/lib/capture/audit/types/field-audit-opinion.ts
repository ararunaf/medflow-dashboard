/**
 * FieldAuditOpinion — saída do Field Audit Agent (F2-S4).
 *
 * Substitui a aprovação binária vazia por um parecer citável por campo,
 * cruzando três fontes reais: regra estrutural TISS/ANS (AuditFinding),
 * regra aprendida do contrato quando aplicável (EnrichedAuditFinding) e
 * histórico de risco de glosa (FindingRiskScore). O agente NUNCA decide
 * sozinho — verdict espelha a severidade já calculada pelos motores
 * determinísticos; o agente só explica e prioriza, nunca inventa.
 */
import type { AuditRuleCategory } from "./audit-rule";

export const FIELD_AUDIT_VERDICTS = ["ok", "atencao", "critico"] as const;
export type FieldAuditVerdict = (typeof FIELD_AUDIT_VERDICTS)[number];

export type FieldAuditOpinion = {
  field: string;
  category: AuditRuleCategory;
  verdict: FieldAuditVerdict;
  /** 0-100 — confiança do modelo na síntese (não na existência do problema, que já é determinística). */
  confidence: number;
  explanation: string;
  /** ruleIds estruturais que sustentam este parecer — sempre >= 1. */
  sourceRuleIds: string[];
  /** Citação contratual (businessReference) quando há regra de contrato aplicada. */
  contractCitation: string | null;
  /** Probabilidade de glosa estimada (0-1) quando há risco calculado para este campo. */
  denialProbability: number | null;
};
