/**
 * Tipos vendor-agnósticos do Execution Resource Registry — EPC-24 Sprint 13.
 *
 * Representa estruturalmente os recursos disponíveis para execução.
 * NÃO aloca recursos. NÃO reserva recursos. NÃO acessa Engines.
 * NÃO aloca recursos. NÃO balanceia carga.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionResourceRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionResource,
  ExecutionResourceCategoryKind,
  ExecutionResourceFilter,
  ExecutionResourceHealth,
  ExecutionResourceRegistry,
  ExecutionResourceResult,
  ExecutionResourceScopeKind,
  ExecutionResourceStatistics,
} from "./models";

export type {
  ExecutionResource,
  ExecutionResourceCapabilities,
  ExecutionResourceCategory,
  ExecutionResourceCategoryKind,
  ExecutionResourceDefinition,
  ExecutionResourceFilter,
  ExecutionResourceHealth,
  ExecutionResourceMetadata,
  ExecutionResourceRecordKind,
  ExecutionResourceReference,
  ExecutionResourceRegistry,
  ExecutionResourceResult,
  ExecutionResourceScope,
  ExecutionResourceScopeKind,
  ExecutionResourceStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Resource Registry (extensível). */
export type ExecutionResourceRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerResource
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de recurso. */
export type RegisterResourceInput = {
  executionResourceId?: string;
  executionResourceRegistryId?: string;
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
  key: string;
  name: string;
  category?: ExecutionResourceCategoryKind;
  categoryLabel?: string;
  scope?: ExecutionResourceScopeKind;
  scopeLabel?: string;
  definitionVersion?: string;
  definitionDescription?: string;
  portRef?: string;
  portContract?: string;
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

/** Resultado estrutural de registerResource. */
export type RegisterResourceResult = {
  ok: boolean;
  resource?: ExecutionResource;
  registry?: ExecutionResourceRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  resourceAllocationImplemented: false;
  resourceReservationImplemented: false;
  resourcesAllocated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getResource
 * ───────────────────────────────────────────────────────────────────────── */

export type GetResourceInput = {
  executionResourceId?: string;
  executionResourceRegistryId?: string;
  key?: string;
};

export type GetResourceResult = {
  ok: boolean;
  resource?: ExecutionResource;
  registry?: ExecutionResourceRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listResources
 * ───────────────────────────────────────────────────────────────────────── */

export type ListResourcesInput = {
  filter?: ExecutionResourceFilter;
  limit?: number;
};

export type ListResourcesResult = {
  ok: boolean;
  resources?: readonly ExecutionResource[];
  registry?: ExecutionResourceRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findResources
 * ───────────────────────────────────────────────────────────────────────── */

export type FindResourcesInput = {
  filter: ExecutionResourceFilter;
};

export type FindResourcesResult = ExecutionResourceResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionResourceRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionResourceRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedResourceCount?: number;
  storedReferenceCount?: number;
  storedCategoryCount?: number;
  storedScopeCount?: number;
  structuralHealth?: ExecutionResourceHealth;
};

/**
 * Capacidades do ExecutionResourceRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionResourceRegistryPortCapabilities = {
  provider: ExecutionResourceRegistryProviderId;
  adapterId: string;
  supportsRegisterResource: true;
  supportsGetResource: true;
  supportsListResources: true;
  supportsFindResources: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Resource Registry estrutural exclusivamente — sem validação. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
  workersInvoked: false;
};

export type ExecutionResourceStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionResourceStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionResourceRegistryPort (provider factory). */
export type ExecutionResourceRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionResourceRegistryAdapter).
   */
  provider?: ExecutionResourceRegistryProviderId;
};
