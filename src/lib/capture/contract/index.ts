/**
 * Motor de Inteligência Contratual — exports públicos.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
export type {
  ContractRule,
  ContractKnowledgeRegistry,
  ContractRegistryVersion,
} from "./types/contract-rule";
export type {
  OperatorResolution,
  ContractResolution,
  AttendanceTypeResolution,
  ContractResolutionContext,
} from "./types/contract-context";
export type { FindingEnrichment, EnrichedAuditFinding } from "./types/enriched-finding";
export type {
  ContractIntelligenceReport,
  ContractIntelligenceSummary,
  ContractIntelligenceSummaryMeta,
} from "./types/contract-intelligence-report";

export {
  ContractKnowledgeEngine,
  CONTRACT_ENGINE_VERSION,
  getDefaultContractKnowledgeEngine,
  type ContractKnowledgeEngineOptions,
} from "./engine/contract-knowledge-engine";

export {
  enrichFinding,
  enrichFindings,
  countEnriched,
  computeAverageDenialRisk,
  computeTotalFinancialImpact,
} from "./engine/finding-enricher";

export {
  ContractIntelligenceEngine,
  getDefaultContractIntelligenceEngine,
  enrichAuditFindings,
  type ContractIntelligenceOptions,
  type ContractIntelligenceResult,
} from "./engine/contract-intelligence-engine";

export {
  ContractKnowledgeRegistryStore,
  getDefaultContractRegistry,
  DEFAULT_CONTRACT_REGISTRY,
  DEFAULT_CONTRACT_RULES,
  CONTRACT_RULE_COUNT,
} from "./registry/contract-knowledge-registry";

export {
  CONTRACT_INTELLIGENCE_FILENAME,
  buildContractIntelligenceStoragePath,
  persistContractIntelligenceReport,
  loadContractIntelligenceReport,
  getContractIntelligenceSignedUrl,
  buildContractIntelligenceSummaryFromResult,
} from "./infrastructure/contract-intelligence-storage";

export {
  ContractIntelligenceService,
  getDefaultContractIntelligenceService,
  runCaptureContractIntelligence,
  getCaptureContractIntelligenceReport,
  type RunContractIntelligenceResult,
} from "./services/contract-intelligence-service";
