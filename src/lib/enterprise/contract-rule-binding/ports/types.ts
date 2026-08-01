/**
 * Tipos vendor-agnósticos da camada Contract Rule Binding — EPC-17.
 *
 * Nenhum tipo de Rule Engine, Expression Engine, TISS, OCR, AI Auditor,
 * Workflow operacional, validação contratual ou lógica clínica deve
 * aparecer aqui.
 *
 * ContractRuleBinding representa apenas uma ASSOCIAÇÃO CANÔNICA entre
 * um Contrato e um Rule Pack. Nunca executa regras, nunca interpreta
 * cláusulas e nunca conhece o Rule Engine.
 */

/** Provedores / mecanismos de contract-rule-binding (extensível). */
export type ContractRuleBindingProviderId =
  | "default"
  | "mock"
  | "test"
  | "database"
  | "remote"
  | "registry";

/** Resultado de health check. */
export type ContractRuleBindingHealth = {
  ok: boolean;
  provider: ContractRuleBindingProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type ContractRuleBindingCapabilities = {
  provider: ContractRuleBindingProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsBindRulePack: boolean;
  supportsUnbindRulePack: boolean;
  supportsGetBinding: boolean;
  supportsListBindings: boolean;
  /** Múltiplos Rule Packs por contrato (vários bindings). */
  supportsMultipleRulePacksPerContract: boolean;
  /** Prioridade estrutural. */
  supportsPriority: boolean;
  /** Ordem de execução estrutural. */
  supportsExecutionOrder: boolean;
  /** Vigência (effectiveDate / expirationDate). */
  supportsEffectiveDates: boolean;
  /** Versionamento estrutural. */
  supportsVersioning: boolean;
  /** Ciclo de vida estrutural (ACTIVE / INACTIVE / …). */
  supportsLifecycleStatus: boolean;
  /** Referências opacas a Metadata Engine. */
  supportsMetadataReference: boolean;
  /** Referências opacas a Configuration Engine. */
  supportsConfigurationReference: boolean;
  /** Política de binding (enumeração estrutural — sem lógica). */
  supportsBindingPolicy: boolean;
  /** Prep — futuro Rule Engine (sem bind). */
  supportsFutureRuleEngine: boolean;
  /** Prep — futuro Expression Engine (sem bind). */
  supportsFutureExpressionEngine: boolean;
  /** Prep — futuro Workflow (sem bind). */
  supportsFutureWorkflow: boolean;
  /** Prep — futuro AI Auditor (sem bind). */
  supportsFutureAiAuditor: boolean;
  /** Prep — futuro TISS Intelligence (sem bind). */
  supportsFutureTissIntelligence: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * BindingPolicy — enumeração pura (FASE 7)
 * Sem lógica. Sem seleção. Sem avaliação.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Política estrutural de resolução de bindings.
 * Enumeração pura — sem implementação nesta sprint.
 */
export type BindingPolicy = "FIRST_MATCH" | "ALL_MATCH" | "HIGHEST_PRIORITY" | "CUSTOM";

export const BINDING_POLICIES: readonly BindingPolicy[] = [
  "FIRST_MATCH",
  "ALL_MATCH",
  "HIGHEST_PRIORITY",
  "CUSTOM",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade / status / versão / prioridade / ordem
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de Binding (canônico). */
export type BindingId = string;

/** Versão estrutural do binding (rótulo livre). */
export type BindingVersion = string;

/** Tag genérica — classificação livre. */
export type BindingTag = string;

/** Prioridade estrutural (número opaco — sem regra de negócio). */
export type BindingPriority = number;

/** Ordem de execução estrutural (número opaco — sem avaliação). */
export type BindingExecutionOrder = number;

/**
 * Status estrutural genérico do Binding.
 * Sem semântica operacional, validação contratual ou TISS.
 */
export type BindingStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DRAFT"
  | "DEPRECATED"
  | "ARCHIVED"
  | (string & {});

export const BINDING_STATUSES: readonly BindingStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "DRAFT",
  "DEPRECATED",
  "ARCHIVED",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem ligação operacional)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência opaca ao Contrato (EPC-11).
 * Sem carregar, validar ou interpretar o contrato.
 */
export type ContractReference = {
  contractId?: string;
  id?: string;
  name?: string;
  version?: string;
  kind?: string;
  uri?: string;
};

/**
 * Referência opaca ao Rule Pack (EPC-09).
 * Sem carregar packs, regras ou Expression Engine.
 */
export type RulePackReference = {
  packId?: string;
  id?: string;
  name?: string;
  version?: string;
  kind?: string;
  uri?: string;
};

/** Referência opaca a artefato do Metadata Engine. */
export type BindingMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a artefato do Configuration Engine. */
export type BindingConfigurationReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Modelo canônico ContractRuleBinding (FASE 6)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Associação canônica Contrato ↔ Rule Pack.
 *
 * Campos canônicos:
 * BindingId | ContractReference | RulePackReference | Priority |
 * ExecutionOrder | Status | EffectiveDate | ExpirationDate |
 * MetadataReference | ConfigurationReference | Tags | CustomAttributes
 *
 * Extensões estruturais (sem lógica): version, bindingPolicy, createdAt, updatedAt.
 *
 * O Binding NÃO executa regras. O Binding NÃO conhece Rule Engine.
 */
export type ContractRuleBinding = {
  bindingId: BindingId;
  contractReference: ContractReference;
  rulePackReference: RulePackReference;
  priority?: BindingPriority;
  executionOrder?: BindingExecutionOrder;
  status: BindingStatus;
  effectiveDate?: string;
  expirationDate?: string;
  metadataReference?: BindingMetadataReference;
  configurationReference?: BindingConfigurationReference;
  tags?: readonly BindingTag[];
  /** Atributos livres opacos — sem schema clínico/contratual. */
  customAttributes?: Readonly<Record<string, unknown>>;
  /** Versionamento estrutural (prep). */
  version?: BindingVersion;
  /** Política estrutural (enumeração — sem avaliação). */
  bindingPolicy?: BindingPolicy;
  createdAt: string;
  updatedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de bind — campos gerados pelo adapter quando omitidos:
 * bindingId, createdAt, updatedAt, status default.
 */
export type BindRulePackInput = {
  binding: Omit<ContractRuleBinding, "bindingId" | "createdAt" | "updatedAt" | "status"> & {
    bindingId?: BindingId;
    createdAt?: string;
    updatedAt?: string;
    status?: BindingStatus;
  };
};

export type BindRulePackResult = {
  ok: boolean;
  bindingId: BindingId;
  binding?: ContractRuleBinding;
  message?: string;
  code?: "created" | "updated" | "error";
};

export type UnbindRulePackInput = {
  bindingId: BindingId;
};

export type UnbindRulePackResult = {
  ok: boolean;
  bindingId: BindingId;
  message?: string;
  code?: "unbound" | "not_found" | "error";
};

export type GetBindingInput = {
  bindingId: BindingId;
};

export type GetBindingResult = {
  ok: boolean;
  binding?: ContractRuleBinding;
  message?: string;
  code?: "ok" | "not_found" | "error";
};

export type ListBindingsInput = {
  /** Id opaco do contrato (contractReference.contractId | contractReference.id). */
  contractId?: string;
  /** Id opaco do pack (rulePackReference.packId | rulePackReference.id). */
  packId?: string;
  status?: BindingStatus;
  tag?: BindingTag;
  /** Prefixo de bindingId opcional. */
  idPrefix?: string;
  bindingPolicy?: BindingPolicy;
};

export type ListBindingsResult = {
  ok: boolean;
  bindings: readonly ContractRuleBinding[];
  message?: string;
};

/** Opções de resolução do ContractRuleBindingPort (provider factory). */
export type ContractRuleBindingProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: ContractRuleBindingProviderId;
};
