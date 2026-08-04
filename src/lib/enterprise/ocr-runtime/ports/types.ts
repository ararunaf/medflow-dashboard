/**
 * Tipos vendor-agnósticos do Enterprise OCR Runtime — F3-CAP-05 (+ DIP-03 / OCR-01 preservado).
 *
 * Fluxo estrutural (F3-CAP-05):
 *   Produto → Enterprise Runtime → OCRRuntimePort
 *     → Adapter → OCR Runtime Store → OCRResult
 *
 * Fluxo DIP-03 / OCR-01 preservado (coordenação + execução real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 *
 * F3-CAP-05: infraestrutura canônica estrutural apenas — sem OCR real / sem
 * Tesseract / Azure Document Intelligence / Google Vision / AWS Textract /
 * ABBYY / PaddleOCR neste módulo. Execução real OCR-01 permanece exclusiva do
 * OCRProviderPort (Adapter) via coordinateOcr()/process().
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { OCRProviderPort } from "../../ocr-provider/ports/ocr-provider-port";
import type { OCRProcessInput } from "../../ocr-provider/ports/types";
import type { IntelligentCaptureRuntimePort } from "../../intelligent-capture-runtime/ports/intelligent-capture-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../../watch-folder-runtime/ports/watch-folder-runtime-port";
import type { UploadRuntimePort } from "../../upload-runtime/ports/upload-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type { ObservabilityRuntimePort } from "../../observability-runtime/ports/observability-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type {
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  OCRRuntimeSessionStatus,
} from "./models";
import type {
  CanonicalOCROperation,
  CanonicalOCRStatistics,
  OCRDocument,
  OCREngine,
  OCRJob,
  OCRLanguage,
  OCRMetadata,
  OCRRequest,
  OCRResult,
} from "./canonical";
import type { OCRRuntimeEngineCapabilities } from "./capabilities";

export type {
  CanonicalOCRCapabilities,
  CanonicalOCRConfiguration,
  CanonicalOCRIdentity,
  CanonicalOCRMetadata,
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRReference,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  OCRRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalOCRProvider,
  CanonicalOCRStatistics,
  CanonicalOCROperation,
  OCRCapabilities,
  OCRConfidence,
  OCRDocument,
  OCREngine,
  OCRHealth,
  OCRJob,
  OCRLanguage,
  OCRMetadata,
  OCRPage,
  OCRProcessingContext,
  OCRRequest,
  OCRResult,
  OCRStatus,
} from "./canonical";
export type { OCRRuntimeEngineCapabilities };

/** Provedores / mecanismos do OCR Runtime (adapters do Port — não vendors OCR). */
export type OCRRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-05). */
export type OCRRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-05). */
export type OCRRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-05). */
export type OCRRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: OCRRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do OCR Runtime.
 * Campos DIP-03 (`enterpriseOrchestratorOk`, `ocrProviderAdapterOk`, `realOcrAvailable`)
 * preservados; campos F3-CAP-05 adicionam prontidão estrutural dos peers.
 */
export type OCRRuntimeHealth = {
  ok: boolean;
  provider: OCRRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: OCRRuntimeStatus;
  enterpriseOrchestratorOk?: boolean;
  ocrProviderAdapterOk?: boolean;
  /** true quando OCRProviderPort pode executar OCR real (ex.: azure). */
  realOcrAvailable: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedDocumentCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  ocrEngineImplemented: false;
  pdfOcrImplemented: false;
  imageOcrImplemented: false;
  documentRecognitionImplemented: false;
  textExtractionImplemented: false;
  barcodeRecognitionImplemented: false;
  qrRecognitionImplemented: false;
  layoutAnalysisImplemented: false;
  tableRecognitionImplemented: false;
  handwritingRecognitionImplemented: false;
  multiEngineImplemented: false;
  confidenceScoreImplemented: false;
  languageDetectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Campos DIP-03 preservados (supportsCoordinateOcr/supportsProcess/implementsAzure/...).
 * Campos F3-CAP-05 adicionam operações estruturais (openJob/closeJob/submitRequest/
 * registerDocument/getResult/stats) e integrações estruturais.
 */
export type OCRRuntimeCapabilities = {
  provider: OCRRuntimeProviderId;
  adapterId: string;
  supportsCoordinateOcr: boolean;
  supportsProcess: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesOCRProviderAdapter: boolean;
  usesCaptureEngineRuntime: boolean;
  supportsPdf: boolean;
  supportsImage: boolean;
  supportsBatch: boolean;
  supportsStreaming: boolean;
  supportsHandwriting: boolean;
  supportsTables: boolean;
  supportsForms: boolean;
  supportsConfidenceScore: boolean;
  /** Runtime pode acionar OCR real via OCRProviderPort.process(). */
  implementsRealOcr: boolean;
  /** Runtime NÃO implementa vendors — Adapter do OCRProviderPort implementa. */
  implementsAzure: false;
  implementsGoogleVision: false;
  implementsAwsTextract: false;
  implementsTesseract: false;
  implementsAi: false;
  implementsClassification: false;
  implementsXml: false;
  implementsTiss: false;
  // F3-CAP-05 — operações estruturais.
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalOcr: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesIntelligentCaptureRuntimePort: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesUploadRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  usesScalabilityRuntimePort: boolean;
  runtimeReady: true;
  ocrEngineImplemented: false;
  pdfOcrImplemented: false;
  imageOcrImplemented: false;
  documentRecognitionImplemented: false;
  textExtractionImplemented: false;
  barcodeRecognitionImplemented: false;
  qrRecognitionImplemented: false;
  layoutAnalysisImplemented: false;
  tableRecognitionImplemented: false;
  handwritingRecognitionImplemented: false;
  multiEngineImplemented: false;
  confidenceScoreImplemented: false;
  languageDetectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-05) — informativo. */
  engine?: OCRRuntimeEngineCapabilities;
  canonical?: import("./canonical").OCRCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-05). */
export type OCRRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-05). */
export type OCRRuntimeInfo = {
  providerId: OCRRuntimeProviderId;
  metadata: OCRRuntimeProviderMetadata;
  status: OCRRuntimeStatus;
  providerType: "OCR_RUNTIME";
  capabilities: OCRRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-05. */
export type OCRRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-05. */
export type OCRRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: OCRRuntimeProviderId;
  telemetry: OCRRuntimeTelemetry;
  logs?: readonly OCRRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 *
 * DIP-03 (getOrchestratorPort/getOCRProviderPort): opcionais para uso estrutural-only;
 * obrigatórios apenas para process()/coordinateOcr() executarem coordenação/execução real.
 * F3-CAP-05: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type OCRRuntimeEnterpriseDeps = {
  getOrchestratorPort?: () => CanonicalExecutionOrchestratorPort;
  /** OCRProviderPort oficial — process()/health()/capabilities. */
  getOCRProviderPort?: () => OCRProviderPort;
  getIntelligentCaptureRuntimePort?: () => IntelligentCaptureRuntimePort;
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getUploadRuntimePort?: () => UploadRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
  getWorkerRuntimePort?: () => WorkerRuntimePort;
  getSchedulerRuntimePort?: () => SchedulerRuntimePort;
  getObservabilityRuntimePort?: () => ObservabilityRuntimePort;
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

export type GetOCRRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetOCRRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalOCRSession;
  message?: string;
  code?: string;
};

export type ListOCRRuntimeSessionsInput = {
  status?: OCRRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
  captureRuntimeSessionId?: string;
};

export type ListOCRRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalOCRSession[];
  message?: string;
  code?: string;
};

export type ListOCRProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalOCRProviderReference[];
};

/** Alias tipado da coordenação OCR (DIP-03). */
export type CoordinateOCRInput = CanonicalOCRRequest;
export type CoordinateOCRResult = CanonicalOCRResult;

/** Input de execução OCR real via Runtime (OCR-01). */
export type ProcessOCRInput = OCRProcessInput & {
  /** Metadados opcionais para sessão canônica. */
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
  correlationId?: string;
  captureRuntimeSessionId?: string;
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
};

export type ProcessOCRResult = CanonicalOCRResult;

/** Opções de resolução do OCRRuntimePort (DIP-03, preservado). */
export type OCRRuntimeProviderOptions = {
  provider?: OCRRuntimeProviderId;
  /**
   * Ports Enterprise injetados (opcional — necessário apenas para
   * coordinateOcr()/process() executarem coordenação/execução real via
   * Orchestrator + OCRProviderPort).
   */
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-05 — resolução do OCRRuntimePort (default da fundação: `enterprise`). */
export type OCRRuntimeOptions = OCRRuntimeProviderOptions;

/** Entrada de registro no OCRRuntimeRegistry (F3-CAP-05). */
export type OCRRuntimeRegistration = {
  providerId: OCRRuntimeProviderId;
  name: string;
  version: string;
  status: OCRRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: OCRRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-05 — operações estruturais (openJob / closeJob / submitRequest /
// registerDocument / getResult / stats). Nunca executam OCR real.
// ---------------------------------------------------------------------------

export type OpenOCRJobInput = OCRRuntimeOperationalControls & {
  jobId?: string;
  engine?: OCREngine;
  correlationId?: string | null;
  metadata?: OCRMetadata;
};

export type OpenOCRJobResult = OCRRuntimeOperationEnvelope & {
  result?: OCRResult;
  job?: OCRJob;
};

export type CloseOCRJobInput = OCRRuntimeOperationalControls & {
  jobId: string;
};

export type CloseOCRJobResult = OCRRuntimeOperationEnvelope & {
  result?: OCRResult;
  job?: OCRJob;
};

export type SubmitOCRRequestInput = OCRRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  documentId?: string;
  engine?: OCREngine;
  language?: OCRLanguage;
  metadata?: OCRMetadata;
};

export type SubmitOCRRequestResult = OCRRuntimeOperationEnvelope & {
  result?: OCRResult;
  job?: OCRJob;
  request?: OCRRequest;
};

export type RegisterOCRDocumentInput = OCRRuntimeOperationalControls & {
  documentId?: string;
  jobId?: string;
  requestId?: string;
  metadata?: OCRMetadata;
};

export type RegisterOCRDocumentResult = OCRRuntimeOperationEnvelope & {
  result?: OCRResult;
  document?: OCRDocument;
};

export type GetOCRResultInput = OCRRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  documentId?: string;
};

export type GetOCRResultResult = OCRRuntimeOperationEnvelope & {
  result?: OCRResult;
  job?: OCRJob;
  request?: OCRRequest;
  document?: OCRDocument;
};

export type OCRStatsInput = OCRRuntimeOperationalControls & {
  jobId?: string;
};

export type OCRStatsResult = OCRRuntimeOperationEnvelope & {
  statistics?: CanonicalOCRStatistics;
  result?: OCRResult;
};

/** Catálogo de providers referenciados pelo Runtime (HTTP só no Adapter). */
export const STRUCTURAL_OCR_PROVIDER_REFERENCES: readonly CanonicalOCRProviderReference[] = [
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "azure",
    displayName: "Azure Document Intelligence",
    vendor: "Microsoft",
    status: "available-via-ocr-provider-port",
    implementsRealOcr: true,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "google-vision",
    displayName: "Google Cloud Vision / Document AI",
    vendor: "Google",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "aws-textract",
    displayName: "AWS Textract",
    vendor: "Amazon",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "tesseract",
    displayName: "Tesseract OCR",
    vendor: "Open Source",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "mock",
    displayName: "Mock OCR Provider (EPC-15)",
    vendor: "MedicFlow Enterprise",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
] as const;

export function resolveStructuralProviderReference(
  id?: CanonicalOCRProviderReferenceId,
): CanonicalOCRProviderReference {
  const found = STRUCTURAL_OCR_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === id);
  return (
    found ?? STRUCTURAL_OCR_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === "mock")!
  );
}
