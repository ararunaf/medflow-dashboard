/**
 * Modelos canônicos do Execution Resource Registry — EPC-24 Sprint 13.
 *
 * Representação estrutural dos recursos disponíveis para execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem alocação de recursos.
 * Sem reserva. Sem balanceamento de carga. Sem scheduling.
 * Sem Engines. Sem acesso externo. Sem workers.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Resource Registry. */
export type ExecutionResourceRecordKind =
  | "execution-resource"
  | "execution-resource-definition"
  | "execution-resource-metadata"
  | "execution-resource-category"
  | "execution-resource-reference"
  | "execution-resource-scope"
  | "execution-resource-registry"
  | "execution-resource-statistics"
  | "execution-resource-capabilities"
  | "execution-resource-health"
  | "execution-resource-result"
  | "execution-resource-filter";

/**
 * Categoria estrutural de recurso.
 * Classificação opaca — sem validação de negócio.
 */
export type ExecutionResourceCategoryKind =
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
 * Escopo estrutural de recurso.
 * Classificação opaca — sem validação.
 */
export type ExecutionResourceScopeKind =
  | "execution"
  | "pipeline"
  | "stage"
  | "context"
  | "global"
  | "platform"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceCategory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria canônica estrutural de um recurso.
 * Sem regra de negócio. Sem validação de recursos.
 */
export type ExecutionResourceCategory = {
  kind: "execution-resource-category";
  id: string;
  category: ExecutionResourceCategoryKind;
  label?: string;
  notes?: string;
  resourceAllocated: false;
  schedulingImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceScope
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Escopo canônico estrutural de um recurso.
 * Explicitamente não alocável nesta sprint.
 */
export type ExecutionResourceScope = {
  kind: "execution-resource-scope";
  id: string;
  scope: ExecutionResourceScopeKind;
  label?: string;
  notes?: string;
  declared: true;
  /** Recursos NÃO são alocados nesta sprint. */
  evaluable: false;
  resourceAllocated: false;
  schedulingImplemented: false;
  resourcesAllocated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de um recurso / registry.
 * Sem validação de negócio.
 */
export type ExecutionResourceMetadata = {
  kind: "execution-resource-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a um recurso / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionResourceReference = {
  kind: "execution-resource-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de um recurso.
 * Descreve o contrato opaco — sem validação.
 */
export type ExecutionResourceDefinition = {
  kind: "execution-resource-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  resourceAllocated: false;
  schedulingImplemented: false;
  loadBalancingImplemented: false;
  resourcesReserved: false;
  resourcesAllocated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Resource Registry.
 * Explicitamente sem interpretação / Resource Allocation / Load Balancing / Engines.
 */
export type ExecutionResourceCapabilities = {
  kind: "execution-resource-capabilities";
  structuralResourceRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  resourceAllocationImplemented: false;
  resourceReservationImplemented: false;
  loadBalancingImplemented: false;
  resourcesReserved: false;
  schedulingImplemented: false;
  resourcesAllocated: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsResourceAllocation: false;
  implementsResourceReservation: false;
  implementsLoadBalancing: false;
  implementsScheduling: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
  workersInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de recursos.
 * Sem regras de negócio.
 */
export type ExecutionResourceFilter = {
  kind: "execution-resource-filter";
  executionResourceRegistryId?: string;
  executionResourceId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  category?: ExecutionResourceCategoryKind;
  scope?: ExecutionResourceScopeKind;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResource
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Recurso canônico registrado estruturalmente.
 * Representa um recurso disponível — sem alocação.
 */
export type ExecutionResource = {
  kind: "execution-resource";
  id: string;
  /** Alias (= id do recurso). */
  executionResourceId: string;
  executionResourceRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  category: ExecutionResourceCategory;
  scope: ExecutionResourceScope;
  definition: ExecutionResourceDefinition;
  references: readonly ExecutionResourceReference[];
  metadata: ExecutionResourceMetadata;
  capability: ExecutionResourceCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  resourceAllocated: false;
  schedulingImplemented: false;
  resourcesAllocated: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Recursos.
 * Catálogo estrutural in-memory — sem alocação de recursos.
 */
export type ExecutionResourceRegistry = {
  kind: "execution-resource-registry";
  id: string;
  /** Alias (= id do registry). */
  executionResourceRegistryId: string;
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
  pipelineId?: string;
  resourceIds: readonly string[];
  resourceKeys: readonly string[];
  resourceCount: number;
  references: readonly ExecutionResourceReference[];
  metadata: ExecutionResourceMetadata;
  capability: ExecutionResourceCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  resourceAllocationImplemented: false;
  resourceReservationImplemented: false;
  resourcesAllocated: false;
  workersInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionResourceStatistics = {
  kind: "execution-resource-statistics";
  totalRegistries: number;
  totalResources: number;
  totalReferences: number;
  totalCategories: number;
  totalScopes: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  resourceAllocationImplemented: false;
  resourceReservationImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Resource Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionResourceHealth = {
  kind: "execution-resource-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  resourceCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  resourceAllocationImplemented: false;
  resourceReservationImplemented: false;
  resourcesAllocated: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResourceResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Resource Registry.
 * Sem efeitos colaterais de validação / regras / negócio.
 */
export type ExecutionResourceResult = {
  kind: "execution-resource-result";
  ok: boolean;
  executionResourceRegistryId?: string;
  executionResourceId?: string;
  executionId?: string;
  resource?: ExecutionResource;
  registry?: ExecutionResourceRegistry;
  resources?: readonly ExecutionResource[];
  statistics?: ExecutionResourceStatistics;
  health?: ExecutionResourceHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  resourceAllocationImplemented: false;
  resourceReservationImplemented: false;
  resourcesAllocated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Resource Registry. */
export const STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY: ExecutionResourceCapabilities = {
  kind: "execution-resource-capabilities",
  structuralResourceRegistryOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  resourceAllocationImplemented: false,
  resourceReservationImplemented: false,
  loadBalancingImplemented: false,
  resourcesReserved: false,
  schedulingImplemented: false,
  resourcesAllocated: false,
  implementsOcr: false,
  implementsAi: false,
  implementsXmlParser: false,
  implementsResourceAllocation: false,
  implementsResourceReservation: false,
  implementsLoadBalancing: false,
  implementsScheduling: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
  workersInvoked: false,
};
