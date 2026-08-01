/**
 * Tipos vendor-agnósticos da camada Tenant Assignment Objects — EPC-10B.
 *
 * Nenhum tipo de usuário, autenticação, RBAC, permissão, contrato,
 * operadora, regra clínica, TISS, documento de negócio ou workflow
 * operacional deve aparecer aqui.
 *
 * Assignment representa apenas uma ASSOCIAÇÃO CANÔNICA entre um Tenant
 * e outro componente Enterprise. Nunca configuração, regra ou vínculo operacional.
 */

/** Provedores / mecanismos de tenant assignment (extensível). */
export type TenantAssignmentProviderId =
  | "default"
  | "mock"
  | "test"
  | "database"
  | "remote"
  | "registry";

/** Resultado de health check. */
export type TenantAssignmentHealth = {
  ok: boolean;
  provider: TenantAssignmentProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type TenantAssignmentCapabilities = {
  provider: TenantAssignmentProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsCreateAssignment: boolean;
  supportsGetAssignment: boolean;
  supportsListAssignments: boolean;
  /** Discriminador dos cinco Assignment Objects canônicos. */
  supportsAssignmentKinds: boolean;
  /** Ciclo de vida estrutural (ACTIVE / INACTIVE / …). */
  supportsLifecycleStatus: boolean;
  /** Versionamento estrutural. */
  supportsVersioning: boolean;
  /** Referências opacas a Metadata Engine (sem acoplamento). */
  supportsMetadataReference: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * AssignmentKind — discriminador dos cinco objetos canônicos (FASE 6)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Qual dos cinco Assignment Objects canônicos.
 * Enumeração pura — sem lógica, sem carregamento do componente alvo.
 */
export type TenantAssignmentKind =
  | "RULE_PACK"
  | "STORAGE"
  | "CONFIGURATION"
  | "AI_PROVIDER"
  | "DOCUMENT";

export const TENANT_ASSIGNMENT_KINDS: readonly TenantAssignmentKind[] = [
  "RULE_PACK",
  "STORAGE",
  "CONFIGURATION",
  "AI_PROVIDER",
  "DOCUMENT",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade / status / versão / prioridade
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de Assignment (canônico). */
export type AssignmentId = string;

/** Versão estrutural do assignment (rótulo livre). */
export type AssignmentVersion = string;

/** Tag genérica — classificação livre. */
export type AssignmentTag = string;

/** Prioridade estrutural (número opaco — sem regra de negócio). */
export type AssignmentPriority = number;

/**
 * Status estrutural genérico do Assignment (FASE 8).
 * Sem semântica operacional, autenticação ou contrato.
 */
export type AssignmentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DRAFT"
  | "DEPRECATED"
  | "ARCHIVED"
  | (string & {});

export const ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "DRAFT",
  "DEPRECATED",
  "ARCHIVED",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem ligação operacional)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca ao Tenant (EPC-10A) — sem carregar o Tenant. */
export type TenantReference = {
  tenantId: string;
  code?: string;
  externalId?: string;
  version?: string;
};

/**
 * Referência opaca ao componente alvo (Rule Pack, Storage, …).
 * Sem carregar, validar ou invocar o alvo.
 */
export type TargetReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
  uri?: string;
};

/** Referência opaca a artefato do Metadata Engine. */
export type AssignmentMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Campos canônicos exclusivos (FASE 7) — somente os listados
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Campos canônicos de qualquer Assignment Object.
 *
 * Campos permitidos (exclusivos):
 * AssignmentId | TenantReference | TargetReference | Status | Version |
 * CreatedAt | UpdatedAt | Priority | MetadataReference | Tags |
 * CustomAttributes | ActivationDate | ExpirationDate
 *
 * `assignmentKind` é o discriminador estrutural do objeto canônico
 * (qual dos cinco); não é lógica de negócio.
 */
export type TenantAssignmentFields = {
  assignmentId: AssignmentId;
  tenantReference: TenantReference;
  targetReference: TargetReference;
  status: AssignmentStatus;
  version?: AssignmentVersion;
  createdAt: string;
  updatedAt: string;
  priority?: AssignmentPriority;
  metadataReference?: AssignmentMetadataReference;
  tags?: readonly AssignmentTag[];
  /** Atributos livres opacos — sem schema clínico/contratual. */
  customAttributes?: Readonly<Record<string, unknown>>;
  activationDate?: string;
  expirationDate?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Cinco Assignment Objects canônicos (FASE 6) — somente modelos
 * ───────────────────────────────────────────────────────────────────────── */

/** Associação canônica Tenant ↔ Rule Pack (sem carregar packs). */
export type TenantRulePackAssignment = TenantAssignmentFields & {
  assignmentKind: "RULE_PACK";
};

/** Associação canônica Tenant ↔ Storage (sem I/O). */
export type TenantStorageAssignment = TenantAssignmentFields & {
  assignmentKind: "STORAGE";
};

/** Associação canônica Tenant ↔ Configuration (sem resolver config). */
export type TenantConfigurationAssignment = TenantAssignmentFields & {
  assignmentKind: "CONFIGURATION";
};

/** Associação canônica Tenant ↔ AI Provider (sem invocar modelos). */
export type TenantAIProviderAssignment = TenantAssignmentFields & {
  assignmentKind: "AI_PROVIDER";
};

/** Associação canônica Tenant ↔ Document Identity (sem carregar documentos). */
export type TenantDocumentAssignment = TenantAssignmentFields & {
  assignmentKind: "DOCUMENT";
};

/** União dos cinco Assignment Objects canônicos. */
export type TenantAssignment =
  | TenantRulePackAssignment
  | TenantStorageAssignment
  | TenantConfigurationAssignment
  | TenantAIProviderAssignment
  | TenantDocumentAssignment;

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de criação — campos gerados pelo adapter quando omitidos:
 * assignmentId, createdAt, updatedAt, status default.
 */
export type CreateAssignmentInput = {
  assignment: Omit<TenantAssignment, "assignmentId" | "createdAt" | "updatedAt" | "status"> & {
    assignmentId?: AssignmentId;
    createdAt?: string;
    updatedAt?: string;
    status?: AssignmentStatus;
  };
};

export type CreateAssignmentResult = {
  ok: boolean;
  assignmentId: AssignmentId;
  assignment?: TenantAssignment;
  message?: string;
};

export type GetAssignmentInput = {
  assignmentId: AssignmentId;
};

export type GetAssignmentResult = {
  ok: boolean;
  assignment?: TenantAssignment;
  message?: string;
};

export type ListAssignmentsInput = {
  assignmentKind?: TenantAssignmentKind;
  tenantId?: string;
  status?: AssignmentStatus;
  tag?: AssignmentTag;
  /** Prefixo de assignmentId opcional. */
  idPrefix?: string;
  /** Id opaco do alvo (targetReference.id). */
  targetId?: string;
};

export type ListAssignmentsResult = {
  ok: boolean;
  assignments: readonly TenantAssignment[];
  message?: string;
};

/** Opções de resolução do TenantAssignmentPort (provider factory). */
export type TenantAssignmentProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: TenantAssignmentProviderId;
};
