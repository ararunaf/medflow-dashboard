/**
 * Modelos canônicos do Capture Engine Runtime — DIP-02.
 *
 * Representação estrutural da sessão de captura na Document Intelligence Platform.
 * Sem OCR. Sem IA. Sem XML/TISS. Sem parser. Sem classificação documental.
 * Sem Storage Manager. Sem versionamento. Sem busca. Sem Workflow. Sem Rule Engine.
 */

/** Status estrutural da sessão de captura no Runtime. */
export type CaptureEngineRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "registering"
  | "registered"
  | "failed";

/** Identidade canônica do documento na captura (referências opacas). */
export type CanonicalCaptureIdentity = {
  kind: "canonical-capture-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Metadados canônicos estruturais da sessão de captura. */
export type CanonicalCaptureMetadata = {
  kind: "canonical-capture-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Referência canônica opaca a artefatos Enterprise / produto. */
export type CanonicalCaptureReference = {
  kind: "canonical-capture-reference";
  storageKey?: string;
  storageContainer?: string;
  storageProvider?: string;
  metadataId?: string;
  metadataNamespace?: string;
  intakeId?: string;
  executionId?: string;
  intakeRuntimeSessionId?: string;
};

/**
 * Capacidades canônicas do Capture Engine Runtime (modelo de domínio).
 * Distintas de CaptureEngineRuntimeCapabilities (Port/adapter).
 */
export type CanonicalCaptureCapabilities = {
  kind: "canonical-capture-capabilities";
  declared: readonly string[];
};

/** Configuração canônica estrutural da captura (sem processamento documental). */
export type CanonicalCaptureConfiguration = {
  kind: "canonical-capture-configuration";
  sourceType?: "UPLOAD" | "API" | "WATCH_FOLDER" | "EMAIL" | "SCANNER" | "OUTRO" | (string & {});
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
};

/** Pedido canônico de registro de captura via Runtime. */
export type CanonicalCaptureRequest = {
  kind: "canonical-capture-request";
  identity: CanonicalCaptureIdentity;
  metadata: CanonicalCaptureMetadata;
  reference?: CanonicalCaptureReference;
  capabilities?: CanonicalCaptureCapabilities;
  configuration?: CanonicalCaptureConfiguration;
  structuralNotes?: string;
};

/** Sessão canônica de Capture Engine Runtime. */
export type CanonicalCaptureSession = {
  kind: "canonical-capture-session";
  runtimeSessionId: string;
  status: CaptureEngineRuntimeSessionStatus;
  request: CanonicalCaptureRequest;
  intakeId?: string;
  executionId?: string;
  intakeRuntimeSessionId?: string;
  intakeExecutionId?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
};

/** Resultado canônico do registro via Capture Engine Runtime. */
export type CanonicalCaptureResult = {
  kind: "canonical-capture-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalCaptureSession;
  intakeId?: string;
  executionId?: string;
  intakeRuntimeSessionId?: string;
  message?: string;
  code?: string;
};
