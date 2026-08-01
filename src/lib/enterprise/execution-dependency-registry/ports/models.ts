/**
 * Modelos canônicos do Execution Dependency Registry — EPC-24 Sprint 09.
 *
 * Representação estrutural das dependências entre capacidades e componentes.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem resolução de dependências.
 * Sem ordenação topológica. Sem DAG solver. Sem Engines.
 * Sem acesso externo. Sem execução.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Dependency Registry. */
export type ExecutionDependencyRecordKind =
  | "execution-dependency"
  | "execution-dependency-definition"
  | "execution-dependency-metadata"
  | "execution-dependency-reference"
  | "execution-dependency-graph"
  | "execution-dependency-node"
  | "execution-dependency-edge"
  | "execution-dependency-registry"
  | "execution-dependency-statistics"
  | "execution-dependency-capabilities"
  | "execution-dependency-health"
  | "execution-dependency-result"
  | "execution-dependency-filter";

/**
 * Papel estrutural de um nó no grafo de dependências.
 * Classificação opaca — sem interpretação de negócio / sem ordenação.
 */
export type ExecutionDependencyNodeRole =
  | "source"
  | "target"
  | "intermediate"
  | "capability"
  | "component"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de uma dependência / registry.
 * Sem interpretação de negócio.
 */
export type ExecutionDependencyMetadata = {
  kind: "execution-dependency-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma dependência / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionDependencyReference = {
  kind: "execution-dependency-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de uma dependência.
 * Descreve o contrato opaco — sem resolução / sem ordenação.
 */
export type ExecutionDependencyDefinition = {
  kind: "execution-dependency-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  sourceKey?: string;
  targetKey?: string;
  relation?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  dependencyResolved: false;
  ordered: false;
  dagComputed: false;
  topologicalSortApplied: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyNode
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Nó estrutural do grafo de dependências.
 * Explicitamente não resolvido / não ordenado nesta sprint.
 */
export type ExecutionDependencyNode = {
  kind: "execution-dependency-node";
  id: string;
  key: string;
  label?: string;
  role: ExecutionDependencyNodeRole;
  notes?: string;
  dependencyResolved: false;
  ordered: false;
  dagComputed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyEdge
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Aresta estrutural do grafo de dependências.
 * Representa relação source → target sem resolução / ordenação.
 */
export type ExecutionDependencyEdge = {
  kind: "execution-dependency-edge";
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromKey: string;
  toKey: string;
  relation?: string;
  notes?: string;
  dependencyResolved: false;
  ordered: false;
  dagComputed: false;
  topologicalSortApplied: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyGraph
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Grafo estrutural de dependências.
 * NÃO é um DAG resolvido. NÃO aplica topological sort.
 * Apenas representação in-memory das relações declaradas.
 */
export type ExecutionDependencyGraph = {
  kind: "execution-dependency-graph";
  id: string;
  nodes: readonly ExecutionDependencyNode[];
  edges: readonly ExecutionDependencyEdge[];
  nodeCount: number;
  edgeCount: number;
  notes?: string;
  dependencyResolved: false;
  ordered: false;
  dagComputed: false;
  topologicalSortApplied: false;
  dependencyResolutionApplied: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Dependency Registry.
 * Explicitamente sem resolução / ordenação / DAG / Engines / processamento.
 */
export type ExecutionDependencyCapabilities = {
  kind: "execution-dependency-capabilities";
  structuralDependencyRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  dependencyResolutionImplemented: false;
  topologicalSortImplemented: false;
  dagSolverImplemented: false;
  automaticOrderingImplemented: false;
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
 * ExecutionDependencyFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de dependências.
 * Sem regras de negócio. Sem resolução.
 */
export type ExecutionDependencyFilter = {
  kind: "execution-dependency-filter";
  executionDependencyRegistryId?: string;
  executionDependencyId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  sourceKey?: string;
  targetKey?: string;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependency
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Dependência canônica registrada estruturalmente.
 * Representa uma relação source → target — sem resolução / ordenação.
 */
export type ExecutionDependency = {
  kind: "execution-dependency";
  id: string;
  /** Alias (= id da dependência). */
  executionDependencyId: string;
  executionDependencyRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  sourceKey: string;
  targetKey: string;
  definition: ExecutionDependencyDefinition;
  sourceNode: ExecutionDependencyNode;
  targetNode: ExecutionDependencyNode;
  edge: ExecutionDependencyEdge;
  graph: ExecutionDependencyGraph;
  references: readonly ExecutionDependencyReference[];
  metadata: ExecutionDependencyMetadata;
  capability: ExecutionDependencyCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  dependencyResolved: false;
  ordered: false;
  dagComputed: false;
  topologicalSortApplied: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Dependências.
 * Catálogo estrutural in-memory — sem resolução / ordenação / DAG.
 */
export type ExecutionDependencyRegistry = {
  kind: "execution-dependency-registry";
  id: string;
  /** Alias (= id do registry). */
  executionDependencyRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  pipelineId?: string;
  dependencyIds: readonly string[];
  dependencyKeys: readonly string[];
  dependencyCount: number;
  graphIds: readonly string[];
  references: readonly ExecutionDependencyReference[];
  metadata: ExecutionDependencyMetadata;
  capability: ExecutionDependencyCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  dependencyResolutionImplemented: false;
  topologicalSortImplemented: false;
  dagSolverImplemented: false;
  automaticOrderingImplemented: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics / sem resolução.
 */
export type ExecutionDependencyStatistics = {
  kind: "execution-dependency-statistics";
  totalRegistries: number;
  totalDependencies: number;
  totalReferences: number;
  totalNodes: number;
  totalEdges: number;
  totalGraphs: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  dependencyResolutionImplemented: false;
  topologicalSortImplemented: false;
  dagSolverImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Dependency Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionDependencyHealth = {
  kind: "execution-dependency-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  dependencyCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  dependencyResolutionImplemented: false;
  topologicalSortImplemented: false;
  dagSolverImplemented: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionDependencyResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Dependency Registry.
 * Sem efeitos colaterais de resolução / ordenação / negócio.
 */
export type ExecutionDependencyResult = {
  kind: "execution-dependency-result";
  ok: boolean;
  executionDependencyRegistryId?: string;
  executionDependencyId?: string;
  executionId?: string;
  dependency?: ExecutionDependency;
  registry?: ExecutionDependencyRegistry;
  dependencies?: readonly ExecutionDependency[];
  statistics?: ExecutionDependencyStatistics;
  health?: ExecutionDependencyHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  dependencyResolutionImplemented: false;
  topologicalSortImplemented: false;
  dagSolverImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Dependency Registry. */
export const STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY: ExecutionDependencyCapabilities = {
  kind: "execution-dependency-capabilities",
  structuralDependencyRegistryOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  dependencyResolutionImplemented: false,
  topologicalSortImplemented: false,
  dagSolverImplemented: false,
  automaticOrderingImplemented: false,
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
