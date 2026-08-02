/**
 * Modelos canônicos do OCR Runtime — DIP-03 / OCR-01.
 *
 * Coordenação + execução via OCRProviderPort.
 * Sem HTTP Azure neste módulo — Adapter OCR-01 é o único caminho HTTP.
 */
import type {
  DocumentProcessingResult,
  ProcessingOutput,
} from "../../document-processor/ports/types";

/** Status estrutural da sessão OCR no Runtime. */
export type OCRRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "processing"
  | "completed"
  | "deferred"
  | "failed";

/** Identidade canônica do documento no OCR (referências opacas). */
export type CanonicalOCRIdentity = {
  kind: "canonical-ocr-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Metadados canônicos estruturais da sessão OCR. */
export type CanonicalOCRMetadata = {
  kind: "canonical-ocr-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Referência canônica opaca a artefatos Enterprise / produto / captura. */
export type CanonicalOCRReference = {
  kind: "canonical-ocr-reference";
  storageKey?: string;
  storageContainer?: string;
  storageProvider?: string;
  metadataId?: string;
  metadataNamespace?: string;
  intakeId?: string;
  executionId?: string;
  captureRuntimeSessionId?: string;
  captureExecutionId?: string;
  /** Referência estrutural ao provider (OCR-01: azure). */
  providerReferenceId?: CanonicalOCRProviderReferenceId;
};

/**
 * Capacidades canônicas tecnológicas do OCR Runtime (modelo de domínio).
 * Declaração informativa — execução real ocorre via OCRProviderPort.
 */
export type CanonicalOCRCapabilities = {
  kind: "canonical-ocr-capabilities";
  supportsPdf: boolean;
  supportsImage: boolean;
  supportsBatch: boolean;
  supportsStreaming: boolean;
  supportsHandwriting: boolean;
  supportsTables: boolean;
  supportsForms: boolean;
  supportsConfidenceScore: boolean;
  declared?: readonly string[];
};

/** Configuração canônica do OCR Runtime. */
export type CanonicalOCRConfiguration = {
  kind: "canonical-ocr-configuration";
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
  languageHint?: string;
  contentTypeHint?: string;
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
};

/**
 * Referências a providers OCR.
 * Conexão HTTP ocorre somente no Adapter do OCRProviderPort.
 */
export type CanonicalOCRProviderReferenceId =
  | "azure"
  | "google-vision"
  | "aws-textract"
  | "tesseract"
  | "mock";

/** Descritor estrutural de um provider. */
export type CanonicalOCRProviderReference = {
  kind: "canonical-ocr-provider-reference";
  providerReferenceId: CanonicalOCRProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only" | "available-via-ocr-provider-port";
  implementsRealOcr: boolean;
  connected: boolean;
};

/** Pedido canônico de coordenação OCR via Runtime. */
export type CanonicalOCRRequest = {
  kind: "canonical-ocr-request";
  identity: CanonicalOCRIdentity;
  metadata: CanonicalOCRMetadata;
  reference?: CanonicalOCRReference;
  capabilities?: CanonicalOCRCapabilities;
  configuration?: CanonicalOCRConfiguration;
  structuralNotes?: string;
};

/** Sessão canônica de OCR Runtime. */
export type CanonicalOCRSession = {
  kind: "canonical-ocr-session";
  runtimeSessionId: string;
  status: OCRRuntimeSessionStatus;
  request: CanonicalOCRRequest;
  executionId?: string;
  providerReferenceId?: CanonicalOCRProviderReferenceId;
  ocrProviderAdapterId?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
  /** true quando OCRProviderPort.process() executou extração. */
  realOcrExecuted?: boolean;
};

/**
 * Resultado canônico do OCR Runtime (coordenação e/ou execução).
 * Quando há OCR real, embute ProcessingOutput / DocumentProcessingResult (EPC-13).
 */
export type CanonicalOCRResult = {
  kind: "canonical-ocr-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalOCRSession;
  executionId?: string;
  providerReferenceId?: CanonicalOCRProviderReferenceId;
  message?: string;
  code?: string;
  realOcrExecuted?: boolean;
  /** Resultado canônico EPC-13 (quando process() executou). */
  processing?: DocumentProcessingResult;
  /** Saída canônica EPC-13 (quando process() executou). */
  output?: ProcessingOutput;
};
