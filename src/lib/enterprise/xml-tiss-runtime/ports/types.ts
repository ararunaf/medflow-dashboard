/**
 * Tipos vendor-agnósticos do Enterprise XML TISS Runtime — C-01 / ECS-01.
 *
 * Fluxo estrutural (C-01):
 *   Produto → Enterprise Runtime → XMLTISSRuntimePort
 *     → Adapter → XML TISS Runtime Store → XMLResult
 *
 * C-01: infraestrutura canônica estrutural apenas — sem geração de XML /
 * sem serialização / sem parser / sem XSD / sem SOAP / sem operadoras /
 * sem banco / sem persistência / sem APIs.
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
import type { QualityRuntimePort } from "../../quality-runtime/ports/quality-runtime-port";
import type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillResult,
  CanonicalGuide,
  CanonicalMappingResult,
  QualityAssessment,
  ValidationResult,
  XMLBatch,
  XMLBody,
  XMLDocument,
  XMLGuide,
  XMLHeader,
  XMLMetadata,
  XMLStatistics,
  XMLTISSContext,
  XMLTISSVersion,
} from "./canonical";
import type { XMLTISSRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillResult,
  CanonicalGuide,
  CanonicalMappingResult,
  CanonicalXMLTISSOperation,
  FutureXMLTISSGuideContract,
  QualityAssessment,
  ValidationResult,
  XMLBatch,
  XMLBody,
  XMLCapabilities,
  XMLDocument,
  XMLGuide,
  XMLGuideAnexo,
  XMLGuideCabecalho,
  XMLGuideConsulta,
  XMLGuideHonorarios,
  XMLGuideInternacao,
  XMLGuideLote,
  XMLGuideOdontologica,
  XMLGuideProtocolo,
  XMLGuideResumoInternacao,
  XMLGuideSPSADT,
  XMLHeader,
  XMLHealth,
  XMLMetadata,
  XMLResult,
  XMLStatistics,
  XMLStatus,
  XMLTISSContext,
  XMLTISSGuideType,
  XMLTISSNamespace,
  XMLTISSSchemaRef,
  XMLTISSVersion,
  XMLTISSVersionId,
} from "./canonical";
export type { XMLTISSRuntimeEngineCapabilities };

/** Provedores / mecanismos do XML TISS Runtime (adapters do Port). */
export type XMLTISSRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-01). */
export type XMLTISSRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-01). */
export type XMLTISSRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-01). */
export type XMLTISSRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLTISSRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do XML TISS Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type XMLTISSRuntimeHealth = {
  ok: boolean;
  provider: XMLTISSRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: XMLTISSRuntimeStatus;
  qualityRuntimeOk?: boolean;
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
  storedDocumentCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  xmlValidationImplemented: false;
  xmlSigningImplemented: false;
  xmlCompressionImplemented: false;
  batchXmlGenerationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
  schemaValidationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type XMLTISSRuntimeCapabilities = {
  provider: XMLTISSRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareXMLDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalXMLTISS: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesQualityRuntimePort: boolean;
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
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  xmlValidationImplemented: false;
  xmlSigningImplemented: false;
  xmlCompressionImplemented: false;
  batchXmlGenerationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
  schemaValidationImplemented: false;
  /** Espelho declarativo (engine) e canônico (C-01) — informativo. */
  engine?: XMLTISSRuntimeEngineCapabilities;
  canonical?: import("./canonical").XMLCapabilities;
};

/** Metadados estáveis do provedor (C-01). */
export type XMLTISSRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-01). */
export type XMLTISSRuntimeInfo = {
  providerId: XMLTISSRuntimeProviderId;
  metadata: XMLTISSRuntimeProviderMetadata;
  status: XMLTISSRuntimeStatus;
  providerType: "XML_TISS_RUNTIME";
  capabilities: XMLTISSRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-01. */
export type XMLTISSRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-01. */
export type XMLTISSRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLTISSRuntimeProviderId;
  telemetry: XMLTISSRuntimeTelemetry;
  logs?: readonly XMLTISSRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-01: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type XMLTISSRuntimeEnterpriseDeps = {
  getQualityRuntimePort?: () => QualityRuntimePort;
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

/** Opções de resolução do XMLTISSRuntimePort. */
export type XMLTISSRuntimeProviderOptions = {
  provider?: XMLTISSRuntimeProviderId;
  enterpriseDeps?: XMLTISSRuntimeEnterpriseDeps;
};

/** Alias C-01 — resolução do XMLTISSRuntimePort (default: `enterprise`). */
export type XMLTISSRuntimeOptions = XMLTISSRuntimeProviderOptions;

/** Entrada de registro no XMLTISSRuntimeRegistry (C-01). */
export type XMLTISSRuntimeRegistration = {
  providerId: XMLTISSRuntimeProviderId;
  name: string;
  version: string;
  status: XMLTISSRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLTISSRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-01 — operações estruturais (prepareXMLDocument / getResult / stats).
// Nunca executam geração / serialização / parsing de XML.
// ---------------------------------------------------------------------------

export type PrepareXMLDocumentInput = XMLTISSRuntimeOperationalControls & {
  documentId?: string;
  xmlContext?: XMLTISSContext;
  guide?: XMLGuide;
  batch?: XMLBatch;
  header?: XMLHeader;
  body?: XMLBody;
  metadata?: XMLMetadata;
  tissVersion?: XMLTISSVersion;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type PrepareXMLDocumentResult = XMLTISSRuntimeOperationEnvelope & {
  result?: import("./canonical").XMLResult;
  document?: XMLDocument;
};

export type GetXMLResultInput = XMLTISSRuntimeOperationalControls & {
  documentId?: string;
  resultId?: string;
};

export type GetXMLResultResult = XMLTISSRuntimeOperationEnvelope & {
  result?: import("./canonical").XMLResult;
  document?: XMLDocument;
};

export type XMLStatsInput = XMLTISSRuntimeOperationalControls & {
  documentId?: string;
};

export type XMLStatsResult = XMLTISSRuntimeOperationEnvelope & {
  statistics?: XMLStatistics;
  result?: import("./canonical").XMLResult;
};
