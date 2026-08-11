/**
 * Enterprise Runtime — ARCH-01 / DIP-01…DIP-06 / ARCH-02 (DIP-07) Integration.
 *
 * Ponto único de acesso da aplicação à Enterprise Foundation.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação
 *     → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
 *     → DocumentClassificationRuntimePort → Orchestrator
 *     → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter (CLASS-01)
 *     → StorageManagerRuntimePort → Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *     → DocumentSearchRuntimePort → Orchestrator
 *     → Search Provider Adapter (referência estrutural)
 *     → AIProviderRuntimePort → Orchestrator → AIProviderPort → Adapter → OpenAI
 *
 * Sem regras de negócio. Sem OCR/XML/TISS/classificação/storage/busca reais. Sem filas/workers reais.
 * IA: exclusivamente via AI Provider Runtime (ARCH-02).
 * Classification: exclusivamente via DocumentClassificationProviderPort (CLASS-01).
 */
export type {
  EnterpriseRuntime,
  EnterpriseRuntimeHealth,
  EnterpriseRuntimeId,
  EnterpriseRuntimeOptions,
  RegisterCaptureDocumentIntakeInput,
  RegisterCaptureDocumentIntakeResult,
} from "./types";

export { DefaultEnterpriseRuntime } from "./enterprise-runtime";

export {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "./create-enterprise-runtime";

export {
  registerTissReceivedJob,
  type RegisterTissReceivedJobInput,
  type RegisterTissReceivedJobResult,
  type TissReceivedJob,
} from "./register-tiss-received-job";

export {
  processTissReceivedOcr,
  TISS_JOB_STATUS_OCR_COMPLETED,
  ENTERPRISE_TISS_QUEUE_NAME,
  type ProcessTissReceivedOcrInput,
  type ProcessTissReceivedOcrResult,
  type TissOcrCompletedJob,
} from "./process-tiss-received-ocr";

export {
  processTissOcrParsed,
  TISS_JOB_STATUS_PARSED,
  type ProcessTissOcrParsedInput,
  type ProcessTissOcrParsedResult,
  type TissParserCompletedJob,
} from "./process-tiss-ocr-parsed";

export {
  processTissParsedValidated,
  TISS_JOB_STATUS_VALIDATED,
  type ProcessTissParsedValidatedInput,
  type ProcessTissParsedValidatedResult,
  type TissValidationCompletedJob,
} from "./process-tiss-parsed-validated";

export {
  processTissValidatedEnriched,
  TISS_JOB_STATUS_ENRICHED,
  type ProcessTissValidatedEnrichedInput,
  type ProcessTissValidatedEnrichedResult,
  type TissEnrichmentCompletedJob,
} from "./process-tiss-validated-enriched";

export {
  processTissEnrichedXmlGenerated,
  TISS_JOB_STATUS_XML_GENERATED,
  type ProcessTissEnrichedXmlGeneratedInput,
  type ProcessTissEnrichedXmlGeneratedResult,
  type TissXmlCompletedJob,
} from "./process-tiss-enriched-xml-generated";

export {
  processTissXmlGeneratedBatchCreated,
  TISS_JOB_STATUS_BATCH_CREATED,
  type ProcessTissXmlGeneratedBatchCreatedInput,
  type ProcessTissXmlGeneratedBatchCreatedResult,
  type TissBatchCompletedJob,
} from "./process-tiss-xml-generated-batch-created";

export {
  processTissBatchCreatedProtocolSent,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  type ProcessTissBatchCreatedProtocolSentInput,
  type ProcessTissBatchCreatedProtocolSentResult,
  type TissProtocolCompletedJob,
} from "./process-tiss-batch-created-protocol-sent";

export {
  processTissProtocolSentPersisted,
  TISS_JOB_STATUS_PERSISTED,
  type ProcessTissProtocolSentPersistedInput,
  type ProcessTissProtocolSentPersistedResult,
  type TissPersistenceCompletedJob,
} from "./process-tiss-protocol-sent-persisted";

export {
  processTissPersistedAudited,
  TISS_JOB_STATUS_AUDITED,
  type ProcessTissPersistedAuditedInput,
  type ProcessTissPersistedAuditedResult,
  type TissAuditCompletedJob,
} from "./process-tiss-persisted-audited";
