/**
 * Tipos vendor-agnósticos do Enterprise Document Classification Runtime — F3-CAP-06 (+ DIP-04 / CLASS-01 preservado).
 *
 * Fluxo estrutural (F3-CAP-06):
 *   Produto → Enterprise Runtime → DocumentClassificationRuntimePort
 *     → Adapter → Document Classification Runtime Store → DocumentClassificationResult
 *
 * Fluxo DIP-04 / CLASS-01 preservado (coordenação + execução real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter
 *
 * F3-CAP-06: infraestrutura canônica estrutural apenas — sem IA / sem ML / sem
 * LLM / sem OCR real / sem template matching / sem roteamento automático / sem
 * visão computacional neste módulo. Execução real CLASS-01 permanece exclusiva
 * do DocumentClassificationProviderPort (Adapter) via coordinateClassification()/classify().
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentClassificationProviderPort } from "../../document-classification-provider/ports/document-classification-provider-port";
import type { DocumentClassificationProcessInput } from "../../document-classification-provider/ports/types";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
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
  CanonicalDocumentClassificationProviderReference,
  CanonicalDocumentClassificationProviderReferenceId,
  CanonicalDocumentClassificationRequest,
  CanonicalDocumentClassificationResult,
  CanonicalDocumentClassificationSession,
  DocumentClassificationRuntimeSessionStatus,
} from "./models";
import type {
  CanonicalClassificationStatistics,
  ClassificationMetadata,
  DocumentCategory,
  DocumentClassificationDocument,
  DocumentClassificationJob,
  DocumentClassificationRequest,
  DocumentClassificationResult,
  DocumentType,
} from "./canonical";
import type { DocumentClassificationRuntimeEngineCapabilities } from "./capabilities";

export type {
  CanonicalDocumentClassificationCapabilities,
  CanonicalDocumentClassificationConfiguration,
  CanonicalDocumentClassificationIdentity,
  CanonicalDocumentClassificationMetadata,
  CanonicalDocumentClassificationProviderReference,
  CanonicalDocumentClassificationProviderReferenceId,
  CanonicalDocumentClassificationReference,
  CanonicalDocumentClassificationRequest,
  CanonicalDocumentClassificationResult,
  CanonicalDocumentClassificationSession,
  CanonicalDocumentClassificationTelemetry,
  CanonicalDocumentClassificationType,
  DocumentClassificationRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalClassificationOperation,
  CanonicalClassificationProvider,
  CanonicalClassificationStatistics,
  ClassificationCapabilities,
  ClassificationConfidence,
  ClassificationContext,
  ClassificationHealth,
  ClassificationMetadata,
  ClassificationRule,
  ClassificationStatus,
  DocumentCategory,
  DocumentClassificationDocument,
  DocumentClassificationJob,
  DocumentClassificationRequest,
  DocumentClassificationResult,
  DocumentType,
} from "./canonical";
export type { DocumentClassificationRuntimeEngineCapabilities };

/** Provedores / mecanismos do Document Classification Runtime (adapters do Port). */
export type DocumentClassificationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-06). */
export type DocumentClassificationRuntimeStatus =
  | "ready"
  | "stub"
  | "disabled"
  | "unhealthy"
  | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-06). */
export type DocumentClassificationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-06). */
export type DocumentClassificationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: DocumentClassificationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Document Classification Runtime.
 * Campos DIP-04 / CLASS-01 (`enterpriseOrchestratorOk`, `ocrRuntimeOk`,
 * `classificationProviderAdapterOk`, `realClassificationAvailable`) preservados;
 * campos F3-CAP-06 adicionam prontidão estrutural dos peers.
 */
export type DocumentClassificationRuntimeHealth = {
  ok: boolean;
  provider: DocumentClassificationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: DocumentClassificationRuntimeStatus;
  enterpriseOrchestratorOk?: boolean;
  ocrRuntimeOk?: boolean;
  classificationProviderAdapterOk?: boolean;
  /** true quando DocumentClassificationProviderPort pode executar classificação real. */
  realClassificationAvailable: boolean;
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
  classificationImplemented: false;
  documentRecognitionImplemented: false;
  templateRecognitionImplemented: false;
  medicalGuideRecognitionImplemented: false;
  documentCategoryImplemented: false;
  automaticRoutingImplemented: false;
  confidenceScoreImplemented: false;
  multiClassifierImplemented: false;
  layoutClassificationImplemented: false;
  semanticClassificationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Campos DIP-04 / CLASS-01 preservados (supportsCoordinateClassification/supportsClassify/...).
 * Campos F3-CAP-06 adicionam operações estruturais (openJob/closeJob/submitRequest/
 * registerDocument/getResult/stats) e integrações estruturais.
 */
export type DocumentClassificationRuntimeCapabilities = {
  provider: DocumentClassificationRuntimeProviderId;
  adapterId: string;
  supportsCoordinateClassification: boolean;
  supportsClassify: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesOCRRuntime: boolean;
  usesCaptureEngineRuntime: boolean;
  usesDocumentClassificationProviderAdapter: boolean;
  supportsMedicalGuideClassification: boolean;
  supportsInvoiceClassification: boolean;
  supportsContractClassification: boolean;
  supportsBatchClassification: boolean;
  supportsConfidenceScore: boolean;
  supportsMultiLabelClassification: boolean;
  supportsCustomModels: boolean;
  supportsRuleBasedClassification: boolean;
  /** Runtime pode acionar classificação real via ProviderPort.classify(). */
  implementsRealClassification: boolean;
  implementsAi: false;
  implementsMachineLearning: false;
  implementsRuleEngine: false;
  implementsEmbeddings: false;
  implementsLlm: false;
  implementsOcrForClassification: false;
  // F3-CAP-06 — operações estruturais.
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalClassification: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesOCRRuntimePort: boolean;
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
  classificationImplemented: false;
  documentRecognitionImplemented: false;
  templateRecognitionImplemented: false;
  medicalGuideRecognitionImplemented: false;
  documentCategoryImplemented: false;
  automaticRoutingImplemented: false;
  confidenceScoreImplemented: false;
  multiClassifierImplemented: false;
  layoutClassificationImplemented: false;
  semanticClassificationImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-06) — informativo. */
  engine?: DocumentClassificationRuntimeEngineCapabilities;
  canonical?: import("./canonical").ClassificationCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-06). */
export type DocumentClassificationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-06). */
export type DocumentClassificationRuntimeInfo = {
  providerId: DocumentClassificationRuntimeProviderId;
  metadata: DocumentClassificationRuntimeProviderMetadata;
  status: DocumentClassificationRuntimeStatus;
  providerType: "DOCUMENT_CLASSIFICATION_RUNTIME";
  capabilities: DocumentClassificationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-06. */
export type DocumentClassificationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-06. */
export type DocumentClassificationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: DocumentClassificationRuntimeProviderId;
  telemetry: DocumentClassificationRuntimeTelemetry;
  logs?: readonly DocumentClassificationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 *
 * DIP-04 / CLASS-01 (getOrchestratorPort/getOCRRuntimePort/
 * getDocumentClassificationProviderPort): opcionais para uso estrutural-only;
 * obrigatórios apenas para classify()/coordinateClassification() executarem
 * coordenação/execução real. F3-CAP-06: peers estruturais (shape-check apenas
 * em health() — sem consumo funcional).
 */
export type DocumentClassificationRuntimeEnterpriseDeps = {
  getOrchestratorPort?: () => CanonicalExecutionOrchestratorPort;
  /**
   * OCR Runtime (DIP-03) — hop anterior na cadeia.
   * classify() consome texto/estrutura do OCR; nunca chama OCR HTTP.
   */
  getOCRRuntimePort?: () => OCRRuntimePort;
  /** DocumentClassificationProviderPort oficial — classify()/health()/capabilities. */
  getDocumentClassificationProviderPort?: () => DocumentClassificationProviderPort;
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

export type GetDocumentClassificationRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetDocumentClassificationRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalDocumentClassificationSession;
  message?: string;
  code?: string;
};

export type ListDocumentClassificationRuntimeSessionsInput = {
  status?: DocumentClassificationRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
  captureRuntimeSessionId?: string;
  ocrRuntimeSessionId?: string;
};

export type ListDocumentClassificationRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalDocumentClassificationSession[];
  message?: string;
  code?: string;
};

export type ListDocumentClassificationProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalDocumentClassificationProviderReference[];
};

/** Alias tipado da coordenação (sem classificação real). */
export type CoordinateClassificationInput = CanonicalDocumentClassificationRequest;
export type CoordinateClassificationResult = CanonicalDocumentClassificationResult;

/** Input de execução de classificação real via Runtime (CLASS-01). */
export type ClassifyDocumentInput = DocumentClassificationProcessInput & {
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
  correlationId?: string;
  captureRuntimeSessionId?: string;
  ocrRuntimeSessionId?: string;
  preferredProviderReference?: CanonicalDocumentClassificationProviderReferenceId;
};

export type ClassifyDocumentResult = CanonicalDocumentClassificationResult;

/** Opções de resolução do DocumentClassificationRuntimePort (DIP-04, preservado). */
export type DocumentClassificationRuntimeProviderOptions = {
  provider?: DocumentClassificationRuntimeProviderId;
  /**
   * Ports Enterprise injetados (opcional — necessário apenas para
   * classify()/coordinateClassification() executarem coordenação/execução real
   * via Orchestrator + OCR Runtime + DocumentClassificationProviderPort).
   */
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-06 — resolução do DocumentClassificationRuntimePort (default da fundação: `enterprise`). */
export type DocumentClassificationRuntimeOptions = DocumentClassificationRuntimeProviderOptions;

/** Entrada de registro no DocumentClassificationRuntimeRegistry (F3-CAP-06). */
export type DocumentClassificationRuntimeRegistration = {
  providerId: DocumentClassificationRuntimeProviderId;
  name: string;
  version: string;
  status: DocumentClassificationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: DocumentClassificationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-06 — operações estruturais (openJob / closeJob / submitRequest /
// registerDocument / getResult / stats). Nunca executam classificação real.
// ---------------------------------------------------------------------------

export type OpenClassificationJobInput = DocumentClassificationRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: ClassificationMetadata;
};

export type OpenClassificationJobResult = DocumentClassificationRuntimeOperationEnvelope & {
  result?: DocumentClassificationResult;
  job?: DocumentClassificationJob;
};

export type CloseClassificationJobInput = DocumentClassificationRuntimeOperationalControls & {
  jobId: string;
};

export type CloseClassificationJobResult = DocumentClassificationRuntimeOperationEnvelope & {
  result?: DocumentClassificationResult;
  job?: DocumentClassificationJob;
};

export type SubmitClassificationRequestInput = DocumentClassificationRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  documentId?: string;
  documentCategory?: DocumentCategory;
  documentType?: DocumentType;
  metadata?: ClassificationMetadata;
};

export type SubmitClassificationRequestResult = DocumentClassificationRuntimeOperationEnvelope & {
  result?: DocumentClassificationResult;
  job?: DocumentClassificationJob;
  request?: DocumentClassificationRequest;
};

export type RegisterClassificationDocumentInput =
  DocumentClassificationRuntimeOperationalControls & {
    documentId?: string;
    jobId?: string;
    requestId?: string;
    documentCategory?: DocumentCategory;
    documentType?: DocumentType;
    metadata?: ClassificationMetadata;
  };

export type RegisterClassificationDocumentResult =
  DocumentClassificationRuntimeOperationEnvelope & {
    result?: DocumentClassificationResult;
    document?: DocumentClassificationDocument;
  };

export type GetClassificationResultInput = DocumentClassificationRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  documentId?: string;
};

export type GetClassificationResultResult = DocumentClassificationRuntimeOperationEnvelope & {
  result?: DocumentClassificationResult;
  job?: DocumentClassificationJob;
  request?: DocumentClassificationRequest;
  document?: DocumentClassificationDocument;
};

export type ClassificationStatsInput = DocumentClassificationRuntimeOperationalControls & {
  jobId?: string;
};

export type ClassificationStatsResult = DocumentClassificationRuntimeOperationEnvelope & {
  statistics?: CanonicalClassificationStatistics;
  result?: DocumentClassificationResult;
};

/** Catálogo de Classification Providers referenciados pelo Runtime. */
export const STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES: readonly CanonicalDocumentClassificationProviderReference[] =
  [
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "ai-classifier",
      displayName: "AI Classifier",
      vendor: "Future AI Provider",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "rule-based-classifier",
      displayName: "Rule Based Classifier",
      vendor: "MedicFlow Enterprise",
      status: "available-via-document-classification-provider-port",
      implementsRealClassification: true,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "ml-classifier",
      displayName: "ML Classifier",
      vendor: "Future ML Provider",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "hybrid-classifier",
      displayName: "Hybrid Classifier",
      vendor: "Future Hybrid Provider",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "mock",
      displayName: "Mock Classifier",
      vendor: "MedicFlow Enterprise",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
  ] as const;

export function resolveStructuralClassificationProviderReference(
  id?: CanonicalDocumentClassificationProviderReferenceId,
): CanonicalDocumentClassificationProviderReference {
  const found = STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES.find(
    (ref) => ref.providerReferenceId === id,
  );
  return (
    found ??
    STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES.find(
      (ref) => ref.providerReferenceId === "mock",
    )!
  );
}
