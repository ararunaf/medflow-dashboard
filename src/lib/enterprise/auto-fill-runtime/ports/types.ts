/**
 * Tipos vendor-agnósticos do Enterprise Auto-Fill Runtime — F3-CAP-12.
 *
 * Fluxo estrutural (F3-CAP-12):
 *   Produto → Enterprise Runtime → AutoFillRuntimePort
 *     → Adapter → Auto-Fill Runtime Store → AutoFillResult
 *
 * F3-CAP-12: infraestrutura canônica estrutural apenas — sem preenchimento
 * automático / sem geração de XML / sem escrita em guias / sem operadoras /
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
import type { TISSMappingRuntimePort } from "../../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillContext,
  AutoFillGuide,
  AutoFillGuideType,
  AutoFillOperator,
  AutoFillSession,
  AutoFillStatistics,
  CanonicalGuide,
  CanonicalMappingResult,
  CanonicalOperator,
  ValidationResult,
} from "./canonical";
import type { AutoFillRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillCapabilities,
  AutoFillContext,
  AutoFillField,
  AutoFillGuide,
  AutoFillGuideAnexo,
  AutoFillGuideConsulta,
  AutoFillGuideHonorarios,
  AutoFillGuideInternacao,
  AutoFillGuideOdontologica,
  AutoFillGuideResumoInternacao,
  AutoFillGuideSPADT,
  AutoFillGuideType,
  AutoFillHealth,
  AutoFillIssue,
  AutoFillOperator,
  AutoFillOperatorKind,
  AutoFillResult,
  AutoFillSection,
  AutoFillSession,
  AutoFillStatistics,
  AutoFillStatus,
  CanonicalAutoFillOperation,
  CanonicalGuide,
  CanonicalGuideAnexo,
  CanonicalGuideConsulta,
  CanonicalGuideHonorarios,
  CanonicalGuideInternacao,
  CanonicalGuideOdontologica,
  CanonicalGuideResumoInternacao,
  CanonicalGuideSPADT,
  CanonicalGuideType,
  CanonicalMappingResult,
  CanonicalOperator,
  CanonicalOperatorKind,
  FutureAutoFillGuideContract,
  ValidationResult,
} from "./canonical";
export type { AutoFillRuntimeEngineCapabilities };

/** Provedores / mecanismos do Auto-Fill Runtime (adapters do Port). */
export type AutoFillRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-12). */
export type AutoFillRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-12). */
export type AutoFillRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-12). */
export type AutoFillRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: AutoFillRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Auto-Fill Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type AutoFillRuntimeHealth = {
  ok: boolean;
  provider: AutoFillRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: AutoFillRuntimeStatus;
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
  storedSessionCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AutoFillRuntimeCapabilities = {
  provider: AutoFillRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareAutoFill: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalAutoFill: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
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
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-12) — informativo. */
  engine?: AutoFillRuntimeEngineCapabilities;
  canonical?: import("./canonical").AutoFillCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-12). */
export type AutoFillRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-12). */
export type AutoFillRuntimeInfo = {
  providerId: AutoFillRuntimeProviderId;
  metadata: AutoFillRuntimeProviderMetadata;
  status: AutoFillRuntimeStatus;
  providerType: "AUTO_FILL_RUNTIME";
  capabilities: AutoFillRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-12. */
export type AutoFillRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-12. */
export type AutoFillRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: AutoFillRuntimeProviderId;
  telemetry: AutoFillRuntimeTelemetry;
  logs?: readonly AutoFillRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-12: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type AutoFillRuntimeEnterpriseDeps = {
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

/** Opções de resolução do AutoFillRuntimePort. */
export type AutoFillRuntimeProviderOptions = {
  provider?: AutoFillRuntimeProviderId;
  enterpriseDeps?: AutoFillRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-12 — resolução do AutoFillRuntimePort (default: `enterprise`). */
export type AutoFillRuntimeOptions = AutoFillRuntimeProviderOptions;

/** Entrada de registro no AutoFillRuntimeRegistry (F3-CAP-12). */
export type AutoFillRuntimeRegistration = {
  providerId: AutoFillRuntimeProviderId;
  name: string;
  version: string;
  status: AutoFillRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: AutoFillRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-12 — operações estruturais (prepareAutoFill / getResult / stats).
// Nunca executam preenchimento funcional.
// ---------------------------------------------------------------------------

export type PrepareAutoFillInput = AutoFillRuntimeOperationalControls & {
  autoFillId?: string;
  guideType?: AutoFillGuideType;
  operator?: AutoFillOperator | CanonicalOperator;
  guide?: AutoFillGuide;
  autoFillContext?: AutoFillContext;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type PrepareAutoFillResult = AutoFillRuntimeOperationEnvelope & {
  result?: import("./canonical").AutoFillResult;
  session?: AutoFillSession;
};

export type GetAutoFillResultInput = AutoFillRuntimeOperationalControls & {
  autoFillId?: string;
  resultId?: string;
};

export type GetAutoFillResultResult = AutoFillRuntimeOperationEnvelope & {
  result?: import("./canonical").AutoFillResult;
  session?: AutoFillSession;
};

export type AutoFillStatsInput = AutoFillRuntimeOperationalControls & {
  autoFillId?: string;
};

export type AutoFillStatsResult = AutoFillRuntimeOperationEnvelope & {
  statistics?: AutoFillStatistics;
  result?: import("./canonical").AutoFillResult;
};
