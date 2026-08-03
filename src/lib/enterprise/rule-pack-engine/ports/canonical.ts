/**
 * Modelos canônicos do Enterprise Rule Pack Engine — TISS-03 / TISS-03A.
 *
 * Mecanismo genérico de interpretação/execução de Rule Packs.
 * Sem lógica de operadora, contrato, tenant, cooperativa, XML ou ANS.
 * Conhecimento TISS exclusivamente via TISSCatalogPort.
 */

/** Status estrutural genérico — sem semântica de negócio. */
export type CanonicalRulePackStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "unknown"
  | (string & {});

/** Status estrutural de uma regra canônica. */
export type CanonicalRuleStatus =
  | "draft"
  | "enabled"
  | "disabled"
  | "archived"
  | "unknown"
  | (string & {});

/** Status estrutural de uma execução canônica. */
export type CanonicalRuleExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout"
  | "unknown"
  | (string & {});

/** Severidade estrutural opaca. */
export type CanonicalRuleSeverity = "info" | "low" | "medium" | "high" | "critical" | (string & {});

/**
 * Metadata canônica do Rule Pack (TISS-03A).
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalRulePackMetadata = {
  kind: "canonical-rule-pack-metadata";
  namespace?: string;
  channel?: string;
  author?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Resultado esperado estrutural de um Rule Pack (TISS-03A).
 * Usado para validação canônica pós-execução — sem regras de negócio.
 */
export type CanonicalRulePackExpectedResult = {
  kind: "canonical-rule-pack-expected-result";
  minRulesMatched?: number;
  minFindings?: number;
  status?: CanonicalRuleExecutionStatus;
  expectedAttributeKeys?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Condição canônica — interpretada estruturalmente pelo Engine.
 * Referências de catálogo são códigos opacos resolvidos via TISSCatalogPort.
 */
export type CanonicalRuleCondition = {
  kind: "canonical-rule-condition";
  id: string;
  name?: string;
  description?: string;
  /**
   * Tipo estrutural da condição (extensível).
   * Exemplos: "always" | "catalog-entry-exists" | "metadata-attribute-present"
   */
  conditionType: string;
  /** Kind de entrada do TISS Catalog (opaco) — ex.: "profile", "guide-type". */
  catalogEntryKind?: string;
  /** Código opaco resolvido exclusivamente via TISSCatalogPort. */
  catalogCode?: string;
  /** Chave de atributo de contexto (metadata) — sem semântica de domínio. */
  metadataKey?: string;
  /** Valor esperado estrutural (comparação genérica). */
  expectedValue?: string | number | boolean | null;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Ação canônica — aplicada estruturalmente (sem efeitos de negócio).
 */
export type CanonicalRuleAction = {
  kind: "canonical-rule-action";
  id: string;
  name?: string;
  description?: string;
  /**
   * Tipo estrutural da ação (extensível).
   * Exemplos: "emit-finding" | "set-status" | "record-attribute"
   */
  actionType: string;
  message?: string;
  severity?: CanonicalRuleSeverity;
  attributeKey?: string;
  attributeValue?: string | number | boolean | null;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Regra canônica — unidade interpretável dentro de um Rule Pack.
 */
export type CanonicalRule = {
  kind: "canonical-rule";
  id: string;
  code: string;
  name: string;
  description?: string;
  status?: CanonicalRuleStatus;
  priority?: number;
  severity?: CanonicalRuleSeverity;
  conditions: readonly CanonicalRuleCondition[];
  actions: readonly CanonicalRuleAction[];
  /** Códigos de perfil do catálogo referenciados (opacos). */
  catalogProfileCodes?: readonly string[];
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Rule Pack canônico — contêiner versionado de regras estruturais.
 * Não representa operadora, contrato, cooperativa ou tenant.
 *
 * TISS-03A: metadata, priority, categories, expectedResult,
 * compatibleTissVersionCodes (códigos opacos do TISSCatalogPort).
 */
export type CanonicalRulePack = {
  kind: "canonical-rule-pack";
  packId: string;
  code: string;
  name: string;
  description?: string;
  status?: CanonicalRulePackStatus;
  version?: string;
  /** Prioridade estrutural do pack (maior = mais prioritário). */
  priority?: number;
  /** Categorias estruturais genéricas (ex.: "existence", "compatibility"). */
  categories?: readonly string[];
  /** Metadata canônica do pack. */
  metadata?: CanonicalRulePackMetadata;
  /** Resultado esperado estrutural (validação canônica). */
  expectedResult?: CanonicalRulePackExpectedResult;
  /**
   * Códigos opacos de versões TISS compatíveis — resolvidos exclusivamente
   * via TISSCatalogPort (sem if/switch por versão).
   */
  compatibleTissVersionCodes?: readonly string[];
  rules: readonly CanonicalRule[];
  /** Perfis do catálogo referenciados (opacos — via TISSCatalogPort). */
  catalogProfileCodes?: readonly string[];
  /** Domínios do catálogo referenciados (opacos). */
  catalogDomainCodes?: readonly string[];
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  createdAt?: string;
  updatedAt?: string;
};

/** Finding estrutural emitido por uma ação. */
export type CanonicalRuleFinding = {
  kind: "canonical-rule-finding";
  findingId: string;
  ruleId: string;
  ruleCode: string;
  actionId: string;
  actionType: string;
  severity?: CanonicalRuleSeverity;
  message?: string;
  matched: boolean;
  catalogCodesResolved?: readonly string[];
  attributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Resultado canônico de execução de um Rule Pack.
 */
export type CanonicalRuleExecutionResult = {
  kind: "canonical-rule-execution-result";
  ok: boolean;
  packId: string;
  packCode: string;
  rulesEvaluated: number;
  rulesMatched: number;
  findings: readonly CanonicalRuleFinding[];
  catalogId?: string;
  catalogConsumed: boolean;
  status: CanonicalRuleExecutionStatus;
  /** Indica se o expectedResult estrutural do pack foi atendido (TISS-03A). */
  expectedResultMet?: boolean;
  message?: string;
  code?: string;
};

/**
 * Execução canônica — registro estrutural de uma run do Engine.
 */
export type CanonicalRuleExecution = {
  kind: "canonical-rule-execution";
  executionId: string;
  packId: string;
  packCode: string;
  status: CanonicalRuleExecutionStatus;
  requestId?: string;
  catalogId?: string;
  catalogConsumed: boolean;
  result?: CanonicalRuleExecutionResult;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
};
