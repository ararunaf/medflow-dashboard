/**
 * Modelos canônicos do Document Classification Runtime — DIP-04.
 *
 * Representação estrutural da sessão de classificação documental na
 * Document Intelligence Platform.
 * Sem classificação real. Sem IA. Sem LLM. Sem embeddings. Sem ML.
 * Sem OCR para classificação. Sem regras de negócio. Sem heurísticas.
 * Sem identificação automática de tipos documentais.
 */

/** Status estrutural da sessão de classificação no Runtime. */
export type DocumentClassificationRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "deferred"
  | "failed";

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
 * Todas FALSE / informativas — nenhuma capacidade é executada (DIP-04).
 */
export type CanonicalDocumentClassificationCapabilities = {
  kind: "canonical-document-classification-capabilities";
  supportsMedicalGuideClassification: false;
  supportsInvoiceClassification: false;
  supportsContractClassification: false;
  supportsBatchClassification: false;
  supportsConfidenceScore: false;
  supportsMultiLabelClassification: false;
  supportsCustomModels: false;
  supportsRuleBasedClassification: false;
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
 * Referências estruturais a Classification Providers futuros.
 * NÃO são implementações. NÃO conectam serviços externos.
 */
export type CanonicalDocumentClassificationProviderReferenceId =
  | "ai-classifier"
  | "rule-based-classifier"
  | "ml-classifier"
  | "hybrid-classifier"
  | "mock";

/** Descritor estrutural de um Classification Provider futuro. */
export type CanonicalDocumentClassificationProviderReference = {
  kind: "canonical-document-classification-provider-reference";
  providerReferenceId: CanonicalDocumentClassificationProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only";
  implementsRealClassification: false;
  implementsAi: false;
  implementsMachineLearning: false;
  implementsRuleEngine: false;
  connected: false;
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
  /** Sempre false nesta sprint — coordenação sem execução. */
  realClassificationExecuted?: false;
};

/** Resultado canônico da coordenação via Document Classification Runtime. */
export type CanonicalDocumentClassificationResult = {
  kind: "canonical-document-classification-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalDocumentClassificationSession;
  executionId?: string;
  providerReferenceId?: CanonicalDocumentClassificationProviderReferenceId;
  message?: string;
  code?: string;
  /** Sempre false nesta sprint. */
  realClassificationExecuted?: false;
};
