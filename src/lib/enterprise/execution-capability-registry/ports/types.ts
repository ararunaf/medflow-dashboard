/**
 * Tipos vendor-agnósticos do Execution Capability Registry — EPC-24 Sprint 08.
 *
 * Representa estruturalmente as capacidades disponíveis para execução.
 * NÃO executa capacidades. NÃO usa descoberta automática. NÃO usa reflexão.
 * NÃO usa plugins. NÃO usa carregamento dinâmico. NÃO acessa Engines.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionCapabilityRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionCapability,
  ExecutionCapabilityCategoryKind,
  ExecutionCapabilityFilter,
  ExecutionCapabilityHealth,
  ExecutionCapabilityRegistry,
  ExecutionCapabilityResult,
  ExecutionCapabilityStatistics,
} from "./models";

export type {
  ExecutionCapability,
  ExecutionCapabilityCapabilities,
  ExecutionCapabilityCategory,
  ExecutionCapabilityCategoryKind,
  ExecutionCapabilityDefinition,
  ExecutionCapabilityDescriptor,
  ExecutionCapabilityFilter,
  ExecutionCapabilityHealth,
  ExecutionCapabilityMetadata,
  ExecutionCapabilityRecordKind,
  ExecutionCapabilityReference,
  ExecutionCapabilityRegistry,
  ExecutionCapabilityResult,
  ExecutionCapabilityStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Capability Registry (extensível). */
export type ExecutionCapabilityRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerCapability
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de capacidade. */
export type RegisterCapabilityInput = {
  executionCapabilityId?: string;
  executionCapabilityRegistryId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  pipelineId?: string;
  key: string;
  name: string;
  category?: ExecutionCapabilityCategoryKind;
  categoryLabel?: string;
  definitionVersion?: string;
  definitionDescription?: string;
  portRef?: string;
  portContract?: string;
  descriptorLabel?: string;
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

/** Resultado estrutural de registerCapability. */
export type RegisterCapabilityResult = {
  ok: boolean;
  capability?: ExecutionCapability;
  registry?: ExecutionCapabilityRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  autoDiscoveryImplemented: false;
  dynamicLoadingImplemented: false;
  capabilitiesExecuted: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getCapability
 * ───────────────────────────────────────────────────────────────────────── */

export type GetCapabilityInput = {
  executionCapabilityId?: string;
  executionCapabilityRegistryId?: string;
  key?: string;
};

export type GetCapabilityResult = {
  ok: boolean;
  capability?: ExecutionCapability;
  registry?: ExecutionCapabilityRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

export type ListCapabilitiesInput = {
  filter?: ExecutionCapabilityFilter;
  limit?: number;
};

export type ListCapabilitiesResult = {
  ok: boolean;
  capabilities?: readonly ExecutionCapability[];
  registry?: ExecutionCapabilityRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

export type FindCapabilitiesInput = {
  filter: ExecutionCapabilityFilter;
};

export type FindCapabilitiesResult = ExecutionCapabilityResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionCapabilityRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionCapabilityRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedCapabilityCount?: number;
  storedReferenceCount?: number;
  storedCategoryCount?: number;
  structuralHealth?: ExecutionCapabilityHealth;
};

/**
 * Capacidades do ExecutionCapabilityRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionCapabilityRegistryPortCapabilities = {
  provider: ExecutionCapabilityRegistryProviderId;
  adapterId: string;
  supportsRegisterCapability: true;
  supportsGetCapability: true;
  supportsListCapabilities: true;
  supportsFindCapabilities: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Capability Registry estrutural exclusivamente — sem execução. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

export type ExecutionCapabilityStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionCapabilityStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionCapabilityRegistryPort (provider factory). */
export type ExecutionCapabilityRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionCapabilityRegistryAdapter).
   */
  provider?: ExecutionCapabilityRegistryProviderId;
};
