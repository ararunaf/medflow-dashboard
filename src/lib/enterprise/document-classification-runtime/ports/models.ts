/**
 * Modelos canônicos do Document Classification Runtime — DIP-04 / CLASS-01.
 *
 * Coordenação + execução via DocumentClassificationProviderPort.
 * Sem IA. Sem LLM. Sem embeddings. Sem ML. Sem RAG.
 * Consome exclusivamente resultado produzido pelo OCR Runtime.
 * Resultado canônico único: CanonicalDocumentClassificationResult.
 */

/** Status estrutural da sessão de classificação no Runtime. */
export type DocumentClassificationRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "processing"
  | "completed"
  | "deferred"
  | "failed";

/** Tipo documental canônico (CLASS-01 — rule-based). */
export type CanonicalDocumentClassificationType =
  | "guia-tiss"
  | "solicitacao"
  | "prontuario"
  | "laudo"
  | "documento-administrativo"
  | "documento-financeiro"
  | "documento-desconhecido";

/** Telemetria estrutural canônica (embutida no resultado). */
export type CanonicalDocumentClassificationTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  matchedRuleCount?: number;
  documentType?: CanonicalDocumentClassificationType;
};
/** Identidade canônica do documento na classificação (referências opacas). */
export type CanonicalDocumentClassificationIdentity = {
  kind: "canonical-document-classification-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Metadados canônicos estruturais da sessão de classificação. */
export type CanonicalDocumentClassificationMetadata = {
  kind: "canonical-document-classification-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Referência canônica opaca a artefatos Enterprise / produto / OCR / captura. */
export type CanonicalDocumentClassificationReference = {
  kind: "canonical-document-classification-reference";
  storageKey?: string;
  storageContainer?: string;
  storageProvider?: string;
  metadataId?: string;
  metadataNamespace?: string;
  intakeId?: string;
  executionId?: string;
  captureRuntimeSessionId?: string;
  captureExecutionId?: string;
  /** DIP-03 — referência estrutural à sessão OCR Runtime (sem OCR real). */
  ocrRuntimeSessionId?: string;
  ocrExecutionId?: string;
  /** Referência estrutural ao Classification Provider futuro (nunca executado). */
  providerReferenceId?: CanonicalDocumentClassificationProviderReferenceId;
};

/**
 * Capacidades canônicas tecnológicas do Classification Runtime (modelo de domínio).
 * Declaração informativa — execução real ocorre via DocumentClassificationProviderPort.
 */
export type CanonicalDocumentClassificationCapabilities = {
  kind: "canonical-document-classification-capabilities";
  supportsMedicalGuideClassification: boolean;
  supportsInvoiceClassification: boolean;
  supportsContractClassification: boolean;
  supportsBatchClassification: boolean;
  supportsConfidenceScore: boolean;
  supportsMultiLabelClassification: boolean;
  supportsCustomModels: boolean;
  supportsRuleBasedClassification: boolean;
  declared?: readonly string[];
};

/** Configuração canônica estrutural da classificação (sem processamento). */
export type CanonicalDocumentClassificationConfiguration = {
  kind: "canonical-document-classification-configuration";
  /** Provider futuro referenciado estruturalmente — sem bind / sem HTTP. */
  preferredProviderReference?: CanonicalDocumentClassificationProviderReferenceId;
  languageHint?: string;
  contentTypeHint?: string;
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
};

/**
 * Referências a Classification Providers.
 * Execução ocorre somente no Adapter do DocumentClassificationProviderPort.
 */
export type CanonicalDocumentClassificationProviderReferenceId =
  | "ai-classifier"
  | "rule-based-classifier"
  | "ml-classifier"
  | "hybrid-classifier"
  | "mock";

/** Descritor de um Classification Provider referenciado pelo Runtime. */
export type CanonicalDocumentClassificationProviderReference = {
  kind: "canonical-document-classification-provider-reference";
  providerReferenceId: CanonicalDocumentClassificationProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only" | "available-via-document-classification-provider-port";
  implementsRealClassification: boolean;
  implementsAi: boolean;
  implementsMachineLearning: boolean;
  implementsRuleEngine: boolean;
  connected: boolean;
};

/** Pedido canônico de coordenação de classificação via Runtime. */
export type CanonicalDocumentClassificationRequest = {
  kind: "canonical-document-classification-request";
  identity: CanonicalDocumentClassificationIdentity;
  metadata: CanonicalDocumentClassificationMetadata;
  reference?: CanonicalDocumentClassificationReference;
  capabilities?: CanonicalDocumentClassificationCapabilities;
  configuration?: CanonicalDocumentClassificationConfiguration;
  structuralNotes?: string;
};

/** Sessão canônica de Document Classification Runtime. */
export type CanonicalDocumentClassificationSession = {
  kind: "canonical-document-classification-session";
  runtimeSessionId: string;
  status: DocumentClassificationRuntimeSessionStatus;
  request: CanonicalDocumentClassificationRequest;
  executionId?: string;
  providerReferenceId?: CanonicalDocumentClassificationProviderReferenceId;
  classificationProviderAdapterId?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
  /** true quando DocumentClassificationProviderPort.classify() executou. */
  realClassificationExecuted?: boolean;
  documentType?: CanonicalDocumentClassificationType;
  confidence?: number;
  matchedRules?: readonly string[];
};

/**
 * Resultado canônico único da classificação documental (CLASS-01).
 * Sem modelos paralelos — coordenação e execução compartilham este tipo.
 */
export type CanonicalDocumentClassificationResult = {
  kind: "canonical-document-classification-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalDocumentClassificationSession;
  executionId?: string;
  providerReferenceId?: CanonicalDocumentClassificationProviderReferenceId;
  message?: string;
  code?: string;
  /** true quando DocumentClassificationProviderPort.classify() executou. */
  realClassificationExecuted?: boolean;
  /** Tipo documental classificado (CLASS-01). */
  documentType?: CanonicalDocumentClassificationType;
  /** Confiança da classificação rule-based. */
  confidence?: number;
  /** Regras que contribuíram para o resultado. */
  matchedRules?: readonly string[];
  /** Telemetria estrutural (timeout/retry/cancel). */
  telemetry?: CanonicalDocumentClassificationTelemetry;
};
