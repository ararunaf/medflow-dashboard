/**
 * Modelos canônicos do OCR Runtime — DIP-03.
 *
 * Representação estrutural da sessão OCR na Document Intelligence Platform.
 * Sem OCR real. Sem extração de texto. Sem interpretação documental.
 * Sem Azure / Google Vision / Textract / Tesseract. Sem I/O externo.
 */

/** Status estrutural da sessão OCR no Runtime. */
export type OCRRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
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
  /** Referência estrutural ao provider futuro (nunca executado nesta sprint). */
  providerReferenceId?: CanonicalOCRProviderReferenceId;
};

/**
 * Capacidades canônicas tecnológicas do OCR Runtime (modelo de domínio).
 * Todas FALSE / informativas — nenhuma capacidade é executada (DIP-03).
 */
export type CanonicalOCRCapabilities = {
  kind: "canonical-ocr-capabilities";
  supportsPdf: false;
  supportsImage: false;
  supportsBatch: false;
  supportsStreaming: false;
  supportsHandwriting: false;
  supportsTables: false;
  supportsForms: false;
  supportsConfidenceScore: false;
  declared?: readonly string[];
};

/** Configuração canônica estrutural do OCR (sem processamento). */
export type CanonicalOCRConfiguration = {
  kind: "canonical-ocr-configuration";
  /** Provider futuro referenciado estruturalmente — sem bind / sem HTTP. */
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
  languageHint?: string;
  contentTypeHint?: string;
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
};

/**
 * Referências estruturais a providers futuros.
 * NÃO são implementações. NÃO conectam serviços externos.
 */
export type CanonicalOCRProviderReferenceId =
  | "azure"
  | "google-vision"
  | "aws-textract"
  | "tesseract"
  | "mock";

/** Descritor estrutural de um provider futuro. */
export type CanonicalOCRProviderReference = {
  kind: "canonical-ocr-provider-reference";
  providerReferenceId: CanonicalOCRProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only";
  implementsRealOcr: false;
  connected: false;
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
  /** Sempre true nesta sprint — coordenação sem execução. */
  realOcrExecuted?: false;
};

/** Resultado canônico da coordenação via OCR Runtime. */
export type CanonicalOCRResult = {
  kind: "canonical-ocr-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalOCRSession;
  executionId?: string;
  providerReferenceId?: CanonicalOCRProviderReferenceId;
  message?: string;
  code?: string;
  /** Sempre false nesta sprint. */
  realOcrExecuted?: false;
};
