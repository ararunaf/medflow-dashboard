/**
 * ContractRuleProposal — saída do Contract Knowledge Agent (F2-S2).
 *
 * Não é um ContractRule pronto para produção: falta o portão de revisão
 * humana (F2-S3) que aprova/edita/rejeita antes de virar uma
 * ContractRegistryVersion real (ver contract-rule.ts). Por isso campos que
 * num ContractRule têm valor fechado (guideType, severity) aqui ficam como
 * sugestão livre do modelo — o revisor decide o valor final — e
 * sourceChunkIds/citationExcerpt existem para o revisor conferir a citação
 * contra o texto real do contrato antes de aprovar.
 */

export const CONTRACT_RULE_CATEGORIES = [
  "cobertura",
  "preco",
  "pre_autorizacao",
  "prazo",
  "campo_obrigatorio",
] as const;

export type ContractRuleCategory = (typeof CONTRACT_RULE_CATEGORIES)[number];

export type ContractRuleProposal = {
  category: ContractRuleCategory;
  description: string;
  justification: string;
  /** Cabeçalho de cláusula de onde veio a citação (herdado do chunk-fonte quando o modelo não informa). */
  citationHeading: string | null;
  /** Cópia literal (verbatim) de um trecho do contrato — nunca paráfrase do modelo. */
  citationExcerpt: string;
  /** ids dos chunks de knowledge_embeddings que sustentam esta proposta. */
  sourceChunkIds: string[];
  /** 0–100, confiança do modelo na extração. */
  confidence: number;
  /** Modelo que gerou a proposta (ex.: gpt-4o-mini) — rastreabilidade para revisão/auditoria. */
  extractionModel: string;
  suggestedGuideType?: string;
  suggestedProcedureType?: string;
  suggestedSeverity?: string;
};
