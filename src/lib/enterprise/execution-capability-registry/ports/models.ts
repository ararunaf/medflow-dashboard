/**
 * Modelos canônicos do Execution Capability Registry — EPC-24 Sprint 08.
 *
 * Representação estrutural das capacidades disponíveis para execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem descoberta automática.
 * Sem reflexão. Sem plugins. Sem carregamento dinâmico.
 * Sem Engines. Sem acesso externo. Sem execução de capacidades.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Capability Registry. */
export type ExecutionCapabilityRecordKind =
  | "execution-capability"
  | "execution-capability-definition"
  | "execution-capability-metadata"
  | "execution-capability-category"
  | "execution-capability-reference"
  | "execution-capability-descriptor"
  | "execution-capability-registry"
  | "execution-capability-statistics"
  | "execution-capability-capabilities"
  | "execution-capability-health"
  | "execution-capability-result"
  | "execution-capability-filter";

/**
 * Categoria estrutural de capacidade.
 * Classificação opaca — sem interpretação de negócio.
 */
export type ExecutionCapabilityCategoryKind =
  | "structural"
  | "pipeline"
  | "orchestration"
  | "transport"
  | "lifecycle"
  | "catalog"
  | "tracking"
  | "foundation"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityCategory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria canônica estrutural de uma capacidade.
 * Sem regra de negócio. Sem descoberta automática.
 */
export type ExecutionCapabilityCategory = {
  kind: "execution-capability-category";
  id: string;
  category: ExecutionCapabilityCategoryKind;
  label?: string;
  notes?: string;
  autoDiscovered: false;
  dynamicallyLoaded: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de uma capacidade / registry.
 * Sem interpretação de negócio.
 */
export type ExecutionCapabilityMetadata = {
  kind: "execution-capability-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma capacidade / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionCapabilityReference = {
  kind: "execution-capability-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de uma capacidade.
 * Descreve o contrato opaco — sem execução.
 */
export type ExecutionCapabilityDefinition = {
  kind: "execution-capability-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  autoDiscovered: false;
  dynamicallyLoaded: false;
  reflectionUsed: false;
  pluginsUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityDescriptor
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Descritor estrutural de uma capacidade disponível.
 * Explicitamente não executável nesta sprint.
 */
export type ExecutionCapabilityDescriptor = {
  kind: "execution-capability-descriptor";
  id: string;
  key: string;
  label: string;
  category: ExecutionCapabilityCategoryKind;
  available: true;
  /** Capacidades NÃO são executadas nesta sprint. */
  executable: false;
  notes?: string;
  enginesInvoked: false;
  autoDiscovered: false;
  dynamicallyLoaded: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Capability Registry.
 * Explicitamente sem descoberta / plugins / reflexão / Engines / processamento.
 */
export type ExecutionCapabilityCapabilities = {
  kind: "execution-capability-capabilities";
  structuralCapabilityRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  autoDiscoveryImplemented: false;
  dynamicLoadingImplemented: false;
  reflectionUsed: false;
  pluginsUsed: false;
  capabilitiesExecuted: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsTissRules: false;
  implementsMapping: false;
  implementsValidation: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de capacidades.
 * Sem regras de negócio.
 */
export type ExecutionCapabilityFilter = {
  kind: "execution-capability-filter";
  executionCapabilityRegistryId?: string;
  executionCapabilityId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  category?: ExecutionCapabilityCategoryKind;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapability
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidade canônica registrada estruturalmente.
 * Representa uma capacidade disponível — sem execução.
 */
export type ExecutionCapability = {
  kind: "execution-capability";
  id: string;
  /** Alias (= id da capacidade). */
  executionCapabilityId: string;
  executionCapabilityRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  category: ExecutionCapabilityCategory;
  definition: ExecutionCapabilityDefinition;
  descriptor: ExecutionCapabilityDescriptor;
  references: readonly ExecutionCapabilityReference[];
  metadata: ExecutionCapabilityMetadata;
  capability: ExecutionCapabilityCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  autoDiscovered: false;
  dynamicallyLoaded: false;
  capabilitiesExecuted: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Capacidades.
 * Catálogo estrutural in-memory — sem descoberta automática.
 */
export type ExecutionCapabilityRegistry = {
  kind: "execution-capability-registry";
  id: string;
  /** Alias (= id do registry). */
  executionCapabilityRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  pipelineId?: string;
  capabilityIds: readonly string[];
  capabilityKeys: readonly string[];
  capabilityCount: number;
  references: readonly ExecutionCapabilityReference[];
  metadata: ExecutionCapabilityMetadata;
  capability: ExecutionCapabilityCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  autoDiscoveryImplemented: false;
  dynamicLoadingImplemented: false;
  capabilitiesExecuted: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionCapabilityStatistics = {
  kind: "execution-capability-statistics";
  totalRegistries: number;
  totalCapabilities: number;
  totalReferences: number;
  totalCategories: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  autoDiscoveryImplemented: false;
  dynamicLoadingImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Capability Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionCapabilityHealth = {
  kind: "execution-capability-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  capabilityCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  autoDiscoveryImplemented: false;
  dynamicLoadingImplemented: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionCapabilityResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Capability Registry.
 * Sem efeitos colaterais de execução / descoberta / negócio.
 */
export type ExecutionCapabilityResult = {
  kind: "execution-capability-result";
  ok: boolean;
  executionCapabilityRegistryId?: string;
  executionCapabilityId?: string;
  executionId?: string;
  capability?: ExecutionCapability;
  registry?: ExecutionCapabilityRegistry;
  capabilities?: readonly ExecutionCapability[];
  statistics?: ExecutionCapabilityStatistics;
  health?: ExecutionCapabilityHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  autoDiscoveryImplemented: false;
  dynamicLoadingImplemented: false;
  capabilitiesExecuted: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Capability Registry. */
export const STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY: ExecutionCapabilityCapabilities = {
  kind: "execution-capability-capabilities",
  structuralCapabilityRegistryOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  autoDiscoveryImplemented: false,
  dynamicLoadingImplemented: false,
  reflectionUsed: false,
  pluginsUsed: false,
  capabilitiesExecuted: false,
  implementsOcr: false,
  implementsAi: false,
  implementsXmlParser: false,
  implementsTissRules: false,
  implementsMapping: false,
  implementsValidation: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};
