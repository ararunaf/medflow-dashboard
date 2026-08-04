/**
 * Modelos canônicos estruturais do Enterprise Document Extraction Runtime — F3-CAP-07.
 *
 * Foundation estrutural vendor-agnostic para orquestração futura de extração
 * de dados estruturados de documentos classificados.
 *
 * Sem extração real. Sem OCR. Sem IA. Sem ML. Sem LLM. Sem Regex. Sem Template
 * Matching funcional. Sem leitura de campos. Sem preenchimento de guias.
 * Sem persistência. Sem banco. Sem APIs.
 *
 * Todos os metadados e contratos abaixo são exclusivamente estruturais —
 * nenhum campo possui implementação funcional nesta sprint.
 */

/** Status estrutural de job / request / documento de extração (F3-CAP-07). */
export type ExtractionStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "processed"
  | "failed"
  | "unknown"
  | (string & {});

/** Confiança estrutural (nunca calculada por extrator real). */
export type ExtractionConfidence = {
  kind: "canonical-extraction-confidence";
  score?: number;
  band?: "low" | "medium" | "high" | "unknown";
};

/**
 * Contrato canônico oficial entre Document Classification Runtime e
 * Document Extraction Runtime (F3-CAP-07).
 *
 * Contém exclusivamente metadados estruturais. Nenhum campo é inferido,
 * calculado ou preenchido por classificação/extração real nesta fundação.
 */
export type DocumentClassificationContext = {
  kind: "canonical-document-classification-context";
  documentCategory?: string;
  documentType?: string;
  guideType?: string;
  operator?: string;
  operatorCode?: string;
  tissVersion?: string;
  templateId?: string;
  documentOrientation?: string;
  documentLanguage?: string;
  documentQuality?: string;
  recommendedPipeline?: string;
  confidence?: ExtractionConfidence | number;
  documentFamily?: string;
  documentSubtype?: string;
  processingProfile?: string;
  layoutVersion?: string;
  captureSource?: string;
  documentFingerprint?: string;
  classificationTimestamp?: string;
};

/** Metadata canônica estrutural (F3-CAP-07). */
export type ExtractionMetadata = {
  kind: "canonical-extraction-metadata";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  classificationContext?: DocumentClassificationContext;
};

/** Campo canônico estrutural — nunca lido/extraído de documento real. */
export type ExtractionField = {
  kind: "canonical-extraction-field";
  fieldId: string;
  fieldName?: string;
  fieldPath?: string;
  status: ExtractionStatus;
  value?: string | number | boolean | null;
  confidence?: ExtractionConfidence;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
};

/** Tabela canônica estrutural — nunca extraída de documento real. */
export type ExtractionTable = {
  kind: "canonical-extraction-table";
  tableId: string;
  tableName?: string;
  status: ExtractionStatus;
  rowCount?: number;
  columnCount?: number;
  tableExtractionImplemented: false;
  structuredExtractionImplemented: false;
  confidenceScoreImplemented: false;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalExtractionProvider = {
  kind: "canonical-extraction-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/** Operação canônica do Document Extraction Runtime (F3-CAP-07). */
export type CanonicalExtractionOperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerDocument"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/** Contexto estrutural de extração (referência apenas). */
export type ExtractionContext = {
  kind: "canonical-extraction-context";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  classificationContext?: DocumentClassificationContext;
  confidence?: ExtractionConfidence;
  structuralNotes?: string;
};

/** Job canônico estrutural de extração — nunca executa extração real. */
export type ExtractionJob = {
  kind: "canonical-extraction-job";
  jobId: string;
  status: ExtractionStatus;
  identity?: {
    kind: "canonical-extraction-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: ExtractionMetadata;
  classificationContext?: DocumentClassificationContext;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
};

/**
 * Request canônico estrutural de extração (DocumentExtractionRequest).
 * Nunca dispara engine de extração real.
 */
export type DocumentExtractionRequest = {
  kind: "canonical-document-extraction-request";
  requestId: string;
  jobId?: string;
  documentId?: string;
  status: ExtractionStatus;
  metadata?: ExtractionMetadata;
  classificationContext?: DocumentClassificationContext;
  createdAt: string;
  updatedAt: string;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
};

/** Documento canônico estrutural referenciado — nunca lê bytes/conteúdo real. */
export type DocumentExtractionDocument = {
  kind: "canonical-document-extraction-document";
  documentId: string;
  jobId?: string;
  requestId?: string;
  status: ExtractionStatus;
  metadata?: ExtractionMetadata;
  classificationContext?: DocumentClassificationContext;
  createdAt: string;
  updatedAt: string;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
};

/** Resumo estrutural de extração — nunca contém dados extraídos reais. */
export type ExtractionSummary = {
  kind: "canonical-extraction-summary";
  fieldCount: number;
  tableCount: number;
  status: ExtractionStatus;
  classificationContext?: DocumentClassificationContext;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  tableExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
};

/**
 * Resultado canônico de operação do Document Extraction Runtime (F3-CAP-07).
 * Contém apenas referência/estrutura canônica — nunca extração real.
 */
export type DocumentExtractionResult = {
  kind: "canonical-document-extraction-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalExtractionOperation;
  job?: ExtractionJob;
  request?: DocumentExtractionRequest;
  document?: DocumentExtractionDocument;
  fields?: readonly ExtractionField[];
  tables?: readonly ExtractionTable[];
  summary?: ExtractionSummary;
  metadata?: ExtractionMetadata;
  provider?: CanonicalExtractionProvider;
  extractionContext?: ExtractionContext;
  classificationContext?: DocumentClassificationContext;
  confidence?: ExtractionConfidence;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem extração real). */
  runtimeReady: true;
  status: ExtractionStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Document Extraction Runtime (in-process). */
export type ExtractionStatistics = {
  kind: "canonical-extraction-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalDocuments: number;
  totalResults: number;
  fieldExtractionImplementedCount: 0;
  structuredExtractionImplementedCount: 0;
  medicalGuideExtractionImplementedCount: 0;
  tableExtractionImplementedCount: 0;
  templateExtractionImplementedCount: 0;
  automaticMappingImplementedCount: 0;
  confidenceScoreImplementedCount: 0;
  barcodeExtractionImplementedCount: 0;
  qrExtractionImplementedCount: 0;
  pipelineSelectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Document Extraction Runtime. */
export type ExtractionHealth = {
  kind: "canonical-extraction-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedDocumentCount?: number;
  storedResultCount?: number;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  runtimeReady: true;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Document Extraction Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ExtractionCapabilities = {
  kind: "canonical-extraction-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalExtraction: boolean;
  runtimeReady: true;
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
};
