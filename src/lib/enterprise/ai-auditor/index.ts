/**
 * Enterprise AI Auditor Foundation — Ports & Adapters (EPC-18).
 *
 * Fluxo oficial:
 *   Application → AIAuditorPort → AIAuditorAdapter
 *     → AIAuditorStore → AIAuditorFactory → AIAuditorProvider
 *     → AI Orchestrator (EPC-16) → AI Provider Framework (EPC-07)
 *
 * A AI Auditora NÃO toma decisões, NÃO aprova, NÃO reprova,
 * NÃO executa regras e NÃO interpreta contratos.
 *
 * O restante do MedicFlow consome exclusivamente AuditExplanation.
 * Nunca respostas brutas de LLM.
 *
 * EPC-18: fundação arquitetural apenas.
 * NÃO implementa IA real, prompts, HTTP, OCR, TISS, Workflow operacional,
 * banco, UI ou APIs.
 */
export type {
  AIAuditorCapabilities,
  AIAuditorConfigurationValidation,
  AIAuditorHealth,
  AIAuditorPort,
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
  ConfidenceLevelDescriptor,
  DeterministicAuditOutcome,
} from "./ports";

export {
  CONFIDENCE_LEVELS,
  CONFIDENCE_LEVEL_CATALOG,
  createAuditId,
  createFindingId,
  getConfidenceLevel,
  isKnownConfidenceLevel,
  listConfidenceLevels,
  resetAuditIdSequence,
  resetFindingIdSequence,
} from "./ports";

export {
  DEFAULT_MOCK_AI_AUDITOR_ADAPTER_ID,
  DEFAULT_MOCK_AI_AUDITOR_VERSION,
  DefaultMockAIAuditorAdapter,
  MOCK_AI_AUDITOR_ADAPTER_ID,
  MOCK_AI_AUDITOR_VERSION,
  MockAIAuditorAdapter,
  type DefaultMockAIAuditorRuntime,
  type MockAIAuditorAdapterOptions,
} from "./adapters";

export {
  DEFAULT_AI_AUDITOR_STORE_ID,
  DefaultAIAuditorStore,
  type AIAuditorStore,
  type DefaultAIAuditorStoreOptions,
  type StoredAuditExplanation,
} from "./store";

export { AIAuditorFactory, createAIAuditorFactory, type AIAuditorFactoryOptions } from "./factory";

export { createAIAuditorPort } from "./providers";

export {
  AUDIT_EXPLANATION_VERSION,
  buildDeterministicAuditExplanation,
  type BuildAuditExplanationOptions,
} from "./runtime";

export { getAIAuditorHealthSummary, type AIAuditorHealthSummary } from "./demo";
