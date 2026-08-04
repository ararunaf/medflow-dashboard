/**
 * Modelos canônicos do Enterprise Intelligent Capture Runtime — F3-CAP-04.
 *
 * Foundation estrutural vendor-agnostic para orquestração de entrada documental.
 * Sem OCR. Sem IA. Sem Pipeline. Sem captura automática. Sem leitura de arquivos.
 * Sem Scanner/Watch Folder/Upload reais. Sem filas. Sem banco. Sem API.
 */

/** Status estrutural de captura / request / route / envelope. */
export type CaptureStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "discovered"
  | "request-open"
  | "request-closed"
  | "routed"
  | "enveloped"
  | "failed"
  | "unknown"
  | (string & {});

/** Origem estrutural declarada (nunca executa captura). */
export type CaptureOrigin = "scanner" | "watch-folder" | "upload" | "unknown" | (string & {});

/** Canal estrutural opaco. */
export type CaptureChannel =
  | "scanner"
  | "watch-folder"
  | "upload"
  | "structural"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalCaptureIdentity = {
  kind: "canonical-capture-identity";
  sourceId?: string;
  sourceName?: string;
  requestId?: string;
  routeId?: string;
  envelopeId?: string;
  correlationId?: string | null;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalCaptureProvider = {
  kind: "canonical-capture-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica estrutural.
 * Sem semântica de operadora/contrato/tenant/documento.
 */
export type CanonicalCaptureMetadata = {
  kind: "canonical-capture-metadata";
  requestId?: string;
  correlationId?: string | null;
  channel?: CaptureChannel;
  origin?: CaptureOrigin;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Intelligent Capture Runtime. */
export type CanonicalCaptureOperation =
  | "registerSource"
  | "unregisterSource"
  | "discoverSources"
  | "openRequest"
  | "closeRequest"
  | "route"
  | "envelope"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * CaptureSource canônico estrutural.
 * Representa uma fonte de entrada documental — sem execução.
 */
export type CaptureSource = {
  kind: "canonical-capture-source";
  sourceId: string;
  sourceName: string;
  origin: CaptureOrigin;
  channel: CaptureChannel;
  identity?: CanonicalCaptureIdentity;
  metadata?: CanonicalCaptureMetadata;
  status: CaptureStatus;
  discovered: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhuma integração operacional nesta fundação. */
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
};

/**
 * CaptureRequest canônico estrutural (referência apenas — nunca captura).
 */
export type CaptureRequest = {
  kind: "canonical-capture-request";
  requestId: string;
  sourceId: string;
  origin: CaptureOrigin;
  channel: CaptureChannel;
  identity?: CanonicalCaptureIdentity;
  metadata?: CanonicalCaptureMetadata;
  status: CaptureStatus;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
};

/**
 * CaptureRoute canônico estrutural (declaração apenas — nunca roteia documentos).
 */
export type CaptureRoute = {
  kind: "canonical-capture-route";
  routeId: string;
  sourceId: string;
  requestId?: string;
  origin: CaptureOrigin;
  channel: CaptureChannel;
  targetRuntime?: "scanner" | "watch-folder" | "upload" | "structural" | (string & {});
  identity?: CanonicalCaptureIdentity;
  metadata?: CanonicalCaptureMetadata;
  status: CaptureStatus;
  createdAt: string;
  updatedAt: string;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
};

/**
 * CaptureEnvelope canônico estrutural (envelope apenas — nunca embala arquivos).
 */
export type CaptureEnvelope = {
  kind: "canonical-capture-envelope";
  envelopeId: string;
  sourceId: string;
  requestId?: string;
  routeId?: string;
  origin: CaptureOrigin;
  channel: CaptureChannel;
  identity?: CanonicalCaptureIdentity;
  metadata?: CanonicalCaptureMetadata;
  status: CaptureStatus;
  createdAt: string;
  updatedAt: string;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
};

/**
 * Resultado canônico de operação de Intelligent Capture Runtime (F3-CAP-04).
 * Contém apenas referência/estrutura canônica — nunca captura real.
 */
export type CaptureResult = {
  kind: "canonical-capture-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalCaptureOperation;
  source?: CaptureSource;
  request?: CaptureRequest;
  route?: CaptureRoute;
  envelope?: CaptureEnvelope;
  sources?: readonly CaptureSource[];
  identity?: CanonicalCaptureIdentity;
  metadata?: CanonicalCaptureMetadata;
  provider?: CanonicalCaptureProvider;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem captura real). */
  runtimeReady: true;
  status: CaptureStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Intelligent Capture Runtime (in-process).
 */
export type CanonicalCaptureStatistics = {
  kind: "canonical-capture-statistics";
  totalSources: number;
  registeredSources: number;
  discoveredSources: number;
  openRequests: number;
  closedRequests: number;
  totalRoutes: number;
  totalEnvelopes: number;
  scannerIntegrationImplementedCount: 0;
  watchFolderIntegrationImplementedCount: 0;
  uploadIntegrationImplementedCount: 0;
  capturePipelineImplementedCount: 0;
  documentRoutingImplementedCount: 0;
  automaticSelectionImplementedCount: 0;
  automaticCaptureImplementedCount: 0;
  ocrPipelineImplementedCount: 0;
  classificationPipelineImplementedCount: 0;
  processingPipelineImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Intelligent Capture Runtime.
 */
export type CaptureHealth = {
  kind: "canonical-capture-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedSourceCount?: number;
  storedRequestCount?: number;
  storedRouteCount?: number;
  storedEnvelopeCount?: number;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  runtimeReady: true;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Intelligent Capture Runtime.
 */
export type CaptureCapabilities = {
  kind: "canonical-capture-capabilities";
  supportsRegisterSource: boolean;
  supportsUnregisterSource: boolean;
  supportsDiscoverSources: boolean;
  supportsOpenRequest: boolean;
  supportsCloseRequest: boolean;
  supportsRoute: boolean;
  supportsEnvelope: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalCapture: boolean;
  runtimeReady: true;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
