/**
 * Modelos canônicos do Document Intake Runtime — DIP-01.
 *
 * Representação estrutural da sessão de intake na Document Intelligence Platform.
 * Sem OCR. Sem IA. Sem XML/TISS. Sem parser. Sem classificação documental.
 * Sem Workflow novo. Sem Rule Engine novo.
 */

/** Status estrutural da sessão de intake no Runtime. */
export type DocumentIntakeRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "registering"
  | "registered"
  | "failed";

/** Identidade canônica do documento no intake (referências opacas). */
export type CanonicalDocumentIntakeIdentity = {
  kind: "canonical-document-intake-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Metadados canônicos estruturais da sessão. */
export type CanonicalDocumentIntakeMetadata = {
  kind: "canonical-document-intake-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Origem canônica do documento. */
export type CanonicalDocumentIntakeSource = {
  kind: "canonical-document-intake-source";
  sourceType: "UPLOAD" | "API" | "WATCH_FOLDER" | "EMAIL" | "SCANNER" | "OUTRO" | (string & {});
  channel?: string;
};

/** Referência canônica opaca a artefatos Enterprise / produto. */
export type CanonicalDocumentIntakeReference = {
  kind: "canonical-document-intake-reference";
  storageKey?: string;
  storageContainer?: string;
  storageProvider?: string;
  metadataId?: string;
  metadataNamespace?: string;
  intakeId?: string;
  executionId?: string;
};

/**
 * Capacidades canônicas do Document Intake Runtime (modelo de domínio).
 * Distintas de DocumentIntakeRuntimeCapabilities (Port/adapter).
 */
export type CanonicalDocumentIntakeCapabilities = {
  kind: "canonical-document-intake-capabilities";
  declared: readonly string[];
};

/** Pedido canônico de registro de intake via Runtime. */
export type CanonicalDocumentIntakeRequest = {
  kind: "canonical-document-intake-request";
  identity: CanonicalDocumentIntakeIdentity;
  metadata: CanonicalDocumentIntakeMetadata;
  source: CanonicalDocumentIntakeSource;
  reference?: CanonicalDocumentIntakeReference;
  capabilities?: CanonicalDocumentIntakeCapabilities;
  structuralNotes?: string;
};

/** Sessão canônica de Document Intake Runtime. */
export type CanonicalDocumentIntakeSession = {
  kind: "canonical-document-intake-session";
  runtimeSessionId: string;
  status: DocumentIntakeRuntimeSessionStatus;
  request: CanonicalDocumentIntakeRequest;
  intakeId?: string;
  executionId?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
};

/** Resultado canônico do registro via Runtime. */
export type CanonicalDocumentIntakeResult = {
  kind: "canonical-document-intake-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalDocumentIntakeSession;
  intakeId?: string;
  executionId?: string;
  message?: string;
  code?: string;
};
