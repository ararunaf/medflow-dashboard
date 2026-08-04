/**
 * Tipos vendor-agnósticos do Enterprise Quality Runtime — F3-CAP-13.
 *
 * Fluxo estrutural (F3-CAP-13):
 *   Produto → Enterprise Runtime → QualityRuntimePort
 *     → Adapter → Quality Runtime Store → QualityResult
 *
 * F3-CAP-13: infraestrutura canônica estrutural apenas — sem avaliação
 * automática / sem score funcional / sem decisão automática / sem IA /
 * sem OCR / sem auditoria automática / sem banco / sem persistência / sem APIs.
 */
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
import type { DocumentExtractionRuntimePort } from "../../document-extraction-runtime/ports/document-extraction-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { IntelligentCaptureRuntimePort } from "../../intelligent-capture-runtime/ports/intelligent-capture-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../../watch-folder-runtime/ports/watch-folder-runtime-port";
import type { UploadRuntimePort } from "../../upload-runtime/ports/upload-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { AIOrchestrationRuntimePort } from "../../ai-orchestration-runtime/ports/ai-orchestration-runtime-port";
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { TISSMappingRuntimePort } from "../../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import type { AutoFillRuntimePort } from "../../auto-fill-runtime/ports/auto-fill-runtime-port";
import type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillResult,
  CanonicalMappingResult,
  DocumentClassificationResult,
  DocumentExtractionResult,
  OCRResult,
  QualityAssessment,
  QualityContext,
  QualityDecision,
  QualityMetric,
  QualityScore,
  QualityStatistics,
  ValidationResult,
} from "./canonical";
import type { QualityRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillResult,
  CanonicalMappingResult,
  CanonicalQualityOperation,
  DocumentClassificationResult,
  DocumentExtractionResult,
  OCRResult,
  QualityAssessment,
  QualityCapabilities,
  QualityContext,
  QualityDecision,
  QualityHealth,
  QualityIssue,
  QualityMetric,
  QualityMetricKind,
  QualityResult,
  QualityScore,
  QualityStatistics,
  QualityStatus,
  ValidationResult,
} from "./canonical";
export type { QualityRuntimeEngineCapabilities };

/** Provedores / mecanismos do Quality Runtime (adapters do Port). */
export type QualityRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-13). */
export type QualityRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-13). */
export type QualityRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-13). */
export type QualityRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: QualityRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Quality Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type QualityRuntimeHealth = {
  ok: boolean;
  provider: QualityRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: QualityRuntimeStatus;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  aiOrchestrationRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  storedAssessmentCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
  ocrQualityImplemented: false;
  classificationQualityImplemented: false;
  extractionQualityImplemented: false;
  validationQualityImplemented: false;
  mappingQualityImplemented: false;
  autoFillQualityImplemented: false;
  auditQualityImplemented: false;
  approvalDecisionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type QualityRuntimeCapabilities = {
  provider: QualityRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareQualityAssessment: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalQuality: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesAutoFillRuntimePort: boolean;
  usesTISSMappingRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  usesDocumentExtractionRuntimePort: boolean;
  usesDocumentClassificationRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesAIOrchestrationRuntimePort: boolean;
  usesIntelligentCaptureRuntimePort: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesUploadRuntimePort: boolean;
  runtimeReady: true;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
  ocrQualityImplemented: false;
  classificationQualityImplemented: false;
  extractionQualityImplemented: false;
  validationQualityImplemented: false;
  mappingQualityImplemented: false;
  autoFillQualityImplemented: false;
  auditQualityImplemented: false;
  approvalDecisionImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-13) — informativo. */
  engine?: QualityRuntimeEngineCapabilities;
  canonical?: import("./canonical").QualityCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-13). */
export type QualityRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-13). */
export type QualityRuntimeInfo = {
  providerId: QualityRuntimeProviderId;
  metadata: QualityRuntimeProviderMetadata;
  status: QualityRuntimeStatus;
  providerType: "QUALITY_RUNTIME";
  capabilities: QualityRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-13. */
export type QualityRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-13. */
export type QualityRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: QualityRuntimeProviderId;
  telemetry: QualityRuntimeTelemetry;
  logs?: readonly QualityRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-13: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type QualityRuntimeEnterpriseDeps = {
  getAutoFillRuntimePort?: () => AutoFillRuntimePort;
  getTISSMappingRuntimePort?: () => TISSMappingRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
  getDocumentExtractionRuntimePort?: () => DocumentExtractionRuntimePort;
  getDocumentClassificationRuntimePort?: () => DocumentClassificationRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getAIOrchestrationRuntimePort?: () => AIOrchestrationRuntimePort;
  getIntelligentCaptureRuntimePort?: () => IntelligentCaptureRuntimePort;
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getUploadRuntimePort?: () => UploadRuntimePort;
};

/** Opções de resolução do QualityRuntimePort. */
export type QualityRuntimeProviderOptions = {
  provider?: QualityRuntimeProviderId;
  enterpriseDeps?: QualityRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-13 — resolução do QualityRuntimePort (default: `enterprise`). */
export type QualityRuntimeOptions = QualityRuntimeProviderOptions;

/** Entrada de registro no QualityRuntimeRegistry (F3-CAP-13). */
export type QualityRuntimeRegistration = {
  providerId: QualityRuntimeProviderId;
  name: string;
  version: string;
  status: QualityRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: QualityRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-13 — operações estruturais (prepareQualityAssessment / getResult / stats).
// Nunca executam avaliação funcional.
// ---------------------------------------------------------------------------

export type PrepareQualityAssessmentInput = QualityRuntimeOperationalControls & {
  assessmentId?: string;
  qualityContext?: QualityContext;
  metrics?: readonly QualityMetric[];
  score?: QualityScore;
  decision?: QualityDecision;
  ocrResult?: OCRResult;
  classificationResult?: DocumentClassificationResult;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type PrepareQualityAssessmentResult = QualityRuntimeOperationEnvelope & {
  result?: import("./canonical").QualityResult;
  assessment?: QualityAssessment;
};

export type GetQualityResultInput = QualityRuntimeOperationalControls & {
  assessmentId?: string;
  resultId?: string;
};

export type GetQualityResultResult = QualityRuntimeOperationEnvelope & {
  result?: import("./canonical").QualityResult;
  assessment?: QualityAssessment;
};

export type QualityStatsInput = QualityRuntimeOperationalControls & {
  assessmentId?: string;
};

export type QualityStatsResult = QualityRuntimeOperationEnvelope & {
  statistics?: QualityStatistics;
  result?: import("./canonical").QualityResult;
};
