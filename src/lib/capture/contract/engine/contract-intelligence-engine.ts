/**
 * ContractIntelligenceEngine — orquestra resolução + enriquecimento de findings.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import type { AuditFinding } from "../../audit/types/audit-finding";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import {
  ContractKnowledgeEngine,
  CONTRACT_ENGINE_VERSION,
  getDefaultContractKnowledgeEngine,
  type ContractKnowledgeEngineOptions,
} from "./contract-knowledge-engine";
import {
  computeAverageDenialRisk,
  computeTotalFinancialImpact,
  countEnriched,
  enrichFindings,
} from "./finding-enricher";
import type { ContractIntelligenceReport } from "../types/contract-intelligence-report";

export type ContractIntelligenceOptions = ContractKnowledgeEngineOptions & {
  sessionId?: string;
};

export type ContractIntelligenceResult = {
  report: ContractIntelligenceReport;
};

export class ContractIntelligenceEngine {
  private readonly knowledgeEngine: ContractKnowledgeEngine;

  constructor(knowledgeEngine?: ContractKnowledgeEngine) {
    this.knowledgeEngine = knowledgeEngine ?? getDefaultContractKnowledgeEngine();
  }

  enrich(
    guide: StructuredGuide,
    findings: AuditFinding[],
    options: ContractIntelligenceOptions = {},
  ): ContractIntelligenceResult {
    const context = this.knowledgeEngine.buildContext(guide, options);
    const enrichedFindings = enrichFindings(findings, context);

    const report: ContractIntelligenceReport = {
      version: "contract_intelligence_v1",
      sessionId: options.sessionId,
      guideType: guide.guideType,
      enrichedAt: new Date().toISOString(),
      engineVersion: CONTRACT_ENGINE_VERSION,
      context,
      appliedRules: context.applicableRules,
      findings: enrichedFindings,
      summary: {
        totalFindings: findings.length,
        enrichedCount: countEnriched(enrichedFindings),
        appliedRulesCount: context.applicableRules.length,
        totalEstimatedFinancialImpactCents: computeTotalFinancialImpact(enrichedFindings),
        averageDenialRisk: computeAverageDenialRisk(enrichedFindings),
        operatorResolved: context.operator.resolved,
        contractResolved: context.contract.resolved,
      },
    };

    return { report };
  }
}

let defaultEngine: ContractIntelligenceEngine | null = null;

export function getDefaultContractIntelligenceEngine(): ContractIntelligenceEngine {
  if (!defaultEngine) defaultEngine = new ContractIntelligenceEngine();
  return defaultEngine;
}

export function enrichAuditFindings(
  guide: StructuredGuide,
  findings: AuditFinding[],
  options?: ContractIntelligenceOptions,
): ContractIntelligenceResult {
  return getDefaultContractIntelligenceEngine().enrich(guide, findings, options);
}
