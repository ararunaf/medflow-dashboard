/**
 * Tipos vendor-agnósticos do Canonical Execution Orchestrator — EPC-24.
 *
 * O Orquestrador apenas coordena o pipeline Enterprise via Ports.
 * NÃO executa OCR, IA, Mapping, regras, validações TISS ou parsers.
 * NÃO conhece banco, APIs ou UI.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → CanonicalExecutionOrchestratorPort → Adapter → Store → Factory → Provider
 *
 * Sprint 03: cria e utiliza exclusivamente o Execution Context canônico.
 * Sprint 04: ciclo de vida estrutural exclusivo via Execution State Machine.
 * Sprint 05: barramento estrutural exclusivo via Execution Event Bus.
 * Sprint 06: catálogo estrutural exclusivo via Execution Registry.
 * Sprint 07: rastreamento estrutural exclusivo via Execution Trace.
 */
import type {
  CanonicalExecutionContext,
  CanonicalExecutionRequest,
  CanonicalExecutionResult,
  CanonicalExecutionStatus,
  CanonicalExecutionTrace,
} from "./models";
import type { FoundationPortRef } from "./foundation-ports";
import type { ExecutionContext } from "../../execution-context/ports/models";

export type {
  CanonicalExecutionContext,
  CanonicalExecutionRecord,
  CanonicalExecutionRecordKind,
  CanonicalExecutionRequest,
  CanonicalExecutionResult,
  CanonicalExecutionStatus,
  CanonicalExecutionStep,
  CanonicalExecutionStepName,
  CanonicalExecutionTrace,
} from "./models";

export type {
  FoundationOrchestratedPort,
  FoundationPortContract,
  FoundationPortRef,
  FoundationPortRegistry,
  FoundationPortStepDescriptor,
} from "./foundation-ports";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Canonical Execution Orchestrator (extensível). */
export type CanonicalExecutionOrchestratorProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — startExecution
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada de início de execução canônica. */
export type StartExecutionInput = {
  request?: CanonicalExecutionRequest;
  correlationId?: string;
  tenantRef?: string;
  channel?: string;
  tags?: readonly string[];
  intakeRef?: string;
  documentRef?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  structuralNotes?: string;
  /** Payload opaco coletado no resultado (nunca interpretado). */
  collectedPayload?: Readonly<Record<string, unknown>>;
};

/** Resultado estrutural de startExecution. */
export type StartExecutionResult = {
  ok: boolean;
  /** Projeção estrutural legada (compat Sprint 01/02). */
  context?: CanonicalExecutionContext;
  /**
   * Execution Context canônico — único objeto compartilhado da execução (Sprint 03).
   * Criado e enriquecido exclusivamente via ExecutionContextPort.
   */
  executionContext?: ExecutionContext;
  result?: CanonicalExecutionResult;
  trace?: CanonicalExecutionTrace;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getExecution
 * ───────────────────────────────────────────────────────────────────────── */

export type GetExecutionInput = {
  executionId: string;
};

export type GetExecutionResult = {
  ok: boolean;
  context?: CanonicalExecutionContext;
  /** Execution Context canônico (Sprint 03). */
  executionContext?: ExecutionContext;
  result?: CanonicalExecutionResult;
  trace?: CanonicalExecutionTrace;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listExecutions
 * ───────────────────────────────────────────────────────────────────────── */

export type ListExecutionsInput = {
  status?: CanonicalExecutionStatus;
  limit?: number;
};

export type ListExecutionsResult = {
  ok: boolean;
  executions: readonly CanonicalExecutionContext[];
  total: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type CanonicalExecutionOrchestratorHealth = {
  ok: boolean;
  provider: CanonicalExecutionOrchestratorProviderId;
  latencyMs?: number;
  message?: string;
  storedContextCount?: number;
  storedResultCount?: number;
  storedTraceCount?: number;
  /** Quantidade de Ports Foundation referenciados estruturalmente. */
  foundationPortRefCount?: number;
};

/**
 * Capacidades do CanonicalExecutionOrchestratorPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type CanonicalExecutionOrchestratorCapabilities = {
  provider: CanonicalExecutionOrchestratorProviderId;
  adapterId: string;
  supportsStartExecution: boolean;
  supportsGetExecution: boolean;
  supportsListExecutions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsTracing: true;
  /** Orquestra exclusivamente via Ports da Foundation. */
  orchestratesViaFoundationPortsOnly: true;
  /** Quantidade de Ports Foundation na cadeia canônica. */
  foundationPortCount: number;
  /** Refs dos Ports orquestrados. */
  foundationPortRefs: readonly FoundationPortRef[];
  /** Prep — invocação real dos Ports (sem implementação nesta sprint). */
  supportsFuturePortInvocation: true;
  /** Composição do pipeline delegada ao Pipeline Resolver (EPC-24 Sprint 02). */
  dependsOnPipelineResolver: true;
  /** Resolução dinâmica estrutural — sem sequência hardcoded no Orchestrator. */
  resolvesPipelineDynamically: true;
  /** Cria e utiliza exclusivamente o Execution Context (EPC-24 Sprint 03). */
  dependsOnExecutionContext: true;
  /** Execution Context é o único objeto compartilhado da execução. */
  usesExecutionContextExclusively: true;
  /** Ciclo de vida estrutural via Execution State Machine (EPC-24 Sprint 04). */
  dependsOnExecutionStateMachine: true;
  /** Lifecycle obtido exclusivamente através da Execution State Machine. */
  controlsLifecycleViaExecutionStateMachine: true;
  /** Barramento estrutural via Execution Event Bus (EPC-24 Sprint 05). */
  dependsOnExecutionEventBus: true;
  /** Event Bus utilizado exclusivamente de forma estrutural (sem entrega). */
  usesExecutionEventBusStructurally: true;
  /** Catálogo estrutural via Execution Registry (EPC-24 Sprint 06). */
  dependsOnExecutionRegistry: true;
  /** Registry utilizado exclusivamente de forma estrutural (sem persistência). */
  usesExecutionRegistryStructurally: true;
  /** Rastreamento estrutural via Execution Trace (EPC-24 Sprint 07). */
  dependsOnExecutionTrace: true;
  /** Trace utilizado exclusivamente de forma estrutural (sem logs / telemetria). */
  usesExecutionTraceStructurally: true;
  /** Catálogo estrutural de capacidades via Execution Capability Registry (EPC-24 Sprint 08). */
  dependsOnExecutionCapabilityRegistry: true;
  /** Capability Registry utilizado exclusivamente de forma estrutural (sem execução / descoberta). */
  usesExecutionCapabilityRegistryStructurally: true;
  /** Registro estrutural de dependências via Execution Dependency Registry (EPC-24 Sprint 09). */
  dependsOnExecutionDependencyRegistry: true;
  /** Dependency Registry utilizado exclusivamente de forma estrutural (sem resolução / ordenação). */
  usesExecutionDependencyRegistryStructurally: true;
  /** Registro estrutural de políticas via Execution Policy Registry (EPC-24 Sprint 10). */
  dependsOnExecutionPolicyRegistry: true;
  /** Policy Registry utilizado exclusivamente de forma estrutural (sem interpretação / avaliação). */
  usesExecutionPolicyRegistryStructurally: true;
  /** Registro estrutural de restrições via Execution Constraint Registry (EPC-24 Sprint 11). */
  dependsOnExecutionConstraintRegistry: true;
  /** Constraint Registry utilizado exclusivamente de forma estrutural (sem validação / bloqueio). */
  usesExecutionConstraintRegistryStructurally: true;
  /** Registro estrutural de requisitos via Execution Requirement Registry (EPC-24 Sprint 12). */
  dependsOnExecutionRequirementRegistry: true;
  /** Requirement Registry utilizado exclusivamente de forma estrutural (sem validação / pré-condições). */
  usesExecutionRequirementRegistryStructurally: true;
  /** Registro estrutural de recursos via Execution Resource Registry (EPC-24 Sprint 13). */
  dependsOnExecutionResourceRegistry: true;
  /** Resource Registry utilizado exclusivamente de forma estrutural (sem alocação / reserva / balanceamento). */
  usesExecutionResourceRegistryStructurally: true;
  /** Registro estrutural de ambientes via Execution Environment Registry (EPC-24 Sprint 14). */
  dependsOnExecutionEnvironmentRegistry: true;
  /** Environment Registry utilizado exclusivamente de forma estrutural (sem seleção / provisionamento / ativação). */
  usesExecutionEnvironmentRegistryStructurally: true;
  /** Infraestrutura estrutural de filas via ExecutionQueuePort (INF-01). */
  dependsOnExecutionQueue: true;
  /** Message Queue utilizado exclusivamente de forma estrutural (sem publicação / consumo / workers). */
  usesExecutionQueueStructurally: true;
  /** Infraestrutura estrutural de Workers via ExecutionWorkerPort (INF-02). */
  dependsOnExecutionWorker: true;
  /** Worker Foundation utilizado exclusivamente de forma estrutural (sem execução / threads / background jobs). */
  usesExecutionWorkerStructurally: true;
  /** Explicitamente sem OCR real nesta fundação. */
  implementsOcr: false;
  /** Explicitamente sem AI nesta fundação. */
  implementsAi: false;
  /** Explicitamente sem parser XML nesta fundação. */
  implementsXmlParser: false;
  /** Explicitamente sem regras TISS nesta fundação. */
  implementsTissRules: false;
  /** Explicitamente sem mapping real nesta fundação. */
  implementsMapping: false;
  /** Explicitamente sem validações nesta fundação. */
  implementsValidation: false;
  /** Explicitamente sem banco / migrations nesta fundação. */
  implementsPersistence: false;
  /** Explicitamente sem UI nesta fundação. */
  implementsUi: false;
  /** Explicitamente sem HTTP / Workers / filas nesta fundação. */
  implementsHttpWorkersQueues: false;
  /** Orquestração estrutural apenas — sem inteligência de negócio. */
  orchestrationOnly: true;
  /** Sem acoplamento direto entre Engines. */
  noDirectEngineCoupling: true;
};

/** Opções de resolução do CanonicalExecutionOrchestratorPort (provider factory). */
export type CanonicalExecutionOrchestratorProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultCanonicalExecutionOrchestratorAdapter).
   */
  provider?: CanonicalExecutionOrchestratorProviderId;
};

/** Re-export tipado do Pipeline Resolver (DI estrutural — Sprint 02). */
export type { PipelineResolverPort } from "../../pipeline-resolver/ports/pipeline-resolver-port";

/** Re-export tipado do Execution Context (DI estrutural — Sprint 03). */
export type { ExecutionContextPort } from "../../execution-context/ports/execution-context-port";
export type { ExecutionContext } from "../../execution-context/ports/models";

/** Re-export tipado da Execution State Machine (DI estrutural — Sprint 04). */
export type { ExecutionStateMachinePort } from "../../execution-state-machine/ports/execution-state-machine-port";
export type { ExecutionLifecycle } from "../../execution-state-machine/ports/models";

/** Re-export tipado do Execution Event Bus (DI estrutural — Sprint 05). */
export type { ExecutionEventBusPort } from "../../execution-event-bus/ports/execution-event-bus-port";
export type { ExecutionEventBus } from "../../execution-event-bus/ports/models";

/** Re-export tipado do Execution Registry (DI estrutural — Sprint 06). */
export type { ExecutionRegistryPort } from "../../execution-registry/ports/execution-registry-port";
export type { ExecutionRegistryEntry } from "../../execution-registry/ports/models";

/** Re-export tipado do Execution Trace (DI estrutural — Sprint 07). */
export type { ExecutionTracePort } from "../../execution-trace/ports/execution-trace-port";
export type { ExecutionTrace } from "../../execution-trace/ports/models";

/** Re-export tipado do Execution Capability Registry (DI estrutural — Sprint 08). */
export type { ExecutionCapabilityRegistryPort } from "../../execution-capability-registry/ports/execution-capability-registry-port";
export type { ExecutionCapabilityRegistry } from "../../execution-capability-registry/ports/models";

/** Re-export tipado do Execution Dependency Registry (DI estrutural — Sprint 09). */
export type { ExecutionDependencyRegistryPort } from "../../execution-dependency-registry/ports/execution-dependency-registry-port";
export type { ExecutionDependencyRegistry } from "../../execution-dependency-registry/ports/models";

/** Re-export tipado do Execution Policy Registry (DI estrutural — Sprint 10). */
export type { ExecutionPolicyRegistryPort } from "../../execution-policy-registry/ports/execution-policy-registry-port";
export type { ExecutionPolicyRegistry } from "../../execution-policy-registry/ports/models";

/** Re-export tipado do Execution Constraint Registry (DI estrutural — Sprint 11). */
export type { ExecutionConstraintRegistryPort } from "../../execution-constraint-registry/ports/execution-constraint-registry-port";
export type { ExecutionConstraintRegistry } from "../../execution-constraint-registry/ports/models";

/** Re-export tipado do Execution Requirement Registry (DI estrutural — Sprint 12). */
export type { ExecutionRequirementRegistryPort } from "../../execution-requirement-registry/ports/execution-requirement-registry-port";
export type { ExecutionRequirementRegistry } from "../../execution-requirement-registry/ports/models";

/** Re-export tipado do Execution Resource Registry (DI estrutural — Sprint 13). */
export type { ExecutionResourceRegistryPort } from "../../execution-resource-registry/ports/execution-resource-registry-port";
export type { ExecutionResourceRegistry } from "../../execution-resource-registry/ports/models";

/** Re-export tipado do Execution Environment Registry (DI estrutural — Sprint 14). */
export type { ExecutionEnvironmentRegistryPort } from "../../execution-environment-registry/ports/execution-environment-registry-port";
export type { ExecutionEnvironmentRegistry } from "../../execution-environment-registry/ports/models";

/** Re-export tipado do Message Queue / ExecutionQueuePort (DI estrutural — INF-01). */
export type { ExecutionQueuePort } from "../../message-queue/ports/execution-queue-port";
export type { CanonicalQueue } from "../../message-queue/ports/models";

/** Re-export tipado do Worker Foundation / ExecutionWorkerPort (DI estrutural — INF-02). */
export type { ExecutionWorkerPort } from "../../worker-foundation/ports/execution-worker-port";
export type { CanonicalWorker } from "../../worker-foundation/ports/models";
