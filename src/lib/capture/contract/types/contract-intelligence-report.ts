/**
 * Relatório de Inteligência Contratual — persistido como contract_intelligence_report.json.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import type { TissGuideType } from "../../parser/types/tiss-guide-type";
import type { ContractResolutionContext } from "./contract-context";
import type { ContractRule } from "./contract-rule";
import type { EnrichedAuditFinding } from "./enriched-finding";

export type ContractIntelligenceSummary = {
  totalFindings: number;
  enrichedCount: number;
  appliedRulesCount: number;
  totalEstimatedFinancialImpactCents: number;
  averageDenialRisk: number;
  operatorResolved: boolean;
  contractResolved: boolean;
};

export type ContractIntelligenceReport = {
  version: "contract_intelligence_v1";
  sessionId?: string;
  guideType: TissGuideType;
  enrichedAt: string;
  engineVersion: string;
  context: ContractResolutionContext;
  appliedRules: ContractRule[];
  findings: EnrichedAuditFinding[];
  summary: ContractIntelligenceSummary;
};

export type ContractIntelligenceSummaryMeta = {
  status: "pending" | "completed" | "failed";
  enrichedCount?: number;
  appliedRulesCount?: number;
  totalEstimatedFinancialImpactCents?: number;
  averageDenialRisk?: number;
  operatorResolved?: boolean;
  contractResolved?: boolean;
  storagePath?: string;
  enrichmentDurationMs?: number;
  error?: string;
};
