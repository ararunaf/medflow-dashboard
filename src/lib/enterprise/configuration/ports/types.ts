/**
 * Tipos vendor-agnósticos da camada de configuração — EPC-03.
 *
 * Nenhum tipo de cooperativa, operadora, contrato, OCR, IA, TISS ou Settings
 * de produto deve aparecer aqui. O Configuration Engine é genérico.
 */

/** Provedores / mecanismos de configuração (extensível). */
export type ConfigurationProviderId =
  | "default"
  | "mock"
  | "test"
  | "env"
  | "remote"
  | "database"
  | "redis";

/** Resultado de health check do mecanismo de configuração. */
export type ConfigurationHealth = {
  ok: boolean;
  provider: ConfigurationProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o store.
 */
export type ConfigurationCapabilities = {
  provider: ConfigurationProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsGet: boolean;
  supportsSet: boolean;
  supportsExists: boolean;
  supportsRemove: boolean;
  supportsList: boolean;
  supportsHierarchicalResolution: boolean;
  supportsFeatureFlags: boolean;
};

/**
 * Hierarquia oficial de configuração (estrutural).
 *
 * Application → Platform → Environment → Tenant → Module → Feature → User
 *
 * Nenhuma regra de negócio específica por camada é aplicada aqui.
 */
export type ConfigurationLayer =
  | "application"
  | "platform"
  | "environment"
  | "tenant"
  | "module"
  | "feature"
  | "user";

/** Ordem estrutural oficial (do mais amplo ao mais específico). */
export const CONFIGURATION_HIERARCHY: readonly ConfigurationLayer[] = [
  "application",
  "platform",
  "environment",
  "tenant",
  "module",
  "feature",
  "user",
] as const;

/**
 * Ordem de resolução hierárquica preparada (mais específico → menos específico).
 *
 * User → Module → Tenant → Platform → Default
 *
 * EPC-03 prepara a arquitetura; regras complexas de merge ficam para sprints futuras.
 */
export type ConfigurationResolutionLayer = "user" | "module" | "tenant" | "platform" | "default";

export const CONFIGURATION_RESOLUTION_ORDER: readonly ConfigurationResolutionLayer[] = [
  "user",
  "module",
  "tenant",
  "platform",
  "default",
] as const;

/** Escopo estrutural opcional de uma chave. */
export type ConfigurationScope = {
  layer: ConfigurationLayer;
  /** Identificador dentro da camada (ex.: tenant id, module id) — sem semântica de domínio. */
  id?: string;
};

/**
 * Tipos de valor suportados pelo Configuration Engine (prep tipagem).
 * Aceitos agora para evitar alterações arquiteturais futuras.
 */
export type ConfigurationValueKind =
  | "boolean"
  | "number"
  | "string"
  | "enum"
  | "json"
  | "collection";

/** Valor tipado genérico — sem regras de domínio. */
export type ConfigurationValue =
  | { kind: "boolean"; value: boolean }
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "enum"; value: string; enumName?: string }
  | { kind: "json"; value: unknown }
  | { kind: "collection"; value: readonly unknown[] };

/** Entrada armazenada / retornada pelo Port. */
export type ConfigurationEntry = {
  key: string;
  value: ConfigurationValue;
  scope?: ConfigurationScope;
  /** Camada efetiva após resolução (quando aplicável). */
  resolvedFrom?: ConfigurationResolutionLayer | ConfigurationLayer;
};

export type ConfigurationGetInput = {
  key: string;
  scope?: ConfigurationScope;
  /**
   * Quando true, prepara walk na ordem de resolução hierárquica.
   * EPC-03: implementação mínima (primeiro hit); sem merge complexo.
   */
  resolveHierarchy?: boolean;
  /** Contexto opcional para resolução (ids estruturais). */
  resolutionContext?: ConfigurationResolutionContext;
};

export type ConfigurationGetResult = {
  ok: boolean;
  key: string;
  entry?: ConfigurationEntry;
  message?: string;
};

export type ConfigurationSetInput = {
  key: string;
  value: ConfigurationValue;
  scope?: ConfigurationScope;
};

export type ConfigurationSetResult = {
  ok: boolean;
  key: string;
  message?: string;
};

export type ConfigurationExistsInput = {
  key: string;
  scope?: ConfigurationScope;
};

export type ConfigurationExistsResult = {
  ok: boolean;
  key: string;
  exists: boolean;
  message?: string;
};

export type ConfigurationRemoveInput = {
  key: string;
  scope?: ConfigurationScope;
};

export type ConfigurationRemoveResult = {
  ok: boolean;
  key: string;
  removed: boolean;
  message?: string;
};

export type ConfigurationListInput = {
  /** Prefixo lógico opcional. */
  prefix?: string;
  scope?: ConfigurationScope;
};

export type ConfigurationListResult = {
  ok: boolean;
  entries: readonly ConfigurationEntry[];
  message?: string;
};

/**
 * Contexto estrutural para resolução hierárquica (prep).
 * Campos opcionais — multi-tenant real NÃO é implementado nesta sprint.
 */
export type ConfigurationResolutionContext = {
  userId?: string;
  moduleId?: string;
  tenantId?: string;
  platformId?: string;
  environmentId?: string;
  featureId?: string;
};

/**
 * Feature Flag — infraestrutura apenas (EPC-03).
 * NÃO substitui feature flags atuais do produto.
 */
export type FeatureFlagKey = string;

export type FeatureFlagDefinition = {
  key: FeatureFlagKey;
  description?: string;
  /** Default estrutural; sem avaliação de regras de negócio. */
  defaultEnabled?: boolean;
};

export type FeatureFlagState = {
  key: FeatureFlagKey;
  enabled: boolean;
  /** Origem estrutural do valor (quando resolvido). */
  resolvedFrom?: ConfigurationResolutionLayer | ConfigurationLayer | "definition-default";
};

/** Opções de resolução do ConfigurationPort (provider factory). */
export type ConfigurationProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: ConfigurationProviderId;
};
