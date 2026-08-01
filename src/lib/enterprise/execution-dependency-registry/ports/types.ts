/**
 * Tipos vendor-agnósticos do Execution Dependency Registry — EPC-24 Sprint 09.
 *
 * Representa estruturalmente as dependências entre capacidades e componentes.
 * NÃO resolve dependências. NÃO ordena execução. NÃO calcula DAG.
 * NÃO acessa Engines. NÃO executa qualquer Engine.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionDependencyRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionDependency,
  ExecutionDependencyFilter,
  ExecutionDependencyHealth,
  ExecutionDependencyRegistry,
  ExecutionDependencyResult,
  ExecutionDependencyStatistics,
} from "./models";

export type {
  ExecutionDependency,
  ExecutionDependencyCapabilities,
  ExecutionDependencyDefinition,
  ExecutionDependencyEdge,
  ExecutionDependencyFilter,
  ExecutionDependencyGraph,
  ExecutionDependencyHealth,
  ExecutionDependencyMetadata,
  ExecutionDependencyNode,
  ExecutionDependencyNodeRole,
  ExecutionDependencyRecordKind,
  ExecutionDependencyReference,
  ExecutionDependencyRegistry,
  ExecutionDependencyResult,
  ExecutionDependencyStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Dependency Registry (extensível). */
export type ExecutionDependencyRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerDependency
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de dependência. */
export type RegisterDependencyInput = {
  executionDependencyId?: string;
  executionDependencyRegistryId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  pipelineId?: string;
  key: string;
  name: string;
  sourceKey?: string;
  targetKey?: string;
  relation?: string;
  definitionVersion?: string;
  definitionDescription?: string;
  portRef?: string;
  portContract?: string;
  sourceLabel?: string;
  targetLabel?: string;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

/** Resultado estrutural de registerDependency. */
export type RegisterDependencyResult = {
  ok: boolean;
  dependency?: ExecutionDependency;
  registry?: ExecutionDependencyRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  dependencyResolutionImplemented: false;
  topologicalSortImplemented: false;
  dagSolverImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getDependency
 * ───────────────────────────────────────────────────────────────────────── */

export type GetDependencyInput = {
  executionDependencyId?: string;
  executionDependencyRegistryId?: string;
  key?: string;
};

export type GetDependencyResult = {
  ok: boolean;
  dependency?: ExecutionDependency;
  registry?: ExecutionDependencyRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listDependencies
 * ───────────────────────────────────────────────────────────────────────── */

export type ListDependenciesInput = {
  filter?: ExecutionDependencyFilter;
  limit?: number;
};

export type ListDependenciesResult = {
  ok: boolean;
  dependencies?: readonly ExecutionDependency[];
  registry?: ExecutionDependencyRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findDependencies
 * ───────────────────────────────────────────────────────────────────────── */

export type FindDependenciesInput = {
  filter: ExecutionDependencyFilter;
};

export type FindDependenciesResult = ExecutionDependencyResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionDependencyRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionDependencyRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedDependencyCount?: number;
  storedReferenceCount?: number;
  storedNodeCount?: number;
  storedEdgeCount?: number;
  storedGraphCount?: number;
  structuralHealth?: ExecutionDependencyHealth;
};

/**
 * Capacidades do ExecutionDependencyRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionDependencyRegistryPortCapabilities = {
  provider: ExecutionDependencyRegistryProviderId;
  adapterId: string;
  supportsRegisterDependency: true;
  supportsGetDependency: true;
  supportsListDependencies: true;
  supportsFindDependencies: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Dependency Registry estrutural exclusivamente — sem resolução. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

export type ExecutionDependencyStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionDependencyStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionDependencyRegistryPort (provider factory). */
export type ExecutionDependencyRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionDependencyRegistryAdapter).
   */
  provider?: ExecutionDependencyRegistryProviderId;
};
