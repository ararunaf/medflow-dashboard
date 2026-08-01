/**
 * Modelos canônicos do Execution Environment Registry — EPC-24 Sprint 14.
 *
 * Representação estrutural dos ambientes disponíveis para execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem seleção de ambientes.
 * Sem reserva. Sem ativação de ambientes. Sem scheduling.
 * Sem Engines. Sem acesso externo. Sem workers.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Environment Registry. */
export type ExecutionEnvironmentRecordKind =
  | "execution-environment"
  | "execution-environment-definition"
  | "execution-environment-metadata"
  | "execution-environment-category"
  | "execution-environment-reference"
  | "execution-environment-scope"
  | "execution-environment-registry"
  | "execution-environment-statistics"
  | "execution-environment-capabilities"
  | "execution-environment-health"
  | "execution-environment-result"
  | "execution-environment-filter";

/**
 * Categoria estrutural de ambiente.
 * Classificação opaca — sem validação de negócio.
 */
export type ExecutionEnvironmentCategoryKind =
  | "structural"
  | "compute"
  | "capacity"
  | "runtime"
  | "pipeline"
  | "lifecycle"
  | "foundation"
  | "catalog"
  | "unknown";

/**
 * Escopo estrutural de ambiente.
 * Classificação opaca — sem validação.
 */
export type ExecutionEnvironmentScopeKind =
  | "execution"
  | "pipeline"
  | "stage"
  | "context"
  | "global"
  | "platform"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentCategory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria canônica estrutural de um ambiente.
 * Sem regra de negócio. Sem seleção de ambientes.
 */
export type ExecutionEnvironmentCategory = {
  kind: "execution-environment-category";
  id: string;
  category: ExecutionEnvironmentCategoryKind;
  label?: string;
  notes?: string;
  environmentSelected: false;
  environmentsProvisioned: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentScope
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Escopo canônico estrutural de um ambiente.
 * Explicitamente não selecionável / ativável nesta sprint.
 */
export type ExecutionEnvironmentScope = {
  kind: "execution-environment-scope";
  id: string;
  scope: ExecutionEnvironmentScopeKind;
  label?: string;
  notes?: string;
  declared: true;
  /** Ambientes NÃO são selecionados nesta sprint. */
  evaluable: false;
  environmentSelected: false;
  environmentsProvisioned: false;
  environmentsActivated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de um ambiente / registry.
 * Sem validação de negócio.
 */
export type ExecutionEnvironmentMetadata = {
  kind: "execution-environment-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a um ambiente / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionEnvironmentReference = {
  kind: "execution-environment-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de um ambiente.
 * Descreve o contrato opaco — sem validação.
 */
export type ExecutionEnvironmentDefinition = {
  kind: "execution-environment-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  environmentSelected: false;
  environmentsProvisioned: false;
  environmentActivationImplemented: false;
  environmentsSelected: false;
  environmentsActivated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Environment Registry.
 * Explicitamente sem interpretação / Environment Selection / Environment Activation / Engines.
 */
export type ExecutionEnvironmentCapabilities = {
  kind: "execution-environment-capabilities";
  structuralEnvironmentRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  environmentSelectionImplemented: false;
  environmentProvisioningImplemented: false;
  environmentActivationImplemented: false;
  environmentsSelected: false;
  environmentsProvisioned: false;
  environmentsActivated: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsEnvironmentSelection: false;
  implementsEnvironmentProvisioning: false;
  implementsEnvironmentActivation: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
  workersInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de ambientes.
 * Sem regras de negócio.
 */
export type ExecutionEnvironmentFilter = {
  kind: "execution-environment-filter";
  executionEnvironmentRegistryId?: string;
  executionEnvironmentId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  category?: ExecutionEnvironmentCategoryKind;
  scope?: ExecutionEnvironmentScopeKind;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironment
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Ambiente canônico registrado estruturalmente.
 * Representa um ambiente disponível — sem seleção / ativação.
 */
export type ExecutionEnvironment = {
  kind: "execution-environment";
  id: string;
  /** Alias (= id do ambiente). */
  executionEnvironmentId: string;
  executionEnvironmentRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  category: ExecutionEnvironmentCategory;
  scope: ExecutionEnvironmentScope;
  definition: ExecutionEnvironmentDefinition;
  references: readonly ExecutionEnvironmentReference[];
  metadata: ExecutionEnvironmentMetadata;
  capability: ExecutionEnvironmentCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  environmentSelected: false;
  environmentsProvisioned: false;
  environmentsActivated: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Ambientes.
 * Catálogo estrutural in-memory — sem seleção de ambientes.
 */
export type ExecutionEnvironmentRegistry = {
  kind: "execution-environment-registry";
  id: string;
  /** Alias (= id do registry). */
  executionEnvironmentRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  executionDependencyRegistryId?: string;
  executionPolicyRegistryId?: string;
  executionConstraintRegistryId?: string;
  executionRequirementRegistryId?: string;
  executionResourceRegistryId?: string;
  pipelineId?: string;
  environmentIds: readonly string[];
  environmentKeys: readonly string[];
  environmentCount: number;
  references: readonly ExecutionEnvironmentReference[];
  metadata: ExecutionEnvironmentMetadata;
  capability: ExecutionEnvironmentCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  environmentSelectionImplemented: false;
  environmentProvisioningImplemented: false;
  environmentsActivated: false;
  workersInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionEnvironmentStatistics = {
  kind: "execution-environment-statistics";
  totalRegistries: number;
  totalEnvironments: number;
  totalReferences: number;
  totalCategories: number;
  totalScopes: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  environmentSelectionImplemented: false;
  environmentProvisioningImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Environment Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionEnvironmentHealth = {
  kind: "execution-environment-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  environmentCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  environmentSelectionImplemented: false;
  environmentProvisioningImplemented: false;
  environmentsActivated: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEnvironmentResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Environment Registry.
 * Sem efeitos colaterais de validação / regras / negócio.
 */
export type ExecutionEnvironmentResult = {
  kind: "execution-environment-result";
  ok: boolean;
  executionEnvironmentRegistryId?: string;
  executionEnvironmentId?: string;
  executionId?: string;
  environment?: ExecutionEnvironment;
  registry?: ExecutionEnvironmentRegistry;
  environments?: readonly ExecutionEnvironment[];
  statistics?: ExecutionEnvironmentStatistics;
  health?: ExecutionEnvironmentHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  environmentSelectionImplemented: false;
  environmentProvisioningImplemented: false;
  environmentsActivated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Environment Registry. */
export const STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY: ExecutionEnvironmentCapabilities = {
  kind: "execution-environment-capabilities",
  structuralEnvironmentRegistryOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  environmentSelectionImplemented: false,
  environmentProvisioningImplemented: false,
  environmentActivationImplemented: false,
  environmentsSelected: false,
  environmentsProvisioned: false,
  environmentsActivated: false,
  implementsOcr: false,
  implementsAi: false,
  implementsXmlParser: false,
  implementsEnvironmentSelection: false,
  implementsEnvironmentProvisioning: false,
  implementsEnvironmentActivation: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
  workersInvoked: false,
};
