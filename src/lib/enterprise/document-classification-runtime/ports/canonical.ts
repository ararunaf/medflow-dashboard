/**
 * Modelos canônicos estruturais do Enterprise Document Classification Runtime — F3-CAP-06.
 *
 * Foundation estrutural vendor-agnostic para orquestração de jobs / requests /
 * documentos de classificação. Sem IA. Sem ML. Sem LLM. Sem OCR. Sem template
 * matching. Sem roteamento automático. Sem visão computacional.
 *
 * Para coordenação e execução de classificação real via
 * DocumentClassificationProviderPort (CLASS-01), ver `./models.ts`
 * (CanonicalDocumentClassification* preservados por compatibilidade).
 */

/** Status estrutural de job / request / documento de classificação (F3-CAP-06). */
export type ClassificationStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "processed"
  | "failed"
  | "unknown"
  | (string & {});

/** Categoria documental estrutural referenciada — nunca inferida por classificação real. */
export type DocumentCategory =
  | "medical-guide"
  | "administrative"
  | "financial"
  | "clinical"
  | "structural"
  | "unknown"
  | (string & {});

/** Tipo documental estrutural referenciado (referência apenas — sem inferência real). */
export type DocumentType = string;

/** Confiança estrutural (nunca calculada por classificador real). */
export type ClassificationConfidence = {
  kind: "canonical-classification-confidence";
  score?: number;
  band?: "low" | "medium" | "high" | "unknown";
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalClassificationProvider = {
  kind: "canonical-classification-cap-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica estrutural (F3-CAP-06).
 * Sem semântica clínica / TISS / tenant real.
 */
export type ClassificationMetadata = {
  kind: "canonical-classification-cap-metadata";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Document Classification Runtime (F3-CAP-06). */
export type CanonicalClassificationOperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerDocument"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/** Regra canônica estrutural referenciada — nunca avaliada nesta fundação. */
export type ClassificationRule = {
  kind: "canonical-classification-rule";
  ruleId: string;
  status: ClassificationStatus;
  documentCategory?: DocumentCategory;
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

/** Contexto estrutural de processamento (referência apenas). */
export type ClassificationContext = {
  kind: "canonical-classification-processing-context";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  documentCategory?: DocumentCategory;
  documentType?: DocumentType;
  confidence?: ClassificationConfidence;
  structuralNotes?: string;
};

/** Documento canônico estrutural referenciado — nunca lê bytes/conteúdo real. */
export type DocumentClassificationDocument = {
  kind: "canonical-classification-document";
  documentId: string;
  jobId?: string;
  requestId?: string;
  status: ClassificationStatus;
  documentCategory?: DocumentCategory;
  documentType?: DocumentType;
  metadata?: ClassificationMetadata;
  createdAt: string;
  updatedAt: string;
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

/** Job canônico estrutural de classificação — nunca executa classificação real. */
export type DocumentClassificationJob = {
  kind: "canonical-classification-job";
  jobId: string;
  status: ClassificationStatus;
  identity?: {
    kind: "canonical-classification-cap-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: ClassificationMetadata;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
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

/** Request canônico estrutural de classificação — nunca dispara classificador real. */
export type DocumentClassificationRequest = {
  kind: "canonical-classification-cap-request";
  requestId: string;
  jobId?: string;
  documentId?: string;
  status: ClassificationStatus;
  documentCategory?: DocumentCategory;
  documentType?: DocumentType;
  metadata?: ClassificationMetadata;
  createdAt: string;
  updatedAt: string;
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
 * Resultado canônico de operação do Document Classification Runtime (F3-CAP-06).
 * Contém apenas referência/estrutura canônica — nunca classificação real.
 */
export type DocumentClassificationResult = {
  kind: "canonical-classification-cap-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalClassificationOperation;
  job?: DocumentClassificationJob;
  request?: DocumentClassificationRequest;
  document?: DocumentClassificationDocument;
  jobs?: readonly DocumentClassificationJob[];
  documents?: readonly DocumentClassificationDocument[];
  metadata?: ClassificationMetadata;
  provider?: CanonicalClassificationProvider;
  processingContext?: ClassificationContext;
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
  /** Sempre true — runtime estrutural pronto (sem classificação real). */
  runtimeReady: true;
  status: ClassificationStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Document Classification Runtime (in-process, F3-CAP-06).
 */
export type CanonicalClassificationStatistics = {
  kind: "canonical-classification-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalDocuments: number;
  totalResults: number;
  classificationImplementedCount: 0;
  documentRecognitionImplementedCount: 0;
  templateRecognitionImplementedCount: 0;
  medicalGuideRecognitionImplementedCount: 0;
  documentCategoryImplementedCount: 0;
  automaticRoutingImplementedCount: 0;
  confidenceScoreImplementedCount: 0;
  multiClassifierImplementedCount: 0;
  layoutClassificationImplementedCount: 0;
  semanticClassificationImplementedCount: 0;
};

/**
 * Saúde canônica estrutural do provedor Document Classification Runtime (F3-CAP-06).
 */
export type ClassificationHealth = {
  kind: "canonical-classification-cap-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedDocumentCount?: number;
  storedResultCount?: number;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
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
 * Capacidades canônicas declaradas do provedor Document Classification Runtime (F3-CAP-06).
 */
export type ClassificationCapabilities = {
  kind: "canonical-classification-cap-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalClassification: boolean;
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
