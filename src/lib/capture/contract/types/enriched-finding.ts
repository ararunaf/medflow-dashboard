/**
 * Enriquecimento de AuditFinding — sem alterar a regra original.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import type { AuditFinding } from "../../audit/types/audit-finding";

export type FindingEnrichment = {
  expandedJustification: string;
  contractualBasis: string;
  tissBasis: string;
  tussBasis: string;
  expectedImpact: string;
  estimatedDenialRisk: number;
  observations: string;
  estimatedFinancialImpactCents?: number;
};

export type EnrichedAuditFinding = {
  finding: AuditFinding;
  enrichment: FindingEnrichment | null;
  matchedRuleIds: string[];
};
