/**
 * OPER-INF-D / OPER-INF-R / TISS-RUNTIME-01A / TISS-RUNTIME-01B — motores operacionais internos do Queue Runtime.
 *
 * DeadLetterRuntimePort é contrato INTERNO — não é Port Enterprise novo.
 * DefaultRetryInfrastructure NÃO é Port — reutiliza Scheduler/Worker/Queue Ports.
 * enqueueTissReceivedJob NÃO é Port — registra Job TISS RECEIVED via QueueRuntimePort.
 * processTissOcrJob NÃO é Port — capability OCR via OCRRuntimePort + reenqueue OCR_COMPLETED.
 *
 * Dead Letter: armazenamento definitivo via QueueRuntimePort.
 * Retry: decisão de reenvio + agendamento (nunca executa processamento).
 * TISS-01A: Documento → enqueue → Job RECEIVED (sem OCR/Parser/XML).
 * TISS-01B: Job RECEIVED → Worker → OCR → Job OCR_COMPLETED (sem Parser).
 * TISS-01C: Job OCR_COMPLETED → Worker → Parser → Job PARSED (sem Validação).
 * TISS-02A: Job PARSED → Worker → Validation → Job VALIDATED (sem Enriquecimento).
 * TISS-02B: Job VALIDATED → Worker → Enrichment → Job ENRICHED (sem XML).
 * TISS-03A: Job ENRICHED → Worker → XML TISS → Job XML_GENERATED (sem Batch).
 * TISS-03B: Job XML_GENERATED → Worker → Batch → Job BATCH_CREATED (sem Protocol).
 * TISS-04A: Job BATCH_CREATED → Worker → Protocol → Job PROTOCOL_SENT (sem Persistence).
 * TISS-04B: Job PROTOCOL_SENT → Worker → Persistence → Job PERSISTED (sem Audit).
 * TISS-05A: Job PERSISTED → Worker → Audit → Job AUDITED (sem Completed).
 */
export type {
  DeadLetterGetByIdInput,
  DeadLetterGetByIdResult,
  DeadLetterMetadata,
  DeadLetterParkInput,
  DeadLetterParkResult,
  DeadLetterPurgeInput,
  DeadLetterPurgeResult,
  DeadLetterRecord,
  DeadLetterStatsResult,
} from "./dead-letter-types";

export { ENTERPRISE_DEAD_LETTER_QUEUE_NAME } from "./dead-letter-types";

export type { DeadLetterRuntimePort } from "./dead-letter-runtime-port";

export {
  IN_MEMORY_DEAD_LETTER_STORE_ID,
  InMemoryDeadLetterStore,
} from "./in-memory-dead-letter-store";

export {
  DefaultDeadLetterRuntime,
  createDeadLetterId,
  resetDeadLetterIdSequences,
  type DefaultDeadLetterRuntimeOptions,
} from "./default-dead-letter-runtime";

export type {
  RetryDecideInput,
  RetryDecideResult,
  RetryDecision,
  RetryGetByIdInput,
  RetryGetByIdResult,
  RetryMetadata,
  RetryPolicy,
  RetryRecord,
  RetryStatsResult,
  RetryStatus,
} from "./retry-types";

export {
  DEFAULT_RETRY_POLICY,
  computeExponentialBackoffDelayMs,
  resolveRetryPolicy,
} from "./retry-types";

export { IN_MEMORY_RETRY_STORE_ID, InMemoryRetryStore } from "./in-memory-retry-store";

export {
  DefaultRetryInfrastructure,
  createRetryId,
  resetRetryIdSequences,
  type DefaultRetryInfrastructureOptions,
} from "./default-retry-infrastructure";

export {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_RECEIVED,
  enqueueTissReceivedJob,
  type EnqueueTissReceivedJobInput,
  type EnqueueTissReceivedJobResult,
  type TissJobLogicalStatus,
  type TissReceivedJob,
} from "./enqueue-tiss-received-job";

export {
  TISS_JOB_STATUS_OCR_COMPLETED,
  processTissOcrJob,
  createTissOcrProcessMessage,
  type ProcessTissOcrJobInput,
  type ProcessTissOcrJobResult,
  type TissOcrCompletedJob,
  type TissOcrJobLogicalStatus,
  type TissOcrProcessMessageDeps,
} from "./process-tiss-ocr-job";

export {
  TISS_JOB_STATUS_PARSED,
  processTissParserJob,
  createTissParserProcessMessage,
  type ProcessTissParserJobInput,
  type ProcessTissParserJobResult,
  type TissParserCompletedJob,
  type TissParserJobLogicalStatus,
  type TissParserProcessMessageDeps,
} from "./process-tiss-parser-job";

export {
  TISS_JOB_STATUS_VALIDATED,
  processTissValidationJob,
  createTissValidationProcessMessage,
  type ProcessTissValidationJobInput,
  type ProcessTissValidationJobResult,
  type TissValidationCompletedJob,
  type TissValidationJobLogicalStatus,
  type TissValidationProcessMessageDeps,
} from "./process-tiss-validation-job";

export {
  TISS_JOB_STATUS_ENRICHED,
  processTissEnrichmentJob,
  createTissEnrichmentProcessMessage,
  type ProcessTissEnrichmentJobInput,
  type ProcessTissEnrichmentJobResult,
  type TissEnrichmentCompletedJob,
  type TissEnrichmentJobLogicalStatus,
  type TissEnrichmentProcessMessageDeps,
} from "./process-tiss-enrichment-job";

export {
  TISS_JOB_STATUS_XML_GENERATED,
  processTissXmlJob,
  createTissXmlProcessMessage,
  type ProcessTissXmlJobInput,
  type ProcessTissXmlJobResult,
  type TissXmlCompletedJob,
  type TissXmlJobLogicalStatus,
  type TissXmlProcessMessageDeps,
} from "./process-tiss-xml-job";

export {
  TISS_JOB_STATUS_BATCH_CREATED,
  processTissBatchJob,
  createTissBatchProcessMessage,
  type ProcessTissBatchJobInput,
  type ProcessTissBatchJobResult,
  type TissBatchCompletedJob,
  type TissBatchJobLogicalStatus,
  type TissBatchProcessMessageDeps,
} from "./process-tiss-batch-job";

export {
  TISS_JOB_STATUS_PROTOCOL_SENT,
  processTissProtocolJob,
  createTissProtocolProcessMessage,
  type ProcessTissProtocolJobInput,
  type ProcessTissProtocolJobResult,
  type TissProtocolCompletedJob,
  type TissProtocolJobLogicalStatus,
  type TissProtocolProcessMessageDeps,
} from "./process-tiss-protocol-job";

export {
  TISS_JOB_STATUS_PERSISTED,
  processTissPersistenceJob,
  createTissPersistenceProcessMessage,
  type ProcessTissPersistenceJobInput,
  type ProcessTissPersistenceJobResult,
  type TissPersistenceCompletedJob,
  type TissPersistenceJobLogicalStatus,
  type TissPersistenceProcessMessageDeps,
} from "./process-tiss-persistence-job";

export {
  TISS_JOB_STATUS_AUDITED,
  processTissAuditJob,
  createTissAuditProcessMessage,
  type ProcessTissAuditJobInput,
  type ProcessTissAuditJobResult,
  type TissAuditCompletedJob,
  type TissAuditJobLogicalStatus,
  type TissAuditProcessMessageDeps,
} from "./process-tiss-audit-job";
