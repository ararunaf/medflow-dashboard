/**
 * DefaultCanonicalExecutionOrchestratorAdapter — adapter default in-memory (EPC-24).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas reais.
 *
 * Sprint 02: composição do pipeline obtida exclusivamente via PipelineResolverPort.
 * Sprint 03: cria e utiliza exclusivamente o ExecutionContextPort.
 * Sprint 04: ciclo de vida estrutural exclusivo via ExecutionStateMachinePort.
 * Sprint 05: barramento estrutural exclusivo via ExecutionEventBusPort.
 * Sprint 06: catálogo estrutural exclusivo via ExecutionRegistryPort.
 * Sprint 07: rastreamento estrutural exclusivo via ExecutionTracePort.
 * Sprint 08: catálogo estrutural de capacidades exclusivo via ExecutionCapabilityRegistryPort.
 * Sprint 09: registro estrutural de dependências exclusivo via ExecutionDependencyRegistryPort.
 * Sprint 10: registro estrutural de políticas exclusivo via ExecutionPolicyRegistryPort.
 * Sprint 11: registro estrutural de restrições exclusivo via ExecutionConstraintRegistryPort.
 * Sprint 12: registro estrutural de requisitos exclusivo via ExecutionRequirementRegistryPort.
 * Sprint 13: registro estrutural de recursos exclusivo via ExecutionResourceRegistryPort.
 * Sprint 14: registro estrutural de ambientes exclusivo via ExecutionEnvironmentRegistryPort.
 * INF-01: infraestrutura estrutural de filas exclusiva via ExecutionQueuePort.
 * INF-02: infraestrutura estrutural de Workers exclusiva via ExecutionWorkerPort.
 * INF-03: infraestrutura estrutural de Schedulers exclusiva via ExecutionSchedulerPort.
 * INF-04: infraestrutura estrutural de Observabilidade exclusiva via ExecutionObservabilityPort.
 * INF-05: infraestrutura estrutural de Health Center exclusiva via ExecutionHealthCenterPort.
 * Nenhum Port Foundation é chamado diretamente pelo Orchestrator.
 */
import { createExecutionCapabilityRegistryPort } from "../../execution-capability-registry/providers/create-execution-capability-registry-port";
import type { ExecutionCapabilityRegistryPort } from "../../execution-capability-registry/ports/execution-capability-registry-port";
import { createExecutionConstraintRegistryPort } from "../../execution-constraint-registry/providers/create-execution-constraint-registry-port";
import type { ExecutionConstraintRegistryPort } from "../../execution-constraint-registry/ports/execution-constraint-registry-port";
import { createExecutionContextPort } from "../../execution-context/providers/create-execution-context-port";
import type { ExecutionContextPort } from "../../execution-context/ports/execution-context-port";
import type { ExecutionContext } from "../../execution-context/ports/models";
import { createExecutionDependencyRegistryPort } from "../../execution-dependency-registry/providers/create-execution-dependency-registry-port";
import type { ExecutionDependencyRegistryPort } from "../../execution-dependency-registry/ports/execution-dependency-registry-port";
import { createExecutionEnvironmentRegistryPort } from "../../execution-environment-registry/providers/create-execution-environment-registry-port";
import type { ExecutionEnvironmentRegistryPort } from "../../execution-environment-registry/ports/execution-environment-registry-port";
import { createExecutionQueuePort } from "../../message-queue/providers/message-queue-provider";
import type { ExecutionQueuePort } from "../../message-queue/ports/execution-queue-port";
import { createExecutionWorkerPort } from "../../worker-foundation/providers/execution-worker-provider";
import type { ExecutionWorkerPort } from "../../worker-foundation/ports/execution-worker-port";
import { createExecutionSchedulerPort } from "../../scheduler-foundation/providers/execution-scheduler-provider";
import type { ExecutionSchedulerPort } from "../../scheduler-foundation/ports/execution-scheduler-port";
import { createExecutionObservabilityPort } from "../../observability-foundation/providers/execution-observability-provider";
import type { ExecutionObservabilityPort } from "../../observability-foundation/ports/execution-observability-port";
import { createExecutionHealthCenterPort } from "../../health-center-foundation/providers/execution-health-center-provider";
import type { ExecutionHealthCenterPort } from "../../health-center-foundation/ports/execution-health-center-port";
import { createExecutionEventBusPort } from "../../execution-event-bus/providers/create-execution-event-bus-port";
import type { ExecutionEventBusPort } from "../../execution-event-bus/ports/execution-event-bus-port";
import { createExecutionPolicyRegistryPort } from "../../execution-policy-registry/providers/create-execution-policy-registry-port";
import type { ExecutionPolicyRegistryPort } from "../../execution-policy-registry/ports/execution-policy-registry-port";
import { createExecutionRegistryPort } from "../../execution-registry/providers/create-execution-registry-port";
import type { ExecutionRegistryPort } from "../../execution-registry/ports/execution-registry-port";
import { createExecutionRequirementRegistryPort } from "../../execution-requirement-registry/providers/create-execution-requirement-registry-port";
import type { ExecutionRequirementRegistryPort } from "../../execution-requirement-registry/ports/execution-requirement-registry-port";
import { createExecutionResourceRegistryPort } from "../../execution-resource-registry/providers/create-execution-resource-registry-port";
import type { ExecutionResourceRegistryPort } from "../../execution-resource-registry/ports/execution-resource-registry-port";
import { createExecutionStateMachinePort } from "../../execution-state-machine/providers/create-execution-state-machine-port";
import type { ExecutionStateMachinePort } from "../../execution-state-machine/ports/execution-state-machine-port";
import { createExecutionTracePort } from "../../execution-trace/providers/create-execution-trace-port";
import type { ExecutionTracePort } from "../../execution-trace/ports/execution-trace-port";
import { createPipelineResolverPort } from "../../pipeline-resolver/providers/create-pipeline-resolver-port";
import type { PipelineResolverPort } from "../../pipeline-resolver/ports/pipeline-resolver-port";
import {
  createCorrelationId,
  createExecutionId,
  createResultId,
  createStepId,
  createTraceId,
} from "../ports/identity";
import { ORCHESTRATED_FOUNDATION_PORTS } from "../ports/foundation-ports";
import type { CanonicalExecutionOrchestratorPort } from "../ports/canonical-execution-orchestrator-port";
import type {
  CanonicalExecutionContext,
  CanonicalExecutionResult,
  CanonicalExecutionTrace,
} from "../ports/models";
import type {
  CanonicalExecutionOrchestratorCapabilities,
  CanonicalExecutionOrchestratorHealth,
  FoundationPortRegistry,
  GetExecutionInput,
  GetExecutionResult,
  ListExecutionsInput,
  ListExecutionsResult,
  StartExecutionInput,
  StartExecutionResult,
} from "../ports/types";
import {
  DefaultCanonicalExecutionOrchestratorStore,
  type CanonicalExecutionOrchestratorStore,
} from "../store";
import {
  attachCapabilityRegistryToExecutionContext,
  attachConstraintRegistryToExecutionContext,
  attachDependencyRegistryToExecutionContext,
  attachEnvironmentRegistryToExecutionContext,
  attachEventBusToExecutionContext,
  attachMessageQueueToExecutionContext,
  attachPipelineToExecutionContext,
  attachPolicyRegistryToExecutionContext,
  attachRegistryToExecutionContext,
  attachRequirementRegistryToExecutionContext,
  attachResourceRegistryToExecutionContext,
  attachStateMachineToExecutionContext,
  attachTraceToExecutionContext,
  attachObservabilityToExecutionContext,
  attachHealthCenterToExecutionContext,
  attachSchedulerToExecutionContext,
  attachWorkerToExecutionContext,
  buildRequest,
  createExecutionContextFromRequest,
  createExecutionEventBusForContext,
  createExecutionStateMachineForContext,
  createExecutionTraceForContext,
  durationMs,
  filterContexts,
  finalizeExecutionContext,
  foundationCapabilitiesBase,
  persistExecutionState,
  registerCapabilityRegistryForContext,
  registerConstraintRegistryForContext,
  registerDependencyRegistryForContext,
  registerEnvironmentRegistryForContext,
  registerExecutionInRegistry,
  registerMessageQueueForContext,
  registerPolicyRegistryForContext,
  registerRequirementRegistryForContext,
  registerResourceRegistryForContext,
  registerObservabilityForContext,
  registerHealthCenterForContext,
  registerSchedulerForContext,
  registerWorkerForContext,
  resolvePipelineComposition,
  runStructuralPipeline,
  stepsFromPipelineResolution,
  transitionExecutionState,
} from "./orchestrator-helpers";

export const DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID = "default-in-process";
export const DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind do Pipeline Resolver / Execution Context
 * sem acoplar o Orquestrador a detalhes de produto ou Engines.
 */
export type DefaultCanonicalExecutionOrchestratorRuntime = {
  /** Store ativo. Default: DefaultCanonicalExecutionOrchestratorStore in-process. */
  store?: CanonicalExecutionOrchestratorStore;
  /**
   * Pipeline Resolver — única fonte da composição do pipeline (EPC-24 Sprint 02).
   * Default: createPipelineResolverPort().
   */
  pipelineResolver?: PipelineResolverPort;
  /**
   * Execution Context — único objeto compartilhado da execução (EPC-24 Sprint 03).
   * Default: createExecutionContextPort().
   */
  executionContext?: ExecutionContextPort;
  /**
   * Execution State Machine — ciclo de vida estrutural exclusivo (EPC-24 Sprint 04).
   * Default: createExecutionStateMachinePort().
   */
  executionStateMachine?: ExecutionStateMachinePort;
  /**
   * Execution Event Bus — barramento estrutural exclusivo (EPC-24 Sprint 05).
   * Default: createExecutionEventBusPort().
   * Nenhum evento é publicado nesta sprint.
   */
  executionEventBus?: ExecutionEventBusPort;
  /**
   * Execution Registry — catálogo estrutural exclusivo (EPC-24 Sprint 06).
   * Default: createExecutionRegistryPort().
   * Nenhuma persistência real nesta sprint.
   */
  executionRegistry?: ExecutionRegistryPort;
  /**
   * Execution Trace — rastreamento estrutural exclusivo (EPC-24 Sprint 07).
   * Default: createExecutionTracePort().
   * Nenhum log real / telemetria nesta sprint.
   */
  executionTrace?: ExecutionTracePort;
  /**
   * Execution Capability Registry — catálogo estrutural de capacidades (EPC-24 Sprint 08).
   * Default: createExecutionCapabilityRegistryPort().
   * Nenhuma capacidade é executada / descoberta nesta sprint.
   */
  executionCapabilityRegistry?: ExecutionCapabilityRegistryPort;
  /**
   * Execution Dependency Registry — registro estrutural de dependências (EPC-24 Sprint 09).
   * Default: createExecutionDependencyRegistryPort().
   * Nenhuma dependência é resolvida / ordenada nesta sprint.
   */
  executionDependencyRegistry?: ExecutionDependencyRegistryPort;
  /**
   * Execution Policy Registry — registro estrutural de políticas (EPC-24 Sprint 10).
   * Default: createExecutionPolicyRegistryPort().
   * Nenhuma política é interpretada / avaliada nesta sprint.
   */
  executionPolicyRegistry?: ExecutionPolicyRegistryPort;
  /**
   * Execution Constraint Registry — registro estrutural de restrições (EPC-24 Sprint 11).
   * Default: createExecutionConstraintRegistryPort().
   * Nenhuma restrição é validada / aplicada nesta sprint.
   */
  executionConstraintRegistry?: ExecutionConstraintRegistryPort;
  /**
   * Execution Requirement Registry — registro estrutural de requisitos (EPC-24 Sprint 12).
   * Default: createExecutionRequirementRegistryPort().
   * Nenhum requisito é validado / nenhuma pré-condição é verificada nesta sprint.
   */
  executionRequirementRegistry?: ExecutionRequirementRegistryPort;
  /**
   * Execution Resource Registry — registro estrutural de recursos (EPC-24 Sprint 13).
   * Default: createExecutionResourceRegistryPort().
   * Nenhum recurso é alocado / reservado / balanceado nesta sprint.
   */
  executionResourceRegistry?: ExecutionResourceRegistryPort;
  /**
   * Execution Environment Registry — registro estrutural de ambientes (EPC-24 Sprint 14).
   * Default: createExecutionEnvironmentRegistryPort().
   * Nenhum ambiente é selecionado / provisionado / ativado nesta sprint.
   */
  executionEnvironmentRegistry?: ExecutionEnvironmentRegistryPort;
  /**
   * Message Queue — infraestrutura estrutural de filas (INF-01).
   * Default: createExecutionQueuePort().
   * Nenhuma mensagem é publicada / consumida nesta sprint.
   */
  executionQueue?: ExecutionQueuePort;
  /**
   * Worker Foundation — infraestrutura estrutural de Workers (INF-02).
   * Default: createExecutionWorkerPort().
   * Nenhum Worker é executado / iniciado nesta sprint.
   */
  executionWorker?: ExecutionWorkerPort;
  /**
   * Scheduler Foundation — infraestrutura estrutural de Schedulers (INF-03).
   * Default: createExecutionSchedulerPort().
   * Nenhum Schedule é executado / cron / timer nesta sprint.
   */
  executionScheduler?: ExecutionSchedulerPort;
  /**
   * Observability Foundation — infraestrutura estrutural de Observabilidade (INF-04).
   * Default: createExecutionObservabilityPort().
   * Nenhum log / métrica / tracing / transmissão nesta sprint.
   */
  executionObservability?: ExecutionObservabilityPort;
  /**
   * Health Center Foundation — infraestrutura estrutural de Health Center (INF-05).
   * Default: createExecutionHealthCenterPort().
   * Nenhum monitoramento / health check real / consulta nesta sprint.
   */
  executionHealthCenter?: ExecutionHealthCenterPort;
  /**
   * Registry opcional de Ports Foundation (type-safe DI legado).
   * Nesta fundação os Ports NÃO são invocados — resolução via Pipeline Resolver.
   */
  foundationPorts?: FoundationPortRegistry;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionId?: () => string;
  createStepId?: () => string;
  createResultId?: () => string;
  createTraceId?: () => string;
  createCorrelationId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultCanonicalExecutionOrchestratorRuntime {
  return {
    store: new DefaultCanonicalExecutionOrchestratorStore(),
    pipelineResolver: createPipelineResolverPort(),
    executionContext: createExecutionContextPort(),
    executionStateMachine: createExecutionStateMachinePort(),
    executionEventBus: createExecutionEventBusPort(),
    executionRegistry: createExecutionRegistryPort(),
    executionTrace: createExecutionTracePort(),
    executionCapabilityRegistry: createExecutionCapabilityRegistryPort(),
    executionDependencyRegistry: createExecutionDependencyRegistryPort(),
    executionPolicyRegistry: createExecutionPolicyRegistryPort(),
    executionConstraintRegistry: createExecutionConstraintRegistryPort(),
    executionRequirementRegistry: createExecutionRequirementRegistryPort(),
    executionResourceRegistry: createExecutionResourceRegistryPort(),
    executionEnvironmentRegistry: createExecutionEnvironmentRegistryPort(),
    executionQueue: createExecutionQueuePort(),
    executionWorker: createExecutionWorkerPort(),
    executionScheduler: createExecutionSchedulerPort(),
    executionObservability: createExecutionObservabilityPort(),
    executionHealthCenter: createExecutionHealthCenterPort(),
  };
}

function nowIso(runtime: DefaultCanonicalExecutionOrchestratorRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function storeCounts(store: CanonicalExecutionOrchestratorStore) {
  return {
    storedContextCount: store.contextCount(),
    storedResultCount: store.resultCount(),
    storedTraceCount: store.traceCount(),
  };
}

export class DefaultCanonicalExecutionOrchestratorAdapter implements CanonicalExecutionOrchestratorPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultCanonicalExecutionOrchestratorRuntime;
  private readonly store: CanonicalExecutionOrchestratorStore;
  private readonly pipelineResolver: PipelineResolverPort;
  private readonly executionContextPort: ExecutionContextPort;
  private readonly executionStateMachinePort: ExecutionStateMachinePort;
  private readonly executionEventBusPort: ExecutionEventBusPort;
  private readonly executionRegistryPort: ExecutionRegistryPort;
  private readonly executionTracePort: ExecutionTracePort;
  private readonly executionCapabilityRegistryPort: ExecutionCapabilityRegistryPort;
  private readonly executionDependencyRegistryPort: ExecutionDependencyRegistryPort;
  private readonly executionPolicyRegistryPort: ExecutionPolicyRegistryPort;
  private readonly executionConstraintRegistryPort: ExecutionConstraintRegistryPort;
  private readonly executionRequirementRegistryPort: ExecutionRequirementRegistryPort;
  private readonly executionResourceRegistryPort: ExecutionResourceRegistryPort;
  private readonly executionEnvironmentRegistryPort: ExecutionEnvironmentRegistryPort;
  private readonly executionQueuePort: ExecutionQueuePort;
  private readonly executionWorkerPort: ExecutionWorkerPort;
  private readonly executionSchedulerPort: ExecutionSchedulerPort;
  private readonly executionObservabilityPort: ExecutionObservabilityPort;
  private readonly executionHealthCenterPort: ExecutionHealthCenterPort;

  constructor(runtime: DefaultCanonicalExecutionOrchestratorRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultCanonicalExecutionOrchestratorStore();
    this.pipelineResolver = runtime.pipelineResolver ?? createPipelineResolverPort();
    this.executionContextPort = runtime.executionContext ?? createExecutionContextPort();
    this.executionStateMachinePort =
      runtime.executionStateMachine ?? createExecutionStateMachinePort();
    this.executionEventBusPort = runtime.executionEventBus ?? createExecutionEventBusPort();
    this.executionRegistryPort = runtime.executionRegistry ?? createExecutionRegistryPort();
    this.executionTracePort = runtime.executionTrace ?? createExecutionTracePort();
    this.executionCapabilityRegistryPort =
      runtime.executionCapabilityRegistry ?? createExecutionCapabilityRegistryPort();
    this.executionDependencyRegistryPort =
      runtime.executionDependencyRegistry ?? createExecutionDependencyRegistryPort();
    this.executionPolicyRegistryPort =
      runtime.executionPolicyRegistry ?? createExecutionPolicyRegistryPort();
    this.executionConstraintRegistryPort =
      runtime.executionConstraintRegistry ?? createExecutionConstraintRegistryPort();
    this.executionRequirementRegistryPort =
      runtime.executionRequirementRegistry ?? createExecutionRequirementRegistryPort();
    this.executionResourceRegistryPort =
      runtime.executionResourceRegistry ?? createExecutionResourceRegistryPort();
    this.executionEnvironmentRegistryPort =
      runtime.executionEnvironmentRegistry ?? createExecutionEnvironmentRegistryPort();
    this.executionQueuePort = runtime.executionQueue ?? createExecutionQueuePort();
    this.executionWorkerPort = runtime.executionWorker ?? createExecutionWorkerPort();
    this.executionSchedulerPort = runtime.executionScheduler ?? createExecutionSchedulerPort();
    this.executionObservabilityPort =
      runtime.executionObservability ?? createExecutionObservabilityPort();
    this.executionHealthCenterPort =
      runtime.executionHealthCenter ?? createExecutionHealthCenterPort();
  }

  /** Acesso estrutural ao store (testes / demo). */
  getStore(): CanonicalExecutionOrchestratorStore {
    return this.store;
  }

  /** Acesso estrutural ao Pipeline Resolver (testes — sem invocação de Engines). */
  getPipelineResolver(): PipelineResolverPort {
    return this.pipelineResolver;
  }

  /** Acesso estrutural ao Execution Context Port (testes — sem processamento). */
  getExecutionContextPort(): ExecutionContextPort {
    return this.executionContextPort;
  }

  /** Acesso estrutural ao Execution State Machine Port (testes — sem Engines). */
  getExecutionStateMachinePort(): ExecutionStateMachinePort {
    return this.executionStateMachinePort;
  }

  /** Acesso estrutural ao Execution Event Bus Port (testes — sem entrega). */
  getExecutionEventBusPort(): ExecutionEventBusPort {
    return this.executionEventBusPort;
  }

  /** Acesso estrutural ao Execution Registry Port (testes — sem persistência). */
  getExecutionRegistryPort(): ExecutionRegistryPort {
    return this.executionRegistryPort;
  }

  /** Acesso estrutural ao Execution Trace Port (testes — sem logs / telemetria). */
  getExecutionTracePort(): ExecutionTracePort {
    return this.executionTracePort;
  }

  /** Acesso estrutural ao Execution Capability Registry Port (testes — sem execução). */
  getExecutionCapabilityRegistryPort(): ExecutionCapabilityRegistryPort {
    return this.executionCapabilityRegistryPort;
  }

  /** Acesso estrutural ao Execution Dependency Registry Port (testes — sem resolução). */
  getExecutionDependencyRegistryPort(): ExecutionDependencyRegistryPort {
    return this.executionDependencyRegistryPort;
  }

  /** Acesso estrutural ao Execution Policy Registry Port (testes — sem avaliação). */
  getExecutionPolicyRegistryPort(): ExecutionPolicyRegistryPort {
    return this.executionPolicyRegistryPort;
  }

  /** Acesso estrutural ao Execution Constraint Registry Port (testes — sem validação). */
  getExecutionConstraintRegistryPort(): ExecutionConstraintRegistryPort {
    return this.executionConstraintRegistryPort;
  }

  getExecutionRequirementRegistryPort(): ExecutionRequirementRegistryPort {
    return this.executionRequirementRegistryPort;
  }

  getExecutionResourceRegistryPort(): ExecutionResourceRegistryPort {
    return this.executionResourceRegistryPort;
  }

  getExecutionEnvironmentRegistryPort(): ExecutionEnvironmentRegistryPort {
    return this.executionEnvironmentRegistryPort;
  }

  getExecutionQueuePort(): ExecutionQueuePort {
    return this.executionQueuePort;
  }

  getExecutionWorkerPort(): ExecutionWorkerPort {
    return this.executionWorkerPort;
  }

  getExecutionSchedulerPort(): ExecutionSchedulerPort {
    return this.executionSchedulerPort;
  }

  getExecutionObservabilityPort(): ExecutionObservabilityPort {
    return this.executionObservabilityPort;
  }

  getExecutionHealthCenterPort(): ExecutionHealthCenterPort {
    return this.executionHealthCenterPort;
  }

  /** Acesso estrutural ao registry de Ports (testes — sem invocação de negócio). */
  getFoundationPorts(): FoundationPortRegistry | undefined {
    return this.runtime.foundationPorts;
  }

  capabilities(): CanonicalExecutionOrchestratorCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID),
    };
  }

  async health(): Promise<CanonicalExecutionOrchestratorHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default canonical-execution-orchestrator probe ok."
            : "Default canonical-execution-orchestrator probe falhou."),
        foundationPortRefCount: ORCHESTRATED_FOUNDATION_PORTS.length,
        ...storeCounts(this.store),
      };
    }

    const storeHealth = this.store.health();
    const resolverHealth = await this.pipelineResolver.health();
    const contextHealth = await this.executionContextPort.health();
    const stateMachineHealth = await this.executionStateMachinePort.health();
    const eventBusHealth = await this.executionEventBusPort.health();
    const registryHealth = await this.executionRegistryPort.health();
    const traceHealth = await this.executionTracePort.health();
    const capabilityRegistryHealth = await this.executionCapabilityRegistryPort.health();
    const dependencyRegistryHealth = await this.executionDependencyRegistryPort.health();
    const policyRegistryHealth = await this.executionPolicyRegistryPort.health();
    const constraintRegistryHealth = await this.executionConstraintRegistryPort.health();
    const requirementRegistryHealth = await this.executionRequirementRegistryPort.health();
    const resourceRegistryHealth = await this.executionResourceRegistryPort.health();
    const environmentRegistryHealth = await this.executionEnvironmentRegistryPort.health();
    const messageQueueHealth = await this.executionQueuePort.health();
    const workerHealth = await this.executionWorkerPort.health();
    const schedulerHealth = await this.executionSchedulerPort.health();
    const observabilityHealth = await this.executionObservabilityPort.health();
    const healthCenterHealth = await this.executionHealthCenterPort.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok:
        storeHealth.ok &&
        resolverHealth.ok &&
        contextHealth.ok &&
        stateMachineHealth.ok &&
        eventBusHealth.ok &&
        registryHealth.ok &&
        traceHealth.ok &&
        capabilityRegistryHealth.ok &&
        dependencyRegistryHealth.ok &&
        policyRegistryHealth.ok &&
        constraintRegistryHealth.ok &&
        requirementRegistryHealth.ok &&
        resourceRegistryHealth.ok &&
        environmentRegistryHealth.ok &&
        messageQueueHealth.ok &&
        workerHealth.ok &&
        schedulerHealth.ok &&
        observabilityHealth.ok &&
        healthCenterHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "DefaultCanonicalExecutionOrchestratorStore pronto (Context + Resolver + State Machine + Event Bus + Registry + Trace + Capability Registry + Dependency Registry + Policy Registry + Constraint Registry + Requirement Registry + Resource Registry + Environment Registry + Message Queue — INF-01 + Worker Foundation — INF-02 + Scheduler Foundation — INF-03 + Observability Foundation — INF-04 + Health Center Foundation — INF-05).",
      foundationPortRefCount: ORCHESTRATED_FOUNDATION_PORTS.length,
      ...storeCounts(this.store),
    };
  }

  async startExecution(input: StartExecutionInput = {}): Promise<StartExecutionResult> {
    const stamp = nowIso(this.runtime);
    const executionId = this.runtime.createExecutionId?.() ?? createExecutionId();
    const resultId = this.runtime.createResultId?.() ?? createResultId();
    const traceId = this.runtime.createTraceId?.() ?? createTraceId();
    const correlationId =
      input.correlationId ??
      input.request?.correlationId ??
      this.runtime.createCorrelationId?.() ??
      createCorrelationId();
    const stepIdFactory = this.runtime.createStepId ?? createStepId;

    const request = buildRequest(input, correlationId);

    // 1. Criar Execution Context canônico (único objeto de transporte).
    await createExecutionContextFromRequest(this.executionContextPort, request, executionId);

    // 2. Composição dinâmica — exclusiva via Pipeline Resolver (Resolver independente do Context).
    const pipelineResolution = await resolvePipelineComposition(this.pipelineResolver, request);

    // 3. Criar Execution State Machine (ciclo de vida estrutural exclusivo).
    let lifecycle = await createExecutionStateMachineForContext(
      this.executionStateMachinePort,
      executionId,
      correlationId,
    );

    // 4. Anexar estado inicial ao Context (referência estrutural — lifecycle na SM).
    await attachStateMachineToExecutionContext(
      this.executionContextPort,
      executionId,
      lifecycle,
      stamp,
    );

    // 5. Criar Execution Event Bus (barramento estrutural — sem publicação).
    const eventBus = await createExecutionEventBusForContext(
      this.executionEventBusPort,
      executionId,
      correlationId,
    );

    // 6. Anexar Event Bus ao Context (referência estrutural — sem eventos publicados).
    await attachEventBusToExecutionContext(this.executionContextPort, executionId, eventBus, stamp);

    // 7. Registrar Execution no Registry (catálogo estrutural — sem persistência).
    const registryEntry = await registerExecutionInRegistry(this.executionRegistryPort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      pipelineId: pipelineResolution.pipelineId,
    });

    // 8. Anexar executionRegistryId ao Context (referência estrutural).
    await attachRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      registryEntry,
      stamp,
    );

    // 9. Criar Execution Trace (rastreamento estrutural — sem logs / telemetria).
    const executionTrace = await createExecutionTraceForContext(this.executionTracePort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      executionRegistryId: registryEntry.executionRegistryId,
      pipelineId: pipelineResolution.pipelineId,
    });

    // 10. Anexar executionTraceId ao Context (referência estrutural).
    await attachTraceToExecutionContext(
      this.executionContextPort,
      executionId,
      executionTrace,
      stamp,
    );

    // 11. Registrar Capability Registry (catálogo estrutural — sem execução / descoberta).
    const capabilityRegistry = await registerCapabilityRegistryForContext(
      this.executionCapabilityRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 12. Anexar executionCapabilityRegistryId ao Context (referência estrutural).
    await attachCapabilityRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      capabilityRegistry,
      stamp,
    );

    // 13. Registrar Dependency Registry (catálogo estrutural — sem resolução / ordenação).
    const dependencyRegistry = await registerDependencyRegistryForContext(
      this.executionDependencyRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 14. Anexar executionDependencyRegistryId ao Context (referência estrutural).
    await attachDependencyRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      dependencyRegistry,
      stamp,
    );

    // 15. Registrar Policy Registry (catálogo estrutural — sem interpretação / avaliação).
    const policyRegistry = await registerPolicyRegistryForContext(
      this.executionPolicyRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 16. Anexar executionPolicyRegistryId ao Context (referência estrutural).
    await attachPolicyRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      policyRegistry,
      stamp,
    );

    // 17. Registrar Constraint Registry (catálogo estrutural — sem validação / bloqueio).
    const constraintRegistry = await registerConstraintRegistryForContext(
      this.executionConstraintRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 18. Anexar executionConstraintRegistryId ao Context (referência estrutural).
    await attachConstraintRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      constraintRegistry,
      stamp,
    );

    // 19. Registrar Requirement Registry (catálogo estrutural — sem validação / pré-condições).
    const requirementRegistry = await registerRequirementRegistryForContext(
      this.executionRequirementRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
        executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 20. Anexar executionRequirementRegistryId ao Context (referência estrutural).
    await attachRequirementRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      requirementRegistry,
      stamp,
    );

    // 21. Registrar Resource Registry (catálogo estrutural — sem alocação / reserva / balanceamento).
    const resourceRegistry = await registerResourceRegistryForContext(
      this.executionResourceRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
        executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
        executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 22. Anexar executionResourceRegistryId ao Context (referência estrutural).
    await attachResourceRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      resourceRegistry,
      stamp,
    );

    // 23. Registrar Environment Registry (catálogo estrutural — sem seleção / provisionamento / ativação).
    const environmentRegistry = await registerEnvironmentRegistryForContext(
      this.executionEnvironmentRegistryPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
        executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
        executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
        executionResourceRegistryId: resourceRegistry.executionResourceRegistryId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 24. Anexar executionEnvironmentRegistryId ao Context (referência estrutural).
    await attachEnvironmentRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      environmentRegistry,
      stamp,
    );

    // 25. Resolver Message Queue (infraestrutura estrutural — sem publicação / consumo / workers).
    const messageQueue = await registerMessageQueueForContext(this.executionQueuePort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      executionRegistryId: registryEntry.executionRegistryId,
      executionTraceId: executionTrace.executionTraceId,
      executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
      executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
      executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
      executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
      executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
      executionResourceRegistryId: resourceRegistry.executionResourceRegistryId,
      executionEnvironmentRegistryId: environmentRegistry.executionEnvironmentRegistryId,
      pipelineId: pipelineResolution.pipelineId,
    });

    // 26. Anexar executionMessageQueueId ao Context (referência estrutural — sem publicação).
    await attachMessageQueueToExecutionContext(
      this.executionContextPort,
      executionId,
      messageQueue,
      stamp,
    );

    // 27. Resolver Worker Foundation (infraestrutura estrutural — sem execução / threads / background jobs).
    const executionWorker = await registerWorkerForContext(this.executionWorkerPort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      executionRegistryId: registryEntry.executionRegistryId,
      executionTraceId: executionTrace.executionTraceId,
      executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
      executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
      executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
      executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
      executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
      executionResourceRegistryId: resourceRegistry.executionResourceRegistryId,
      executionEnvironmentRegistryId: environmentRegistry.executionEnvironmentRegistryId,
      executionMessageQueueId: messageQueue.executionMessageQueueId,
      pipelineId: pipelineResolution.pipelineId,
    });

    // 28. Anexar executionWorkerId ao Context (referência estrutural — sem execução).
    await attachWorkerToExecutionContext(
      this.executionContextPort,
      executionId,
      executionWorker,
      stamp,
    );

    // 29. Resolver Scheduler Foundation (infraestrutura estrutural — sem execução / cron / timers / jobs).
    const executionScheduler = await registerSchedulerForContext(this.executionSchedulerPort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      executionRegistryId: registryEntry.executionRegistryId,
      executionTraceId: executionTrace.executionTraceId,
      executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
      executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
      executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
      executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
      executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
      executionResourceRegistryId: resourceRegistry.executionResourceRegistryId,
      executionEnvironmentRegistryId: environmentRegistry.executionEnvironmentRegistryId,
      executionMessageQueueId: messageQueue.executionMessageQueueId,
      executionWorkerId: executionWorker.executionWorkerId,
      pipelineId: pipelineResolution.pipelineId,
    });

    // 30. Anexar executionSchedulerId ao Context (referência estrutural — sem execução).
    await attachSchedulerToExecutionContext(
      this.executionContextPort,
      executionId,
      executionScheduler,
      stamp,
    );

    // 31. Resolver Observability Foundation (infraestrutura estrutural — sem logs / métricas / tracing / transmissão).
    const executionObservability = await registerObservabilityForContext(
      this.executionObservabilityPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
        executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
        executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
        executionResourceRegistryId: resourceRegistry.executionResourceRegistryId,
        executionEnvironmentRegistryId: environmentRegistry.executionEnvironmentRegistryId,
        executionMessageQueueId: messageQueue.executionMessageQueueId,
        executionWorkerId: executionWorker.executionWorkerId,
        executionSchedulerId: executionScheduler.executionSchedulerId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 32. Anexar executionObservabilityId ao Context (referência estrutural — sem monitoramento).
    await attachObservabilityToExecutionContext(
      this.executionContextPort,
      executionId,
      executionObservability,
      stamp,
    );

    // 33. Resolver Health Center Foundation (infraestrutura estrutural — sem monitoramento / health checks / consultas).
    const executionHealthCenter = await registerHealthCenterForContext(
      this.executionHealthCenterPort,
      {
        executionId,
        correlationId,
        contextId: executionId,
        stateMachineId: lifecycle.stateMachineId,
        eventBusId: eventBus.eventBusId,
        executionRegistryId: registryEntry.executionRegistryId,
        executionTraceId: executionTrace.executionTraceId,
        executionCapabilityRegistryId: capabilityRegistry.executionCapabilityRegistryId,
        executionDependencyRegistryId: dependencyRegistry.executionDependencyRegistryId,
        executionPolicyRegistryId: policyRegistry.executionPolicyRegistryId,
        executionConstraintRegistryId: constraintRegistry.executionConstraintRegistryId,
        executionRequirementRegistryId: requirementRegistry.executionRequirementRegistryId,
        executionResourceRegistryId: resourceRegistry.executionResourceRegistryId,
        executionEnvironmentRegistryId: environmentRegistry.executionEnvironmentRegistryId,
        executionMessageQueueId: messageQueue.executionMessageQueueId,
        executionWorkerId: executionWorker.executionWorkerId,
        executionSchedulerId: executionScheduler.executionSchedulerId,
        executionObservabilityId: executionObservability.executionObservabilityId,
        pipelineId: pipelineResolution.pipelineId,
      },
    );

    // 34. Anexar executionHealthCenterId ao Context (referência estrutural — sem monitoramento).
    await attachHealthCenterToExecutionContext(
      this.executionContextPort,
      executionId,
      executionHealthCenter.executionHealthCenterId,
      stamp,
    );

    // Transições estruturais de ciclo de vida (sem Engines / sem ações de negócio).
    lifecycle = await transitionExecutionState(
      this.executionStateMachinePort,
      lifecycle.stateMachineId,
      "Pending",
      "context-ready",
    );
    lifecycle = await transitionExecutionState(
      this.executionStateMachinePort,
      lifecycle.stateMachineId,
      "Resolving",
      "pipeline-resolving",
    );

    // 29. Anexar composição ao Execution Context (IDs de estágio separados dos steps).
    await attachPipelineToExecutionContext(
      this.executionContextPort,
      executionId,
      pipelineResolution,
      stamp,
    );

    lifecycle = await transitionExecutionState(
      this.executionStateMachinePort,
      lifecycle.stateMachineId,
      "Ready",
      "pipeline-attached",
    );
    lifecycle = await transitionExecutionState(
      this.executionStateMachinePort,
      lifecycle.stateMachineId,
      "Running",
      "structural-walk",
    );

    // 30. Percurso estrutural (sem Engines) + projeção legada.
    const pending = stepsFromPipelineResolution(pipelineResolution, stepIdFactory);
    const { steps, refs } = runStructuralPipeline(pending, request, stamp);

    lifecycle = await transitionExecutionState(
      this.executionStateMachinePort,
      lifecycle.stateMachineId,
      "Completed",
      "structural-finalize",
    );

    // 31. Finalizar / enriquecer Execution Context estruturalmente (transporte).
    const executionContext: ExecutionContext = await finalizeExecutionContext(
      this.executionContextPort,
      executionId,
      steps,
      refs,
      resultId,
      traceId,
      stamp,
    );

    const context: CanonicalExecutionContext = {
      kind: "canonical-execution-context",
      id: executionId,
      executionId,
      correlationId,
      request,
      steps,
      status: "completed",
      currentStepName: undefined,
      resultId,
      traceId,
      ...refs,
      startedAt: stamp,
      finishedAt: stamp,
      createdAt: stamp,
      updatedAt: stamp,
      version: "1",
      tags: request.tags,
      structuralNotes: request.structuralNotes,
      customAttributes: request.customAttributes,
    };

    const result: CanonicalExecutionResult = {
      kind: "canonical-execution-result",
      id: resultId,
      executionId,
      status: "completed",
      steps,
      ...refs,
      collectedPayload: input.collectedPayload,
      errors: [],
      warnings: [],
      startedAt: stamp,
      finishedAt: stamp,
      durationMs: durationMs(stamp, stamp) ?? 0,
      enginesInvoked: false,
      orchestrationViaPortsOnly: true,
    };

    const trace: CanonicalExecutionTrace = {
      kind: "canonical-execution-trace",
      id: traceId,
      executionId,
      correlationId,
      steps,
      startedAt: stamp,
      finishedAt: stamp,
      durationMs: durationMs(stamp, stamp) ?? 0,
      status: "completed",
      errors: [],
      warnings: [],
      portsOnly: true,
    };

    persistExecutionState(this.store, context, result, trace);

    return {
      ok: true,
      context,
      executionContext,
      result,
      trace,
      code: "started",
      message: `canonical execution completed structurally — Context via ExecutionContextPort, pipeline via PipelineResolverPort, lifecycle via ExecutionStateMachinePort (${lifecycle.stateMachineId} → ${lifecycle.currentState.status}), event bus via ExecutionEventBusPort (${eventBus.eventBusId}, events not delivered), registry via ExecutionRegistryPort (${registryEntry.executionRegistryId}, no persistence), trace via ExecutionTracePort (${executionTrace.executionTraceId}, no logs/telemetry), capability registry via ExecutionCapabilityRegistryPort (${capabilityRegistry.executionCapabilityRegistryId}, no execution/discovery), dependency registry via ExecutionDependencyRegistryPort (${dependencyRegistry.executionDependencyRegistryId}, no resolution/ordering), policy registry via ExecutionPolicyRegistryPort (${policyRegistry.executionPolicyRegistryId}, no interpretation/evaluation), constraint registry via ExecutionConstraintRegistryPort (${constraintRegistry.executionConstraintRegistryId}, no validation/blocking), requirement registry via ExecutionRequirementRegistryPort (${requirementRegistry.executionRequirementRegistryId}, no validation/preconditions), resource registry via ExecutionResourceRegistryPort (${resourceRegistry.executionResourceRegistryId}, no allocation/reservation/load-balancing), environment registry via ExecutionEnvironmentRegistryPort (${environmentRegistry.executionEnvironmentRegistryId}, no selection/provisioning/activation), message queue via ExecutionQueuePort (${messageQueue.executionMessageQueueId}, no publishing/consumers/workers), worker foundation via ExecutionWorkerPort (${executionWorker.executionWorkerId}, no execution/threads/background jobs), scheduler foundation via ExecutionSchedulerPort (${executionScheduler.executionSchedulerId}, no execution/cron/timers/jobs), observability foundation via ExecutionObservabilityPort (${executionObservability.executionObservabilityId}, no logs/metrics/tracing/transmission), health center foundation via ExecutionHealthCenterPort (${executionHealthCenter.executionHealthCenterId}, no monitoring/health-checks/queries), engines not invoked`,
    };
  }

  async getExecution(input: GetExecutionInput): Promise<GetExecutionResult> {
    if (!input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionId required",
      };
    }

    const context = this.store.getContext(input.executionId);
    if (!context) {
      return {
        ok: false,
        code: "not_found",
        message: "execution context not found",
      };
    }

    const executionContextResult = await this.executionContextPort.getContext({
      contextId: input.executionId,
    });

    return {
      ok: true,
      context,
      executionContext: executionContextResult.context,
      result: this.store.getResultByExecution(input.executionId),
      trace: this.store.getTraceByExecution(input.executionId),
      code: "found",
      message: "execution retrieved",
    };
  }

  async listExecutions(input: ListExecutionsInput = {}): Promise<ListExecutionsResult> {
    const all = this.store.listContexts();
    const executions = filterContexts(all, input.status, input.limit);
    return {
      ok: true,
      executions,
      total: executions.length,
      code: "listed",
      message: "executions listed",
    };
  }
}
