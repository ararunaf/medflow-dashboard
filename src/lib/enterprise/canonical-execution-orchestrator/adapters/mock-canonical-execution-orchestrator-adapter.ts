/**
 * MockCanonicalExecutionOrchestratorAdapter — EPC-24.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
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
  CanonicalExecutionOrchestratorProviderId,
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
  registerSchedulerForContext,
  registerWorkerForContext,
  resolvePipelineComposition,
  runStructuralPipeline,
  stepsFromPipelineResolution,
  transitionExecutionState,
} from "./orchestrator-helpers";

export const MOCK_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID = "mock-in-memory";
export const MOCK_CANONICAL_EXECUTION_ORCHESTRATOR_VERSION = "1.0.0";

export type MockCanonicalExecutionOrchestratorAdapterOptions = {
  provider?: Extract<CanonicalExecutionOrchestratorProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: CanonicalExecutionOrchestratorStore;
  pipelineResolver?: PipelineResolverPort;
  executionContext?: ExecutionContextPort;
  executionStateMachine?: ExecutionStateMachinePort;
  executionEventBus?: ExecutionEventBusPort;
  executionRegistry?: ExecutionRegistryPort;
  executionTrace?: ExecutionTracePort;
  executionCapabilityRegistry?: ExecutionCapabilityRegistryPort;
  executionDependencyRegistry?: ExecutionDependencyRegistryPort;
  executionPolicyRegistry?: ExecutionPolicyRegistryPort;
  executionConstraintRegistry?: ExecutionConstraintRegistryPort;
  executionRequirementRegistry?: ExecutionRequirementRegistryPort;
  executionResourceRegistry?: ExecutionResourceRegistryPort;
  executionEnvironmentRegistry?: ExecutionEnvironmentRegistryPort;
  executionQueue?: ExecutionQueuePort;
  executionWorker?: ExecutionWorkerPort;
  executionScheduler?: ExecutionSchedulerPort;
  executionObservability?: ExecutionObservabilityPort;
  foundationPorts?: FoundationPortRegistry;
  createExecutionId?: () => string;
  createStepId?: () => string;
  createResultId?: () => string;
  createTraceId?: () => string;
  createCorrelationId?: () => string;
  now?: () => string;
};

export class MockCanonicalExecutionOrchestratorAdapter implements CanonicalExecutionOrchestratorPort {
  readonly providerId: Extract<CanonicalExecutionOrchestratorProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
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
  private readonly foundationPorts?: FoundationPortRegistry;
  private readonly createExecutionId: () => string;
  private readonly createStepId: () => string;
  private readonly createResultId: () => string;
  private readonly createTraceId: () => string;
  private readonly createCorrelationId: () => string;
  private readonly now?: () => string;

  constructor(options: MockCanonicalExecutionOrchestratorAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} canonical-execution-orchestrator ready.`;
    this.store = options.store ?? new DefaultCanonicalExecutionOrchestratorStore();
    this.pipelineResolver =
      options.pipelineResolver ?? createPipelineResolverPort({ provider: "mock" });
    this.executionContextPort =
      options.executionContext ?? createExecutionContextPort({ provider: "mock" });
    this.executionStateMachinePort =
      options.executionStateMachine ?? createExecutionStateMachinePort({ provider: "mock" });
    this.executionEventBusPort =
      options.executionEventBus ?? createExecutionEventBusPort({ provider: "mock" });
    this.executionRegistryPort =
      options.executionRegistry ?? createExecutionRegistryPort({ provider: "mock" });
    this.executionTracePort =
      options.executionTrace ?? createExecutionTracePort({ provider: "mock" });
    this.executionCapabilityRegistryPort =
      options.executionCapabilityRegistry ??
      createExecutionCapabilityRegistryPort({ provider: "mock" });
    this.executionDependencyRegistryPort =
      options.executionDependencyRegistry ??
      createExecutionDependencyRegistryPort({ provider: "mock" });
    this.executionPolicyRegistryPort =
      options.executionPolicyRegistry ?? createExecutionPolicyRegistryPort({ provider: "mock" });
    this.executionConstraintRegistryPort =
      options.executionConstraintRegistry ??
      createExecutionConstraintRegistryPort({ provider: "mock" });
    this.executionRequirementRegistryPort =
      options.executionRequirementRegistry ??
      createExecutionRequirementRegistryPort({ provider: "mock" });
    this.executionResourceRegistryPort =
      options.executionResourceRegistry ??
      createExecutionResourceRegistryPort({ provider: "mock" });
    this.executionEnvironmentRegistryPort =
      options.executionEnvironmentRegistry ??
      createExecutionEnvironmentRegistryPort({ provider: "mock" });
    this.executionQueuePort =
      options.executionQueue ?? createExecutionQueuePort({ provider: "mock" });
    this.executionWorkerPort =
      options.executionWorker ?? createExecutionWorkerPort({ provider: "mock" });
    this.executionSchedulerPort =
      options.executionScheduler ?? createExecutionSchedulerPort({ provider: "mock" });
    this.executionObservabilityPort =
      options.executionObservability ?? createExecutionObservabilityPort({ provider: "mock" });
    this.foundationPorts = options.foundationPorts;
    this.createExecutionId = options.createExecutionId ?? createExecutionId;
    this.createStepId = options.createStepId ?? createStepId;
    this.createResultId = options.createResultId ?? createResultId;
    this.createTraceId = options.createTraceId ?? createTraceId;
    this.createCorrelationId = options.createCorrelationId ?? createCorrelationId;
    this.now = options.now;
  }

  getStore(): CanonicalExecutionOrchestratorStore {
    return this.store;
  }

  getPipelineResolver(): PipelineResolverPort {
    return this.pipelineResolver;
  }

  getExecutionContextPort(): ExecutionContextPort {
    return this.executionContextPort;
  }

  getExecutionStateMachinePort(): ExecutionStateMachinePort {
    return this.executionStateMachinePort;
  }

  getExecutionEventBusPort(): ExecutionEventBusPort {
    return this.executionEventBusPort;
  }

  getExecutionRegistryPort(): ExecutionRegistryPort {
    return this.executionRegistryPort;
  }

  getExecutionTracePort(): ExecutionTracePort {
    return this.executionTracePort;
  }

  getExecutionCapabilityRegistryPort(): ExecutionCapabilityRegistryPort {
    return this.executionCapabilityRegistryPort;
  }

  getExecutionDependencyRegistryPort(): ExecutionDependencyRegistryPort {
    return this.executionDependencyRegistryPort;
  }

  getExecutionPolicyRegistryPort(): ExecutionPolicyRegistryPort {
    return this.executionPolicyRegistryPort;
  }

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

  getFoundationPorts(): FoundationPortRegistry | undefined {
    return this.foundationPorts;
  }

  capabilities(): CanonicalExecutionOrchestratorCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<CanonicalExecutionOrchestratorHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      foundationPortRefCount: ORCHESTRATED_FOUNDATION_PORTS.length,
      storedContextCount: this.store.contextCount(),
      storedResultCount: this.store.resultCount(),
      storedTraceCount: this.store.traceCount(),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private unhealthy<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async startExecution(input: StartExecutionInput = {}): Promise<StartExecutionResult> {
    if (!this.healthy) return this.unhealthy<StartExecutionResult>();

    const stamp = this.stamp();
    const executionId = this.createExecutionId();
    const resultId = this.createResultId();
    const traceId = this.createTraceId();
    const correlationId =
      input.correlationId ?? input.request?.correlationId ?? this.createCorrelationId();

    const request = buildRequest(input, correlationId);

    await createExecutionContextFromRequest(this.executionContextPort, request, executionId);
    const pipelineResolution = await resolvePipelineComposition(this.pipelineResolver, request);

    let lifecycle = await createExecutionStateMachineForContext(
      this.executionStateMachinePort,
      executionId,
      correlationId,
    );
    await attachStateMachineToExecutionContext(
      this.executionContextPort,
      executionId,
      lifecycle,
      stamp,
    );

    const eventBus = await createExecutionEventBusForContext(
      this.executionEventBusPort,
      executionId,
      correlationId,
    );
    await attachEventBusToExecutionContext(this.executionContextPort, executionId, eventBus, stamp);

    const registryEntry = await registerExecutionInRegistry(this.executionRegistryPort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      pipelineId: pipelineResolution.pipelineId,
    });
    await attachRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      registryEntry,
      stamp,
    );

    const executionTrace = await createExecutionTraceForContext(this.executionTracePort, {
      executionId,
      correlationId,
      contextId: executionId,
      stateMachineId: lifecycle.stateMachineId,
      eventBusId: eventBus.eventBusId,
      executionRegistryId: registryEntry.executionRegistryId,
      pipelineId: pipelineResolution.pipelineId,
    });
    await attachTraceToExecutionContext(
      this.executionContextPort,
      executionId,
      executionTrace,
      stamp,
    );

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
    await attachCapabilityRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      capabilityRegistry,
      stamp,
    );

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
    await attachDependencyRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      dependencyRegistry,
      stamp,
    );

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
    await attachPolicyRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      policyRegistry,
      stamp,
    );

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
    await attachConstraintRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      constraintRegistry,
      stamp,
    );

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
    await attachRequirementRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      requirementRegistry,
      stamp,
    );

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
    await attachResourceRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      resourceRegistry,
      stamp,
    );

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
    await attachEnvironmentRegistryToExecutionContext(
      this.executionContextPort,
      executionId,
      environmentRegistry,
      stamp,
    );

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
    await attachMessageQueueToExecutionContext(
      this.executionContextPort,
      executionId,
      messageQueue,
      stamp,
    );

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
    await attachWorkerToExecutionContext(
      this.executionContextPort,
      executionId,
      executionWorker,
      stamp,
    );

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
    await attachSchedulerToExecutionContext(
      this.executionContextPort,
      executionId,
      executionScheduler,
      stamp,
    );

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
    await attachObservabilityToExecutionContext(
      this.executionContextPort,
      executionId,
      executionObservability,
      stamp,
    );

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

    const pending = stepsFromPipelineResolution(pipelineResolution, this.createStepId);
    const { steps, refs } = runStructuralPipeline(pending, request, stamp);

    lifecycle = await transitionExecutionState(
      this.executionStateMachinePort,
      lifecycle.stateMachineId,
      "Completed",
      "structural-finalize",
    );

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
      message: `canonical execution completed structurally — Context via ExecutionContextPort, pipeline via PipelineResolverPort, lifecycle via ExecutionStateMachinePort (${lifecycle.stateMachineId} → ${lifecycle.currentState.status}), event bus via ExecutionEventBusPort (${eventBus.eventBusId}, events not delivered), registry via ExecutionRegistryPort (${registryEntry.executionRegistryId}, no persistence), trace via ExecutionTracePort (${executionTrace.executionTraceId}, no logs/telemetry), capability registry via ExecutionCapabilityRegistryPort (${capabilityRegistry.executionCapabilityRegistryId}, no execution/discovery), dependency registry via ExecutionDependencyRegistryPort (${dependencyRegistry.executionDependencyRegistryId}, no resolution/ordering), policy registry via ExecutionPolicyRegistryPort (${policyRegistry.executionPolicyRegistryId}, no interpretation/evaluation), constraint registry via ExecutionConstraintRegistryPort (${constraintRegistry.executionConstraintRegistryId}, no validation/blocking), requirement registry via ExecutionRequirementRegistryPort (${requirementRegistry.executionRequirementRegistryId}, no validation/preconditions), resource registry via ExecutionResourceRegistryPort (${resourceRegistry.executionResourceRegistryId}, no allocation/reservation/load-balancing), environment registry via ExecutionEnvironmentRegistryPort (${environmentRegistry.executionEnvironmentRegistryId}, no selection/provisioning/activation), message queue via ExecutionQueuePort (${messageQueue.executionMessageQueueId}, no publishing/consumers/workers), worker foundation via ExecutionWorkerPort (${executionWorker.executionWorkerId}, no execution/threads/background jobs), scheduler foundation via ExecutionSchedulerPort (${executionScheduler.executionSchedulerId}, no execution/cron/timers/jobs), observability foundation via ExecutionObservabilityPort (${executionObservability.executionObservabilityId}, no logs/metrics/tracing/transmission), engines not invoked`,
    };
  }

  async getExecution(input: GetExecutionInput): Promise<GetExecutionResult> {
    if (!this.healthy) return this.unhealthy<GetExecutionResult>();

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
    if (!this.healthy) {
      return this.unhealthy<ListExecutionsResult>({ executions: [], total: 0 });
    }

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
