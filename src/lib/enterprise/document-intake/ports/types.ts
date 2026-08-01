/**
 * Tipos vendor-agnósticos da camada Document Intake Foundation — EPC-12.
 *
 * Nenhum tipo clínico, TISS, OCR, IA, captura, upload funcional, watcher,
 * scanner, e-mail, contrato específico, operadora ou cooperativa
 * deve aparecer aqui.
 *
 * Document Intake apenas recebe documentos e registra origem, estado
 * e referências estruturais opacas. Ele NÃO interpreta, NÃO extrai texto,
 * NÃO executa OCR, NÃO valida contratos e NÃO conhece TISS.
 *
 * Arquitetura obrigatória:
 *   Application → DocumentIntakePort → Adapter → Store → Factory → Provider
 */

/** Provedores / mecanismos de document intake (extensível). */
export type DocumentIntakeProviderId =
  | "default"
  | "mock"
  | "test"
  | "database"
  | "remote"
  | "registry";

/** Resultado de health check. */
export type DocumentIntakeHealth = {
  ok: boolean;
  provider: DocumentIntakeProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type DocumentIntakeCapabilities = {
  provider: DocumentIntakeProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsCreateIntake: boolean;
  supportsGetIntake: boolean;
  supportsListIntakes: boolean;
  /** Múltiplas origens via SourceType. */
  supportsMultipleSources: boolean;
  /** Referências opacas a Document Identity. */
  supportsDocumentIdentityReference: boolean;
  /** Referências opacas a Storage (sem I/O). */
  supportsStorageReference: boolean;
  /** Referências opacas a Metadata Engine. */
  supportsMetadataReference: boolean;
  /** Referências opacas a Workflow. */
  supportsWorkflowReference: boolean;
  /** Referências opacas a Configuration. */
  supportsConfigurationReference: boolean;
  /** Ciclo de vida estrutural (sem operação). */
  supportsLifecycle: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * SourceType (FASE 7) — somente enumeração, sem lógica
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Origem documental estrutural.
 * Enumeração apenas — sem upload, watcher, scanner, e-mail ou I/O.
 */
export type SourceType =
  | "UPLOAD"
  | "WATCH_FOLDER"
  | "API"
  | "EMAIL"
  | "SCANNER"
  | "TWAIN"
  | "WIA"
  | "FILE_SYSTEM"
  | "XML"
  | "JSON"
  | "WEBSERVICE"
  | "OUTRO"
  | (string & {});

export const SOURCE_TYPES: readonly SourceType[] = [
  "UPLOAD",
  "WATCH_FOLDER",
  "API",
  "EMAIL",
  "SCANNER",
  "TWAIN",
  "WIA",
  "FILE_SYSTEM",
  "XML",
  "JSON",
  "WEBSERVICE",
  "OUTRO",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Lifecycle / Status (FASE 8) — estrutural, sem operação
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estados estruturais do intake.
 * Preparação apenas — sem fila real, sem processamento, sem arquivamento operacional.
 */
export type IntakeStatus =
  | "RECEIVED"
  | "QUEUED"
  | "READY"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED"
  | (string & {});

export const INTAKE_STATUSES: readonly IntakeStatus[] = [
  "RECEIVED",
  "QUEUED",
  "READY",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "ARCHIVED",
] as const;

/** Prioridade estrutural genérica (rótulo livre / valores conhecidos). */
export type IntakePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT" | (string & {});

export const INTAKE_PRIORITIES: readonly IntakePriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

/** Identificador estável de um Intake. */
export type IntakeId = string;

/** Tag genérica — classificação livre. */
export type IntakeTag = string;

/**
 * Capacidade declarada pelo próprio intake (campo do modelo).
 * Distinta de DocumentIntakeCapabilities (adapter/Port).
 */
export type IntakeDeclaredCapability = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Document Identity (sem import do módulo). */
export type IntakeDocumentIdentityReference = {
  documentId?: string;
  documentType?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Storage Port (sem I/O). */
export type IntakeStorageReference = {
  key?: string;
  container?: string;
  provider?: string;
  uri?: string;
};

/** Referência opaca a Metadata Engine. */
export type IntakeMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Workflow (sem import do módulo workflow). */
export type IntakeWorkflowReference = {
  workflowId?: string;
  name?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Configuration Engine. */
export type IntakeConfigurationReference = {
  id?: string;
  key?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/**
 * Referência opaca genérica a artefato Enterprise / externo futuro
 * (OCR Provider, AI Provider, Contract Foundation, …).
 * Ids e kinds são strings opacas — sem resolução nesta sprint.
 */
export type IntakeOpaqueReference = {
  id?: string;
  kind?: string;
  name?: string;
  version?: string;
  uri?: string;
  target?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Modelo canônico do Document Intake (FASE 6)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * DocumentIntake — estrutura canônica genérica de entrada documental.
 *
 * Campos permitidos (exclusivos):
 * IntakeId | SourceType | ReceivedAt | Status | Priority |
 * DocumentIdentityReference | StorageReference | MetadataReference |
 * WorkflowReference | ConfigurationReference | Tags | CustomAttributes |
 * Capabilities
 *
 * Nenhum campo específico de saúde / TISS / OCR / IA.
 */
export type DocumentIntake = {
  intakeId: IntakeId;
  sourceType: SourceType;
  receivedAt: string;
  status: IntakeStatus;
  priority?: IntakePriority;
  documentIdentityReference?: IntakeDocumentIdentityReference;
  storageReference?: IntakeStorageReference;
  metadataReference?: IntakeMetadataReference;
  workflowReference?: IntakeWorkflowReference;
  configurationReference?: IntakeConfigurationReference;
  tags?: readonly IntakeTag[];
  /** Atributos livres opacos — sem schema clínico / TISS. */
  customAttributes?: Readonly<Record<string, unknown>>;
  /** Capacidades declaradas pelo intake (não confundir com Port capabilities). */
  capabilities?: readonly IntakeDeclaredCapability[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de criação — campos gerados pelo adapter quando omitidos:
 * intakeId, receivedAt, status default (RECEIVED).
 */
export type CreateIntakeInput = {
  intake: Omit<DocumentIntake, "intakeId" | "receivedAt" | "status"> & {
    intakeId?: IntakeId;
    receivedAt?: string;
    status?: IntakeStatus;
  };
};

export type CreateIntakeResult = {
  ok: boolean;
  intakeId: IntakeId;
  intake?: DocumentIntake;
  message?: string;
  code?: string;
};

export type GetIntakeInput = {
  intakeId: IntakeId;
};

export type GetIntakeResult = {
  ok: boolean;
  intake?: DocumentIntake;
  message?: string;
  code?: string;
};

export type ListIntakesInput = {
  sourceType?: SourceType;
  status?: IntakeStatus;
  priority?: IntakePriority;
  tag?: IntakeTag;
  /** Prefixo de intakeId opcional. */
  idPrefix?: string;
  /** DocumentId opaco — filtra intakes que referenciam este documento. */
  documentId?: string;
  /** WorkflowId opaco — filtra intakes que referenciam este Workflow. */
  workflowId?: string;
};

export type ListIntakesResult = {
  ok: boolean;
  intakes: readonly DocumentIntake[];
  message?: string;
  code?: string;
};

/** Opções de resolução do DocumentIntakePort (provider factory). */
export type DocumentIntakeProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: DocumentIntakeProviderId;
};
