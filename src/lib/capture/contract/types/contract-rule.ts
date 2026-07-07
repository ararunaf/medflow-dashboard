/**
 * Modelo ContractRule — Motor de Inteligência Contratual.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import type { TissGuideType } from "../../parser/types/tiss-guide-type";
import type { AuditSeverity } from "../../audit/types/audit-rule";

export type ContractRule = {
  ruleId: string;
  operator: string;
  contract: string;
  guideType: TissGuideType | "*";
  procedureType: string | "*";
  priority: number;
  description: string;
  justification: string;
  legalReference: string;
  businessReference: string;
  severity: AuditSeverity;
  /** Regras de auditoria preventiva associadas (ex.: OPR-001, PRC-001) */
  auditRuleIds?: string[];
  /** Campos de auditoria associados */
  auditFields?: string[];
  /** Categorias de auditoria associadas */
  auditCategories?: string[];
  /** Impacto financeiro estimado em centavos (opcional) */
  estimatedFinancialImpactCents?: number;
  /** Risco base de glosa 0–100 */
  baseDenialRisk?: number;
};

export type ContractRegistryVersion = {
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  tenantId?: string;
  operator: string;
  contract: string;
  rules: ContractRule[];
};

export type ContractKnowledgeRegistry = {
  registryVersion: string;
  updatedAt: string;
  versions: ContractRegistryVersion[];
};
