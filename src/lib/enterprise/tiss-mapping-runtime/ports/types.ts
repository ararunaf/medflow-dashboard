/**
 * Tipos vendor-agnósticos do Enterprise TISS Mapping Runtime — F3-CAP-11.
 *
 * Fluxo estrutural (F3-CAP-11):
 *   Produto → Enterprise Runtime → TISSMappingRuntimePort
 *     → Adapter → TISS Mapping Runtime Store → CanonicalMappingResult
 *
 * F3-CAP-11: infraestrutura canônica estrutural apenas — sem mapeamento
 * funcional / sem operadoras / sem XML / sem preenchimento automático /
 * sem IA / sem banco / sem persistência / sem APIs.
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
import type {
  AIOrchestrationContext,
  AuditResult,
  CanonicalGuide,
  CanonicalGuideType,
  CanonicalMapping,
  CanonicalMappingStatistics,
  CanonicalOperator,
  CanonicalTISSVersion,
  DocumentClassificationContext,
  DocumentExtractionResult,
  TISSMappingContext,
  ValidationResult,
} from "./canonical";
import type { TISSMappingRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIOrchestrationContext,
  AuditResult,
  CanonicalBeneficiary,
  CanonicalField,
  CanonicalGuide,
  CanonicalGuideAnexo,
  CanonicalGuideConsulta,
  CanonicalGuideHonorarios,
  CanonicalGuideInternacao,
  CanonicalGuideOdontologica,
  CanonicalGuideResumoInternacao,
  CanonicalGuideSPADT,
  CanonicalGuideType,
  CanonicalMapping,
  CanonicalMappingCapabilities,
  CanonicalMappingHealth,
  CanonicalMappingIssue,
  CanonicalMappingResult,
  CanonicalMappingStatistics,
  CanonicalMappingStatus,
  CanonicalOperator,
  CanonicalOperatorKind,
  CanonicalProcedure,
  CanonicalProfessional,
  CanonicalProvider,
  CanonicalSection,
  CanonicalTISSMappingOperation,
  CanonicalTISSVersion,
  CanonicalTISSVersionContract,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FutureCanonicalGuideContract,
  TISSMappingContext,
  ValidationResult,
} from "./canonical";
export type { TISSMappingRuntimeEngineCapabilities };

/** Provedores / mecanismos do TISS Mapping Runtime (adapters do Port). */
export type TISSMappingRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-11). */
export type TISSMappingRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-11). */
export type TISSMappingRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-11). */
export type TISSMappingRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: TISSMappingRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do TISS Mapping Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type TISSMappingRuntimeHealth = {
  ok: boolean;
  provider: TISSMappingRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: TISSMappingRuntimeStatus;
  aiOrchestrationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  storedMappingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type TISSMappingRuntimeCapabilities = {
  provider: TISSMappingRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareMapping: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalMapping: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesAIOrchestrationRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  usesDocumentExtractionRuntimePort: boolean;
  usesDocumentClassificationRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesIntelligentCaptureRuntimePort: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesUploadRuntimePort: boolean;
  runtimeReady: true;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-11) — informativo. */
  engine?: TISSMappingRuntimeEngineCapabilities;
  canonical?: import("./canonical").CanonicalMappingCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-11). */
export type TISSMappingRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-11). */
export type TISSMappingRuntimeInfo = {
  providerId: TISSMappingRuntimeProviderId;
  metadata: TISSMappingRuntimeProviderMetadata;
  status: TISSMappingRuntimeStatus;
  providerType: "TISS_MAPPING_RUNTIME";
  capabilities: TISSMappingRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-11. */
export type TISSMappingRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-11. */
export type TISSMappingRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: TISSMappingRuntimeProviderId;
  telemetry: TISSMappingRuntimeTelemetry;
  logs?: readonly TISSMappingRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-11: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type TISSMappingRuntimeEnterpriseDeps = {
  getAIOrchestrationRuntimePort?: () => AIOrchestrationRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
  getDocumentExtractionRuntimePort?: () => DocumentExtractionRuntimePort;
  getDocumentClassificationRuntimePort?: () => DocumentClassificationRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getIntelligentCaptureRuntimePort?: () => IntelligentCaptureRuntimePort;
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getUploadRuntimePort?: () => UploadRuntimePort;
};

/** Opções de resolução do TISSMappingRuntimePort. */
export type TISSMappingRuntimeProviderOptions = {
  provider?: TISSMappingRuntimeProviderId;
  enterpriseDeps?: TISSMappingRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-11 — resolução do TISSMappingRuntimePort (default: `enterprise`). */
export type TISSMappingRuntimeOptions = TISSMappingRuntimeProviderOptions;

/** Entrada de registro no TISSMappingRuntimeRegistry (F3-CAP-11). */
export type TISSMappingRuntimeRegistration = {
  providerId: TISSMappingRuntimeProviderId;
  name: string;
  version: string;
  status: TISSMappingRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: TISSMappingRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-11 — operações estruturais (prepareMapping / getResult / stats).
// Nunca executam mapeamento funcional.
// ---------------------------------------------------------------------------

export type PrepareTISSMappingInput = TISSMappingRuntimeOperationalControls & {
  mappingId?: string;
  guideType?: CanonicalGuideType;
  tissVersion?: CanonicalTISSVersion;
  operator?: CanonicalOperator;
  guide?: CanonicalGuide;
  mappingContext?: TISSMappingContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type PrepareTISSMappingResult = TISSMappingRuntimeOperationEnvelope & {
  result?: import("./canonical").CanonicalMappingResult;
  mapping?: CanonicalMapping;
};

export type GetTISSMappingResultInput = TISSMappingRuntimeOperationalControls & {
  mappingId?: string;
  resultId?: string;
};

export type GetTISSMappingResultResult = TISSMappingRuntimeOperationEnvelope & {
  result?: import("./canonical").CanonicalMappingResult;
  mapping?: CanonicalMapping;
};

export type TISSMappingStatsInput = TISSMappingRuntimeOperationalControls & {
  mappingId?: string;
};

export type TISSMappingStatsResult = TISSMappingRuntimeOperationEnvelope & {
  statistics?: CanonicalMappingStatistics;
  result?: import("./canonical").CanonicalMappingResult;
};
