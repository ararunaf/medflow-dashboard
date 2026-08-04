/**
 * Modelos canônicos estruturais do Enterprise OCR Runtime — F3-CAP-05.
 *
 * Foundation estrutural vendor-agnostic para orquestração de jobs / requests /
 * documentos OCR. Sem OCR real. Sem Tesseract / Azure Document Intelligence /
 * Google Vision / AWS Textract / ABBYY / PaddleOCR. Sem IA. Sem extração de
 * texto real. Sem leitura de páginas/pixels reais.
 *
 * Para coordenação e execução OCR real via OCRProviderPort (DIP-03 / OCR-01),
 * ver `./models.ts` (CanonicalOCR* preservados por compatibilidade).
 */

/** Status estrutural de job / request / documento OCR (F3-CAP-05). */
export type OCRStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "processed"
  | "failed"
  | "unknown"
  | (string & {});

/** Engine estrutural referenciada — nunca executa OCR real neste módulo. */
export type OCREngine =
  | "tesseract"
  | "azure"
  | "google-vision"
  | "aws-textract"
  | "abbyy"
  | "paddleocr"
  | "structural"
  | "unknown"
  | (string & {});

/** Idioma estrutural declarado (referência apenas — sem detecção real). */
export type OCRLanguage = string;

/** Confiança estrutural (nunca calculada por OCR real). */
export type OCRConfidence = {
  kind: "canonical-ocr-confidence";
  score?: number;
  band?: "low" | "medium" | "high" | "unknown";
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalOCRProvider = {
  kind: "canonical-ocr-cap-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica estrutural (F3-CAP-05).
 * Sem semântica clínica / TISS / tenant real.
 */
export type OCRMetadata = {
  kind: "canonical-ocr-cap-metadata";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do OCR Runtime (F3-CAP-05). */
export type CanonicalOCROperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerDocument"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/** Página canônica estrutural — nunca contém pixels/texto real. */
export type OCRPage = {
  kind: "canonical-ocr-page";
  pageNumber: number;
  status: OCRStatus;
  ocrEngineImplemented: false;
  textExtractionImplemented: false;
  layoutAnalysisImplemented: false;
  tableRecognitionImplemented: false;
  handwritingRecognitionImplemented: false;
};

/** Documento canônico estrutural referenciado — nunca lê bytes reais. */
export type OCRDocument = {
  kind: "canonical-ocr-document";
  documentId: string;
  jobId?: string;
  requestId?: string;
  status: OCRStatus;
  metadata?: OCRMetadata;
  pages?: readonly OCRPage[];
  createdAt: string;
  updatedAt: string;
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

/** Job canônico estrutural de OCR — nunca processa OCR real. */
export type OCRJob = {
  kind: "canonical-ocr-job";
  jobId: string;
  status: OCRStatus;
  engine?: OCREngine;
  identity?: { kind: "canonical-ocr-cap-identity"; jobId?: string; correlationId?: string | null };
  metadata?: OCRMetadata;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
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

/** Request canônico estrutural de OCR — nunca dispara OCR real. */
export type OCRRequest = {
  kind: "canonical-ocr-cap-request";
  requestId: string;
  jobId?: string;
  documentId?: string;
  status: OCRStatus;
  engine?: OCREngine;
  language?: OCRLanguage;
  metadata?: OCRMetadata;
  createdAt: string;
  updatedAt: string;
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

/** Contexto estrutural de processamento (referência apenas). */
export type OCRProcessingContext = {
  kind: "canonical-ocr-processing-context";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  engine?: OCREngine;
  language?: OCRLanguage;
  confidence?: OCRConfidence;
  structuralNotes?: string;
};

/**
 * Resultado canônico de operação do OCR Runtime (F3-CAP-05).
 * Contém apenas referência/estrutura canônica — nunca OCR real.
 */
export type OCRResult = {
  kind: "canonical-ocr-cap-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalOCROperation;
  job?: OCRJob;
  request?: OCRRequest;
  document?: OCRDocument;
  jobs?: readonly OCRJob[];
  documents?: readonly OCRDocument[];
  metadata?: OCRMetadata;
  provider?: CanonicalOCRProvider;
  processingContext?: OCRProcessingContext;
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
  /** Sempre true — runtime estrutural pronto (sem OCR real). */
  runtimeReady: true;
  status: OCRStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do OCR Runtime (in-process, F3-CAP-05).
 */
export type CanonicalOCRStatistics = {
  kind: "canonical-ocr-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalDocuments: number;
  totalResults: number;
  ocrEngineImplementedCount: 0;
  pdfOcrImplementedCount: 0;
  imageOcrImplementedCount: 0;
  documentRecognitionImplementedCount: 0;
  textExtractionImplementedCount: 0;
  barcodeRecognitionImplementedCount: 0;
  qrRecognitionImplementedCount: 0;
  layoutAnalysisImplementedCount: 0;
  tableRecognitionImplementedCount: 0;
  handwritingRecognitionImplementedCount: 0;
  multiEngineImplementedCount: 0;
  confidenceScoreImplementedCount: 0;
  languageDetectionImplementedCount: 0;
};

/**
 * Saúde canônica estrutural do provedor OCR Runtime (F3-CAP-05).
 */
export type OCRHealth = {
  kind: "canonical-ocr-cap-health";
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
 * Capacidades canônicas declaradas do provedor OCR Runtime (F3-CAP-05).
 */
export type OCRCapabilities = {
  kind: "canonical-ocr-cap-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalOcr: boolean;
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
