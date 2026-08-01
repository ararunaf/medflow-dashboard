/**
 * Tipos vendor-agnósticos da camada Rule Pack Management — EPC-09.
 *
 * Nenhum tipo clínico, TISS, operadora, cooperativa, contrato, guia,
 * paciente, auditoria, OCR, IA ou Workflow de produto deve aparecer aqui.
 *
 * Rule Pack é apenas um contêiner versionado de regras.
 * Ele NÃO representa operadora, cooperativa ou contrato.
 */

/** Provedores / mecanismos de rule pack (extensível). */
export type RulePackProviderId = "default" | "mock" | "test" | "database" | "remote" | "registry";

/** Resultado de health check. */
export type RulePackHealth = {
  ok: boolean;
  provider: RulePackProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type RulePackCapabilities = {
  provider: RulePackProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsCreatePack: boolean;
  supportsGetPack: boolean;
  supportsListPacks: boolean;
  supportsEnablePack: boolean;
  supportsDisablePack: boolean;
  /** Versionamento estrutural (sem persistência real). */
  supportsVersioning: boolean;
  /** Dependências entre packs (sem resolução automática). */
  supportsDependencies: boolean;
  /** Referências opacas a Rules (sem acoplamento ao RulePort). */
  supportsRuleReferences: boolean;
  /** Referências opacas a Metadata Engine. */
  supportsMetadataReference: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade / status / prioridade
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de um Rule Pack. */
export type PackId = string;

/** Nome lógico do pack. */
export type RulePackName = string;

/** Tag genérica — classificação livre. */
export type RulePackTag = string;

/** Versão estrutural do pack (rótulo livre). */
export type RulePackVersion = string;

/**
 * Status operacional do pack.
 * Sem semântica clínica / contratual.
 */
export type RulePackStatus = "draft" | "enabled" | "disabled" | "archived";

export const RULE_PACK_STATUSES: readonly RulePackStatus[] = [
  "draft",
  "enabled",
  "disabled",
  "archived",
] as const;

/**
 * Priority estrutural — catálogo genérico.
 * Sem scheduling / fila nesta sprint.
 */
export type RulePackPriority = "critical" | "high" | "medium" | "low" | "informational";

export const RULE_PACK_PRIORITIES: readonly RulePackPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

/** Autor genérico (string livre — sem identidade de domínio). */
export type RulePackAuthor = string;

/**
 * Capacidade declarada pelo próprio pack (campo do modelo).
 * Distinta de RulePackCapabilities (adapter/Port).
 */
export type RulePackDeclaredCapability = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Versionamento (FASE 7) — sem persistência real
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Compatibilidade estrutural entre versões.
 * Rótulo livre (ex.: "backward", "breaking", "1.x").
 */
export type RulePackCompatibility = string;

/**
 * Lifecycle de versionamento (distinto de Status operacional).
 * Sem política de publicação de produto.
 */
export type RulePackLifecycle = "draft" | "published" | "deprecated" | "retired" | (string & {});

export const RULE_PACK_LIFECYCLES: readonly RulePackLifecycle[] = [
  "draft",
  "published",
  "deprecated",
  "retired",
] as const;

/**
 * Bloco de versionamento agregado (helpers / prep).
 * Campos equivalentes também vivem no modelo canônico.
 */
export type RulePackVersionInfo = {
  version: RulePackVersion;
  previousVersion?: RulePackVersion;
  nextVersion?: RulePackVersion;
  compatibility?: RulePackCompatibility;
  lifecycle?: RulePackLifecycle;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Dependências entre Packs (FASE 8) — só infraestrutura
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Dependência estrutural: Pack A depende do Pack B.
 * NÃO resolve automaticamente; NÃO carrega o pack alvo.
 */
export type RulePackDependency = {
  /** PackId do pack dependido. */
  packId: PackId;
  /** Versão / faixa opcional (rótulo livre). */
  version?: RulePackVersion;
  /** Se true, a ausência do alvo não é bloqueante (prep). */
  optional?: boolean;
  /** Rótulo livre de relacionamento. */
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a RulePort / MetadataPort)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência opaca a uma Rule do Rule Engine.
 * Ids são strings — sem import do módulo rule.
 */
export type RuleReference = {
  ruleId?: string;
  ruleName?: string;
  ruleNamespace?: string;
  ruleVersion?: string;
};

/** Referência opaca a artefato do Metadata Engine. */
export type RulePackMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Modelo canônico do Rule Pack (FASE 6)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Rule Pack — contêiner versionado de regras.
 *
 * Campos permitidos (exclusivos):
 * PackId | Name | Description | Version | Status | Priority |
 * CreatedAt | UpdatedAt | Author | RuleReferences | MetadataReference |
 * Dependencies | Tags | Capabilities | CustomAttributes
 *
 * Versionamento (FASE 7): PreviousVersion | NextVersion | Compatibility | Lifecycle
 *
 * Nenhum conceito clínico, TISS, operadora, cooperativa, contrato, guia ou paciente.
 */
export type RulePack = {
  packId: PackId;
  name: RulePackName;
  description?: string;
  version: RulePackVersion;
  previousVersion?: RulePackVersion;
  nextVersion?: RulePackVersion;
  compatibility?: RulePackCompatibility;
  lifecycle?: RulePackLifecycle;
  status: RulePackStatus;
  priority?: RulePackPriority;
  createdAt: string;
  updatedAt: string;
  author?: RulePackAuthor;
  ruleReferences?: readonly RuleReference[];
  metadataReference?: RulePackMetadataReference;
  dependencies?: readonly RulePackDependency[];
  tags?: readonly RulePackTag[];
  /** Capacidades declaradas pelo pack (não confundir com Port capabilities). */
  capabilities?: readonly RulePackDeclaredCapability[];
  /** Atributos livres opacos — sem schema clínico. */
  customAttributes?: Readonly<Record<string, unknown>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de criação — campos gerados pelo adapter quando omitidos:
 * packId, createdAt, updatedAt, status/version defaults.
 */
export type CreatePackInput = {
  pack: Omit<RulePack, "packId" | "createdAt" | "updatedAt" | "status" | "version"> & {
    packId?: PackId;
    createdAt?: string;
    updatedAt?: string;
    status?: RulePackStatus;
    version?: RulePackVersion;
  };
};

export type CreatePackResult = {
  ok: boolean;
  packId: PackId;
  pack?: RulePack;
  message?: string;
  code?: string;
};

export type GetPackInput = {
  packId: PackId;
};

export type GetPackResult = {
  ok: boolean;
  pack?: RulePack;
  message?: string;
  code?: string;
};

export type ListPacksInput = {
  status?: RulePackStatus;
  priority?: RulePackPriority;
  tag?: RulePackTag;
  author?: RulePackAuthor;
  lifecycle?: RulePackLifecycle;
  /** Prefixo de packId opcional. */
  idPrefix?: string;
  /** Prefixo de name opcional. */
  namePrefix?: string;
  /** PackId de uma dependência (filtra packs que dependem deste). */
  dependsOn?: PackId;
};

export type ListPacksResult = {
  ok: boolean;
  packs: readonly RulePack[];
  message?: string;
  code?: string;
};

export type EnablePackInput = {
  packId: PackId;
};

export type EnablePackResult = {
  ok: boolean;
  pack?: RulePack;
  message?: string;
  code?: string;
};

export type DisablePackInput = {
  packId: PackId;
};

export type DisablePackResult = {
  ok: boolean;
  pack?: RulePack;
  message?: string;
  code?: string;
};

/** Opções de resolução do RulePackPort (provider factory). */
export type RulePackProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: RulePackProviderId;
};
