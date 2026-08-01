/**
 * Tipos vendor-agnósticos da camada Tenant Foundation — EPC-10A.
 *
 * Nenhum tipo de usuário, autenticação, RBAC, permissão, contrato,
 * operadora, regra, documento, workflow ou domínio clínico deve aparecer aqui.
 *
 * Tenant representa uma ORGANIZAÇÃO genérica.
 * Nunca uma cooperativa, operadora, hospital ou clínica específicos —
 * esses são apenas valores possíveis de OrganizationType.
 */

/** Provedores / mecanismos de tenant (extensível). */
export type TenantProviderId = "default" | "mock" | "test" | "database" | "remote" | "registry";

/** Resultado de health check. */
export type TenantHealth = {
  ok: boolean;
  provider: TenantProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type TenantCapabilities = {
  provider: TenantProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsCreateTenant: boolean;
  supportsGetTenant: boolean;
  supportsListTenants: boolean;
  /** Referências opacas a Metadata Engine (sem acoplamento). */
  supportsMetadataReference: boolean;
  /** Referências opacas a Configuration Engine (sem acoplamento). */
  supportsConfigurationReference: boolean;
  /** OrganizationType enumerado (sem lógica de domínio). */
  supportsOrganizationTypes: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * OrganizationType (FASE 7) — somente enumeração, sem lógica
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Tipos organizacionais canônicos.
 * Enumeração pura — sem comportamento, sem validação de domínio.
 */
export type OrganizationType =
  | "COOPERATIVE"
  | "HOSPITAL"
  | "CLINIC"
  | "LABORATORY"
  | "INSURANCE"
  | "HEALTH_NETWORK"
  | "COMPANY"
  | "OTHER";

export const ORGANIZATION_TYPES: readonly OrganizationType[] = [
  "COOPERATIVE",
  "HOSPITAL",
  "CLINIC",
  "LABORATORY",
  "INSURANCE",
  "HEALTH_NETWORK",
  "COMPANY",
  "OTHER",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade / status / versão
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de Tenant (canônico). */
export type TenantId = string;

/** Nome legal / organizacional. */
export type OrganizationName = string;

/** Nome de exibição. */
export type TenantDisplayName = string;

/** Código curto / mnemônico. */
export type TenantCode = string;

/** Id externo (vendor / sistema legado). */
export type TenantExternalId = string;

/** Tag genérica — classificação livre. */
export type TenantTag = string;

/** Versão estrutural do tenant (rótulo livre). */
export type TenantVersion = string;

/**
 * Status estrutural genérico do Tenant.
 * Sem semântica de autenticação, assinatura ou contrato.
 */
export type TenantStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "suspended"
  | "unknown"
  | (string & {});

export const TENANT_STATUSES: readonly TenantStatus[] = [
  "draft",
  "active",
  "inactive",
  "archived",
  "suspended",
  "unknown",
] as const;

/**
 * Capacidade declarada pelo próprio Tenant (campo do modelo).
 * Distinta de TenantCapabilities (adapter/Port).
 */
export type TenantDeclaredCapability = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem associação operacional)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a artefato do Metadata Engine. */
export type TenantMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a artefato do Configuration Engine. */
export type TenantConfigurationReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  scope?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Tenant canônico (FASE 6) — somente campos listados
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Modelo canônico de Tenant.
 *
 * Campos permitidos (exclusivos):
 * TenantId | OrganizationName | OrganizationType | Status | Version |
 * CreatedAt | UpdatedAt | DisplayName | Code | ExternalId |
 * MetadataReference | ConfigurationReference | Tags |
 * CustomAttributes | Capabilities
 *
 * Associações operacionais (Rule Packs, AI Providers, Storage, …)
 * pertencem exclusivamente à EPC-10B — Tenant Assignments.
 */
export type Tenant = {
  tenantId: TenantId;
  organizationName: OrganizationName;
  organizationType: OrganizationType;
  status: TenantStatus;
  version?: TenantVersion;
  createdAt: string;
  updatedAt: string;
  displayName?: TenantDisplayName;
  code?: TenantCode;
  externalId?: TenantExternalId;
  metadataReference?: TenantMetadataReference;
  configurationReference?: TenantConfigurationReference;
  tags?: readonly TenantTag[];
  /** Atributos livres opacos — sem schema clínico/contratual. */
  customAttributes?: Readonly<Record<string, unknown>>;
  /** Capacidades declaradas pelo Tenant (não confundir com Port.capabilities). */
  capabilities?: readonly TenantDeclaredCapability[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de criação — campos gerados pelo adapter quando omitidos:
 * tenantId, createdAt, updatedAt, status default.
 */
export type CreateTenantInput = {
  tenant: Omit<Tenant, "tenantId" | "createdAt" | "updatedAt" | "status"> & {
    tenantId?: TenantId;
    createdAt?: string;
    updatedAt?: string;
    status?: TenantStatus;
  };
};

export type CreateTenantResult = {
  ok: boolean;
  tenantId: TenantId;
  tenant?: Tenant;
  message?: string;
};

export type GetTenantInput = {
  tenantId: TenantId;
};

export type GetTenantResult = {
  ok: boolean;
  tenant?: Tenant;
  message?: string;
};

export type ListTenantsInput = {
  organizationType?: OrganizationType;
  status?: TenantStatus;
  tag?: TenantTag;
  /** Prefixo de tenantId opcional. */
  idPrefix?: string;
  code?: TenantCode;
  externalId?: TenantExternalId;
};

export type ListTenantsResult = {
  ok: boolean;
  tenants: readonly Tenant[];
  message?: string;
};

/** Opções de resolução do TenantPort (provider factory). */
export type TenantProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: TenantProviderId;
};
