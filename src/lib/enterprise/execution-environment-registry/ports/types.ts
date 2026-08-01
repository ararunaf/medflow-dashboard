/**
 * Tipos vendor-agnósticos do Execution Environment Registry — EPC-24 Sprint 14.
 *
 * Representa estruturalmente os ambientes disponíveis para execução.
 * NÃO seleciona ambientes. NÃO provisiona ambientes. NÃO acessa Engines.
 * NÃO seleciona ambientes. NÃO ativa ambientes.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionEnvironmentRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionEnvironment,
  ExecutionEnvironmentCategoryKind,
  ExecutionEnvironmentFilter,
  ExecutionEnvironmentHealth,
  ExecutionEnvironmentRegistry,
  ExecutionEnvironmentResult,
  ExecutionEnvironmentScopeKind,
  ExecutionEnvironmentStatistics,
} from "./models";

export type {
  ExecutionEnvironment,
  ExecutionEnvironmentCapabilities,
  ExecutionEnvironmentCategory,
  ExecutionEnvironmentCategoryKind,
  ExecutionEnvironmentDefinition,
  ExecutionEnvironmentFilter,
  ExecutionEnvironmentHealth,
  ExecutionEnvironmentMetadata,
  ExecutionEnvironmentRecordKind,
  ExecutionEnvironmentReference,
  ExecutionEnvironmentRegistry,
  ExecutionEnvironmentResult,
  ExecutionEnvironmentScope,
  ExecutionEnvironmentScopeKind,
  ExecutionEnvironmentStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Environment Registry (extensível). */
export type ExecutionEnvironmentRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerEnvironment
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de ambiente. */
export type RegisterEnvironmentInput = {
  executionEnvironmentId?: string;
  executionEnvironmentRegistryId?: string;
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
  key: string;
  name: string;
  category?: ExecutionEnvironmentCategoryKind;
  categoryLabel?: string;
  scope?: ExecutionEnvironmentScopeKind;
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

/** Resultado estrutural de registerEnvironment. */
export type RegisterEnvironmentResult = {
  ok: boolean;
  environment?: ExecutionEnvironment;
  registry?: ExecutionEnvironmentRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  environmentSelectionImplemented: false;
  environmentProvisioningImplemented: false;
  environmentsActivated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getEnvironment
 * ───────────────────────────────────────────────────────────────────────── */

export type GetEnvironmentInput = {
  executionEnvironmentId?: string;
  executionEnvironmentRegistryId?: string;
  key?: string;
};

export type GetEnvironmentResult = {
  ok: boolean;
  environment?: ExecutionEnvironment;
  registry?: ExecutionEnvironmentRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listEnvironments
 * ───────────────────────────────────────────────────────────────────────── */

export type ListEnvironmentsInput = {
  filter?: ExecutionEnvironmentFilter;
  limit?: number;
};

export type ListEnvironmentsResult = {
  ok: boolean;
  environments?: readonly ExecutionEnvironment[];
  registry?: ExecutionEnvironmentRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findEnvironments
 * ───────────────────────────────────────────────────────────────────────── */

export type FindEnvironmentsInput = {
  filter: ExecutionEnvironmentFilter;
};

export type FindEnvironmentsResult = ExecutionEnvironmentResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionEnvironmentRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionEnvironmentRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedEnvironmentCount?: number;
  storedReferenceCount?: number;
  storedCategoryCount?: number;
  storedScopeCount?: number;
  structuralHealth?: ExecutionEnvironmentHealth;
};

/**
 * Capacidades do ExecutionEnvironmentRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionEnvironmentRegistryPortCapabilities = {
  provider: ExecutionEnvironmentRegistryProviderId;
  adapterId: string;
  supportsRegisterEnvironment: true;
  supportsGetEnvironment: true;
  supportsListEnvironments: true;
  supportsFindEnvironments: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Environment Registry estrutural exclusivamente — sem validação. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
  workersInvoked: false;
};

export type ExecutionEnvironmentStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionEnvironmentStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionEnvironmentRegistryPort (provider factory). */
export type ExecutionEnvironmentRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionEnvironmentRegistryAdapter).
   */
  provider?: ExecutionEnvironmentRegistryProviderId;
};
