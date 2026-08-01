/**
 * Ports — AI Auditor Foundation (EPC-18).
 */
export type { AIAuditorPort } from "./ai-auditor-port";

export type {
  AIAuditorCapabilities,
  AIAuditorConfigurationValidation,
  AIAuditorHealth,
  AIAuditorProviderId,
  AIAuditorProviderInfo,
  AIAuditorProviderOptions,
  AIProviderId,
  AuditConfigurationReference,
  AuditContractReference,
  AuditDocumentReference,
  AuditEvidence,
  AuditExplanation,
  AuditFinding,
  AuditFindingCategory,
  AuditFindingSeverity,
  AuditMetadataReference,
  AuditProcessingReference,
  AuditRelatedRuleReference,
  AuditRequest,
  AuditResult,
  AuditRulePackReference,
  AuditTag,
  AuditWorkflowReference,
  ConfidenceLevel,
  DeterministicAuditOutcome,
} from "./types";

export {
  CONFIDENCE_LEVELS,
  CONFIDENCE_LEVEL_CATALOG,
  getConfidenceLevel,
  isKnownConfidenceLevel,
  listConfidenceLevels,
  type ConfidenceLevelDescriptor,
} from "./confidence";

export {
  createAuditId,
  createFindingId,
  resetAuditIdSequence,
  resetFindingIdSequence,
} from "./identity";
