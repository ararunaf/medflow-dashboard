/**
 * CanonicalExecutionOrchestratorFactory — instancia o adapter correto (EPC-24).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Posição na arquitetura:
 *   Application → CanonicalExecutionOrchestratorPort → Adapter ← Store ← Factory ← Provider
 *
 * Sprint 02: injeta PipelineResolverPort para composição dinâmica.
 * Sprint 03: injeta ExecutionContextPort para transporte canônico.
 * Sprint 04: injeta ExecutionStateMachinePort para ciclo de vida estrutural.
 * Sprint 05: injeta ExecutionEventBusPort para barramento estrutural.
 * Sprint 06: injeta ExecutionRegistryPort para catálogo estrutural.
 * Sprint 07: injeta ExecutionTracePort para rastreamento estrutural.
 * Sprint 08: injeta ExecutionCapabilityRegistryPort para catálogo estrutural de capacidades.
 * Sprint 09: injeta ExecutionDependencyRegistryPort para registro estrutural de dependências.
 * Sprint 10: injeta ExecutionPolicyRegistryPort para registro estrutural de políticas.
 * Sprint 11: injeta ExecutionConstraintRegistryPort para registro estrutural de restrições.
 * Sprint 12: injeta ExecutionRequirementRegistryPort para registro estrutural de requisitos.
 * Sprint 13: injeta ExecutionResourceRegistryPort para registro estrutural de recursos.
 * Sprint 14: injeta ExecutionEnvironmentRegistryPort para registro estrutural de ambientes.
 * INF-01: injeta ExecutionQueuePort para infraestrutura estrutural de filas.
 */
import type { ExecutionCapabilityRegistryPort } from "../../execution-capability-registry/ports/execution-capability-registry-port";
import type { ExecutionConstraintRegistryPort } from "../../execution-constraint-registry/ports/execution-constraint-registry-port";
import type { ExecutionContextPort } from "../../execution-context/ports/execution-context-port";
import type { ExecutionDependencyRegistryPort } from "../../execution-dependency-registry/ports/execution-dependency-registry-port";
import type { ExecutionEnvironmentRegistryPort } from "../../execution-environment-registry/ports/execution-environment-registry-port";
import type { ExecutionQueuePort } from "../../message-queue/ports/execution-queue-port";
import type { ExecutionEventBusPort } from "../../execution-event-bus/ports/execution-event-bus-port";
import type { ExecutionPolicyRegistryPort } from "../../execution-policy-registry/ports/execution-policy-registry-port";
import type { ExecutionRegistryPort } from "../../execution-registry/ports/execution-registry-port";
import type { ExecutionRequirementRegistryPort } from "../../execution-requirement-registry/ports/execution-requirement-registry-port";
import type { ExecutionResourceRegistryPort } from "../../execution-resource-registry/ports/execution-resource-registry-port";
import type { ExecutionStateMachinePort } from "../../execution-state-machine/ports/execution-state-machine-port";
import type { ExecutionTracePort } from "../../execution-trace/ports/execution-trace-port";
import type { PipelineResolverPort } from "../../pipeline-resolver/ports/pipeline-resolver-port";
import {
  DefaultCanonicalExecutionOrchestratorAdapter,
  MockCanonicalExecutionOrchestratorAdapter,
} from "../adapters";
import type { CanonicalExecutionOrchestratorPort } from "../ports/canonical-execution-orchestrator-port";
import type {
  CanonicalExecutionOrchestratorProviderId,
  CanonicalExecutionOrchestratorProviderOptions,
  FoundationPortRegistry,
} from "../ports/types";
import type { CanonicalExecutionOrchestratorStore } from "../store";

export type CanonicalExecutionOrchestratorFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: CanonicalExecutionOrchestratorProviderId;
  /** Store compartilhado opcional. */
  store?: CanonicalExecutionOrchestratorStore;
  /** Pipeline Resolver — única fonte da composição (EPC-24 Sprint 02). */
  pipelineResolver?: PipelineResolverPort;
  /** Execution Context — único objeto compartilhado (EPC-24 Sprint 03). */
  executionContext?: ExecutionContextPort;
  /** Execution State Machine — ciclo de vida estrutural (EPC-24 Sprint 04). */
  executionStateMachine?: ExecutionStateMachinePort;
  /** Execution Event Bus — barramento estrutural (EPC-24 Sprint 05). */
  executionEventBus?: ExecutionEventBusPort;
  /** Execution Registry — catálogo estrutural (EPC-24 Sprint 06). */
  executionRegistry?: ExecutionRegistryPort;
  /** Execution Trace — rastreamento estrutural (EPC-24 Sprint 07). */
  executionTrace?: ExecutionTracePort;
  /** Execution Capability Registry — catálogo estrutural de capacidades (EPC-24 Sprint 08). */
  executionCapabilityRegistry?: ExecutionCapabilityRegistryPort;
  /** Execution Dependency Registry — registro estrutural de dependências (EPC-24 Sprint 09). */
  executionDependencyRegistry?: ExecutionDependencyRegistryPort;
  /** Execution Policy Registry — registro estrutural de políticas (EPC-24 Sprint 10). */
  executionPolicyRegistry?: ExecutionPolicyRegistryPort;
  /** Execution Constraint Registry — registro estrutural de restrições (EPC-24 Sprint 11). */
  executionConstraintRegistry?: ExecutionConstraintRegistryPort;
  /** Execution Requirement Registry — registro estrutural de requisitos (EPC-24 Sprint 12). */
  executionRequirementRegistry?: ExecutionRequirementRegistryPort;
  /** Execution Resource Registry — registro estrutural de recursos (EPC-24 Sprint 13). */
  executionResourceRegistry?: ExecutionResourceRegistryPort;
  /** Execution Environment Registry — registro estrutural de ambientes (EPC-24 Sprint 14). */
  executionEnvironmentRegistry?: ExecutionEnvironmentRegistryPort;
  /** Message Queue — infraestrutura estrutural de filas (INF-01). */
  executionQueue?: ExecutionQueuePort;
  /** Registry opcional de Ports Foundation (DI estrutural legado — sem invocação). */
  foundationPorts?: FoundationPortRegistry;
};

/**
 * Factory responsável por materializar o CanonicalExecutionOrchestratorPort pedido.
 */
export class CanonicalExecutionOrchestratorFactory {
  private readonly defaultProvider: CanonicalExecutionOrchestratorProviderId;
  private readonly store?: CanonicalExecutionOrchestratorStore;
  private readonly pipelineResolver?: PipelineResolverPort;
  private readonly executionContext?: ExecutionContextPort;
  private readonly executionStateMachine?: ExecutionStateMachinePort;
  private readonly executionEventBus?: ExecutionEventBusPort;
  private readonly executionRegistry?: ExecutionRegistryPort;
  private readonly executionTrace?: ExecutionTracePort;
  private readonly executionCapabilityRegistry?: ExecutionCapabilityRegistryPort;
  private readonly executionDependencyRegistry?: ExecutionDependencyRegistryPort;
  private readonly executionPolicyRegistry?: ExecutionPolicyRegistryPort;
  private readonly executionConstraintRegistry?: ExecutionConstraintRegistryPort;
  private readonly executionRequirementRegistry?: ExecutionRequirementRegistryPort;
  private readonly executionResourceRegistry?: ExecutionResourceRegistryPort;
  private readonly executionEnvironmentRegistry?: ExecutionEnvironmentRegistryPort;
  private readonly executionQueue?: ExecutionQueuePort;
  private readonly foundationPorts?: FoundationPortRegistry;

  constructor(options: CanonicalExecutionOrchestratorFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.pipelineResolver = options.pipelineResolver;
    this.executionContext = options.executionContext;
    this.executionStateMachine = options.executionStateMachine;
    this.executionEventBus = options.executionEventBus;
    this.executionRegistry = options.executionRegistry;
    this.executionTrace = options.executionTrace;
    this.executionCapabilityRegistry = options.executionCapabilityRegistry;
    this.executionDependencyRegistry = options.executionDependencyRegistry;
    this.executionPolicyRegistry = options.executionPolicyRegistry;
    this.executionConstraintRegistry = options.executionConstraintRegistry;
    this.executionRequirementRegistry = options.executionRequirementRegistry;
    this.executionResourceRegistry = options.executionResourceRegistry;
    this.executionEnvironmentRegistry = options.executionEnvironmentRegistry;
    this.executionQueue = options.executionQueue;
    this.foundationPorts = options.foundationPorts;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(
    options: CanonicalExecutionOrchestratorProviderOptions = {},
  ): CanonicalExecutionOrchestratorPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: CanonicalExecutionOrchestratorProviderId,
  ): CanonicalExecutionOrchestratorPort {
    switch (provider) {
      case "default":
        return new DefaultCanonicalExecutionOrchestratorAdapter({
          store: this.store,
          pipelineResolver: this.pipelineResolver,
          executionContext: this.executionContext,
          executionStateMachine: this.executionStateMachine,
          executionEventBus: this.executionEventBus,
          executionRegistry: this.executionRegistry,
          executionTrace: this.executionTrace,
          executionCapabilityRegistry: this.executionCapabilityRegistry,
          executionDependencyRegistry: this.executionDependencyRegistry,
          executionPolicyRegistry: this.executionPolicyRegistry,
          executionConstraintRegistry: this.executionConstraintRegistry,
          executionRequirementRegistry: this.executionRequirementRegistry,
          executionResourceRegistry: this.executionResourceRegistry,
          executionEnvironmentRegistry: this.executionEnvironmentRegistry,
          executionQueue: this.executionQueue,
          foundationPorts: this.foundationPorts,
        });
      case "mock":
        return new MockCanonicalExecutionOrchestratorAdapter({
          provider: "mock",
          store: this.store,
          pipelineResolver: this.pipelineResolver,
          executionContext: this.executionContext,
          executionStateMachine: this.executionStateMachine,
          executionEventBus: this.executionEventBus,
          executionRegistry: this.executionRegistry,
          executionTrace: this.executionTrace,
          executionCapabilityRegistry: this.executionCapabilityRegistry,
          executionDependencyRegistry: this.executionDependencyRegistry,
          executionPolicyRegistry: this.executionPolicyRegistry,
          executionConstraintRegistry: this.executionConstraintRegistry,
          executionRequirementRegistry: this.executionRequirementRegistry,
          executionResourceRegistry: this.executionResourceRegistry,
          executionEnvironmentRegistry: this.executionEnvironmentRegistry,
          executionQueue: this.executionQueue,
          foundationPorts: this.foundationPorts,
        });
      case "test":
        return new MockCanonicalExecutionOrchestratorAdapter({
          provider: "test",
          store: this.store,
          pipelineResolver: this.pipelineResolver,
          executionContext: this.executionContext,
          executionStateMachine: this.executionStateMachine,
          executionEventBus: this.executionEventBus,
          executionRegistry: this.executionRegistry,
          executionTrace: this.executionTrace,
          executionCapabilityRegistry: this.executionCapabilityRegistry,
          executionDependencyRegistry: this.executionDependencyRegistry,
          executionPolicyRegistry: this.executionPolicyRegistry,
          executionConstraintRegistry: this.executionConstraintRegistry,
          executionRequirementRegistry: this.executionRequirementRegistry,
          executionResourceRegistry: this.executionResourceRegistry,
          executionEnvironmentRegistry: this.executionEnvironmentRegistry,
          executionQueue: this.executionQueue,
          foundationPorts: this.foundationPorts,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de canonical-execution-orchestrator desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

/** Factory default da fundação. */
export function createCanonicalExecutionOrchestratorFactory(
  options: CanonicalExecutionOrchestratorFactoryOptions = {},
): CanonicalExecutionOrchestratorFactory {
  return new CanonicalExecutionOrchestratorFactory(options);
}
