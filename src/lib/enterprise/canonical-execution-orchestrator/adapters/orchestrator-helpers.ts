/**
 * Helpers internos de orquestração estrutural (EPC-24).
 *
 * Sprint 02: composição do pipeline obtida exclusivamente via PipelineResolverPort.
 * Sprint 03: cria e enriquece exclusivamente via ExecutionContextPort.
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
 * Somente orquestração de estado in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem entrega de eventos. Sem filas reais. Sem Pub/Sub. Sem workers.
 * Sem persistência real. Sem banco. Sem logs. Sem telemetria.
 * Sem descoberta automática. Sem carregamento dinâmico. Sem execução de capacidades.
 * Sem resolução de dependências. Sem ordenação. Sem DAG.
 * Sem interpretação de políticas. Sem Rule Engine. Sem Decision Engine.
 * Sem validação de restrições. Sem bloqueio de execução.
 * Sem validação de requisitos. Sem verificação de pré-condições.
 * Sem alocação de recursos. Sem reserva. Sem balanceamento de carga.
 */
import { createStageId as createExecutionContextStageId } from "../../execution-context/ports/identity";
import type { ExecutionContextPort } from "../../execution-context/ports/execution-context-port";
import type {
  ExecutionContext,
  ExecutionContextPipelineAttachment,
  ExecutionContextStage,
} from "../../execution-context/ports/models";
import type { ExecutionCapabilityRegistryPort } from "../../execution-capability-registry/ports/execution-capability-registry-port";
import type { ExecutionCapabilityRegistry } from "../../execution-capability-registry/ports/models";
import type { ExecutionConstraintRegistryPort } from "../../execution-constraint-registry/ports/execution-constraint-registry-port";
import type { ExecutionConstraintRegistry } from "../../execution-constraint-registry/ports/models";
import type { ExecutionDependencyRegistryPort } from "../../execution-dependency-registry/ports/execution-dependency-registry-port";
import type { ExecutionDependencyRegistry } from "../../execution-dependency-registry/ports/models";
import type { ExecutionPolicyRegistryPort } from "../../execution-policy-registry/ports/execution-policy-registry-port";
import type { ExecutionPolicyRegistry } from "../../execution-policy-registry/ports/models";
import type { ExecutionRequirementRegistryPort } from "../../execution-requirement-registry/ports/execution-requirement-registry-port";
import type { ExecutionRequirementRegistry } from "../../execution-requirement-registry/ports/models";
import type { ExecutionEnvironmentRegistryPort } from "../../execution-environment-registry/ports/execution-environment-registry-port";
import type { ExecutionEnvironmentRegistry } from "../../execution-environment-registry/ports/models";
import type { ExecutionQueuePort } from "../../message-queue/ports/execution-queue-port";
import type { CanonicalQueue } from "../../message-queue/ports/models";
import type { ExecutionResourceRegistryPort } from "../../execution-resource-registry/ports/execution-resource-registry-port";
import type { ExecutionResourceRegistry } from "../../execution-resource-registry/ports/models";
import type { ExecutionEventBusPort } from "../../execution-event-bus/ports/execution-event-bus-port";
import type { ExecutionEventBus } from "../../execution-event-bus/ports/models";
import type { ExecutionRegistryPort } from "../../execution-registry/ports/execution-registry-port";
import type { ExecutionRegistryEntry } from "../../execution-registry/ports/models";
import type { ExecutionStateMachinePort } from "../../execution-state-machine/ports/execution-state-machine-port";
import type {
  ExecutionLifecycle,
  ExecutionStatus,
} from "../../execution-state-machine/ports/models";
import type { ExecutionTracePort } from "../../execution-trace/ports/execution-trace-port";
import type { ExecutionTrace } from "../../execution-trace/ports/models";
import type { PipelineResolutionResult } from "../../pipeline-resolver/ports/models";
import type { PipelineResolverPort } from "../../pipeline-resolver/ports/pipeline-resolver-port";
import { ORCHESTRATED_FOUNDATION_PORTS } from "../ports/foundation-ports";
import type {
  CanonicalExecutionContext,
  CanonicalExecutionRequest,
  CanonicalExecutionResult,
  CanonicalExecutionStatus,
  CanonicalExecutionStep,
  CanonicalExecutionStepName,
  CanonicalExecutionTrace,
} from "../ports/models";
import type { StartExecutionInput } from "../ports/types";
import type { CanonicalExecutionOrchestratorStore } from "../store";

export function durationMs(startedAt?: string, finishedAt?: string): number | undefined {
  if (!startedAt || !finishedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return Math.max(0, end - start);
}

export function buildRequest(
  input: StartExecutionInput | undefined,
  correlationId: string,
): CanonicalExecutionRequest {
  const base = input?.request;
  return {
    kind: "canonical-execution-request",
    correlationId: input?.correlationId ?? base?.correlationId ?? correlationId,
    tenantRef: input?.tenantRef ?? base?.tenantRef,
    channel: input?.channel ?? base?.channel,
    tags: input?.tags ?? base?.tags,
    intakeRef: input?.intakeRef ?? base?.intakeRef,
    documentRef: input?.documentRef ?? base?.documentRef,
    customAttributes: input?.customAttributes ?? base?.customAttributes,
    structuralNotes: input?.structuralNotes ?? base?.structuralNotes,
  };
}

/**
 * Solicita ao Pipeline Resolver a composição completa do pipeline.
 * O Orchestrator NÃO conhece a sequência dos módulos — apenas consome o resultado.
 */
export async function resolvePipelineComposition(
  pipelineResolver: PipelineResolverPort,
  request: CanonicalExecutionRequest,
): Promise<PipelineResolutionResult> {
  const resolved = await pipelineResolver.resolvePipeline({
    correlationId: request.correlationId,
    tenantRef: request.tenantRef,
    channel: request.channel,
    tags: request.tags,
    structuralNotes: request.structuralNotes,
  });

  if (!resolved.ok || !resolved.result) {
    throw new Error(
      resolved.message ?? "Pipeline Resolver failed to resolve canonical pipeline composition",
    );
  }

  return resolved.result;
}

/**
 * Materializa steps canônicos a partir do resultado estrutural do Pipeline Resolver.
 * Nenhuma etapa é executada — apenas projeção estrutural.
 */
export function stepsFromPipelineResolution(
  resolution: PipelineResolutionResult,
  createId: () => string,
): CanonicalExecutionStep[] {
  return resolution.orderedNodes.map((node) => ({
    kind: "canonical-execution-step" as const,
    id: createId(),
    name: node.stageName as CanonicalExecutionStepName,
    order: node.order,
    status: "pending" as const,
    portRef: node.portRef,
    portContract: node.portContract,
  }));
}

/**
 * Percorre estruturalmente todos os steps, marcando-os completed
 * com artifactRef opaco derivado do Port — sem invocar Engines.
 */
export function runStructuralPipeline(
  pendingSteps: readonly CanonicalExecutionStep[],
  request: CanonicalExecutionRequest,
  stamp: string,
): {
  steps: CanonicalExecutionStep[];
  refs: {
    intakeRef: string;
    documentRef: string;
    processingRef: string;
    ocrRef: string;
    mappingRef: string;
    vocabularyRef: string;
    profileRef: string;
    healthcareModelRef: string;
    bindingRef: string;
    runtimeRef: string;
    auditorRef: string;
  };
} {
  const intakeRef = request.intakeRef ?? `structural-intake-ref:${request.correlationId ?? "anon"}`;
  const documentRef = request.documentRef ?? `structural-document-ref:${intakeRef}`;
  const processingRef = `structural-processing-ref:${documentRef}`;
  const ocrRef = `structural-ocr-ref:${processingRef}`;
  const mappingRef = `structural-mapping-ref:${ocrRef}`;
  const vocabularyRef = `structural-vocabulary-ref:${mappingRef}`;
  const profileRef = `structural-profile-ref:${vocabularyRef}`;
  const healthcareModelRef = `structural-healthcare-model-ref:${profileRef}`;
  const bindingRef = `structural-binding-ref:${healthcareModelRef}`;
  const runtimeRef = `structural-runtime-ref:${bindingRef}`;
  const auditorRef = `structural-auditor-ref:${runtimeRef}`;

  const artifactByStep: Record<CanonicalExecutionStepName, string> = {
    "document-intake": intakeRef,
    "document-processing": documentRef,
    "processing-provider": processingRef,
    "ocr-provider": ocrRef,
    "tiss-mapping": mappingRef,
    "tiss-vocabulary": vocabularyRef,
    "tiss-profile": profileRef,
    "healthcare-model": healthcareModelRef,
    "contract-rule-binding": bindingRef,
    "tiss-rule-runtime": runtimeRef,
    "ai-auditor": auditorRef,
  };

  const noteByStep: Record<CanonicalExecutionStepName, string> = {
    "document-intake": "DocumentIntakePort referenced structurally — no intake created",
    "document-processing": "DocumentProcessorPort referenced structurally — no processing executed",
    "processing-provider":
      "ProcessingProviderPort referenced structurally — no provider dispatched",
    "ocr-provider": "OCRProviderPort referenced structurally — no OCR executed",
    "tiss-mapping": "TISSMappingPort referenced structurally — no mapping executed",
    "tiss-vocabulary": "TISSVocabularyPort referenced structurally — no vocabulary lookup",
    "tiss-profile": "TISSProfilePort referenced structurally — no profile validation",
    "healthcare-model": "HealthcareModelPort referenced structurally — no model assembled",
    "contract-rule-binding":
      "ContractRuleBindingPort referenced structurally — no contract interpretation",
    "tiss-rule-runtime": "TISSRuleRuntimePort referenced structurally — no rules executed",
    "ai-auditor": "AIAuditorPort referenced structurally — no AI invoked",
  };

  const steps = pendingSteps.map((step) => ({
    ...step,
    status: "completed" as const,
    startedAt: stamp,
    finishedAt: stamp,
    durationMs: 0,
    artifactRef: artifactByStep[step.name],
    notes: `${noteByStep[step.name]} (resolved via PipelineResolverPort)`,
  }));

  return {
    steps,
    refs: {
      intakeRef,
      documentRef,
      processingRef,
      ocrRef,
      mappingRef,
      vocabularyRef,
      profileRef,
      healthcareModelRef,
      bindingRef,
      runtimeRef,
      auditorRef,
    },
  };
}

export function persistExecutionState(
  store: CanonicalExecutionOrchestratorStore,
  context: CanonicalExecutionContext,
  result: CanonicalExecutionResult,
  trace: CanonicalExecutionTrace,
): void {
  store.setContext(context);
  store.setResult(result);
  store.setTrace(trace);
}

/**
 * Cria o Execution Context canônico a partir do pedido estrutural.
 * O Resolver NÃO recebe o conteúdo do Context — apenas campos canônicos de ResolvePipelineInput.
 */
export async function createExecutionContextFromRequest(
  executionContextPort: ExecutionContextPort,
  request: CanonicalExecutionRequest,
  contextId: string,
): Promise<ExecutionContext> {
  const created = await executionContextPort.createContext({
    contextId,
    correlationId: request.correlationId,
    tenantRef: request.tenantRef,
    channel: request.channel,
    tags: request.tags,
    structuralNotes: request.structuralNotes,
    customAttributes: request.customAttributes,
    references: [
      ...(request.intakeRef
        ? [{ name: "intakeRef", value: request.intakeRef, stageName: "document-intake" }]
        : []),
      ...(request.documentRef
        ? [{ name: "documentRef", value: request.documentRef, stageName: "document-processing" }]
        : []),
    ],
  });

  if (!created.ok || !created.context) {
    throw new Error(created.message ?? "ExecutionContextPort failed to create context");
  }

  return created.context;
}

/**
 * Cria a Execution State Machine estrutural para a execução.
 * Ciclo de vida controlado exclusivamente via ExecutionStateMachinePort.
 */
export async function createExecutionStateMachineForContext(
  stateMachinePort: ExecutionStateMachinePort,
  executionId: string,
  correlationId?: string,
  stateMachineId?: string,
): Promise<ExecutionLifecycle> {
  const created = await stateMachinePort.createStateMachine({
    stateMachineId,
    executionId,
    correlationId,
    initialStatus: "Created",
    structuralNotes:
      "Execution State Machine created structurally — lifecycle only, no engines invoked",
  });

  if (!created.ok || !created.lifecycle) {
    throw new Error(created.message ?? "ExecutionStateMachinePort failed to create state machine");
  }

  return created.lifecycle;
}

/**
 * Anexa referência estrutural do estado inicial ao Execution Context (transporte).
 * Toda informação de ciclo de vida permanece na State Machine.
 */
export async function attachStateMachineToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  lifecycle: ExecutionLifecycle,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "stateMachineId",
        value: lifecycle.stateMachineId,
        notes: "Execution State Machine reference — lifecycle obtained exclusively via SM Port",
      },
      {
        name: "executionState",
        value: lifecycle.currentState.status,
        notes: "Initial structural state attached — no business action",
      },
    ],
    appendHistory: [
      {
        event: "state-machine-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution State Machine attached structurally — lifecycle controlled exclusively via ExecutionStateMachinePort",
        attributes: {
          stateMachineId: lifecycle.stateMachineId,
          initialStatus: lifecycle.currentState.status,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        stateMachineId: lifecycle.stateMachineId,
        executionState: lifecycle.currentState.status,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(updated.message ?? "ExecutionContextPort failed to attach state machine");
  }

  return updated.context;
}

/**
 * Aplica transição estrutural de ciclo de vida via ExecutionStateMachinePort.
 * Nenhuma Engine é invocada. Nenhuma ação de negócio ocorre.
 */
export async function transitionExecutionState(
  stateMachinePort: ExecutionStateMachinePort,
  stateMachineId: string,
  to: ExecutionStatus,
  reason?: string,
): Promise<ExecutionLifecycle> {
  const result = await stateMachinePort.transition({
    stateMachineId,
    to,
    reason,
    notes: `Structural lifecycle transition → ${to} — no engines invoked`,
  });

  if (!result.ok || !result.lifecycle) {
    throw new Error(result.message ?? `ExecutionStateMachinePort failed transition to ${to}`);
  }

  return result.lifecycle;
}

/**
 * Cria o Execution Event Bus estrutural para a execução.
 * Barramento controlado exclusivamente via ExecutionEventBusPort.
 * Nenhum evento é publicado nesta sprint.
 */
export async function createExecutionEventBusForContext(
  eventBusPort: ExecutionEventBusPort,
  executionId: string,
  correlationId?: string,
  eventBusId?: string,
): Promise<ExecutionEventBus> {
  const created = await eventBusPort.createEventBus({
    eventBusId,
    executionId,
    correlationId,
    structuralNotes:
      "Execution Event Bus created structurally — no events delivered, no subscribers executed",
  });

  if (!created.ok || !created.bus) {
    throw new Error(created.message ?? "ExecutionEventBusPort failed to create event bus");
  }

  return created.bus;
}

/**
 * Anexa referência estrutural do Event Bus ao Execution Context (transporte).
 * Toda informação de eventos permanece no Event Bus.
 * Nenhum evento é publicado nesta anexação.
 */
export async function attachEventBusToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  bus: ExecutionEventBus,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "eventBusId",
        value: bus.eventBusId,
        notes: "Execution Event Bus reference — events obtained exclusively via Event Bus Port",
      },
    ],
    appendHistory: [
      {
        event: "event-bus-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Event Bus attached structurally — no events published, no subscribers executed",
        attributes: {
          eventBusId: bus.eventBusId,
          eventsDelivered: false,
          subscribersExecuted: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        eventBusId: bus.eventBusId,
        eventsDelivered: false,
        subscribersExecuted: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(updated.message ?? "ExecutionContextPort failed to attach event bus");
  }

  return updated.context;
}

/**
 * Registra estruturalmente a execução no Execution Registry.
 * Catálogo controlado exclusivamente via ExecutionRegistryPort.
 * Nenhuma persistência real. Nenhum banco. Nenhuma Engine.
 */
export async function registerExecutionInRegistry(
  registryPort: ExecutionRegistryPort,
  input: {
    executionId: string;
    correlationId?: string;
    contextId?: string;
    stateMachineId?: string;
    eventBusId?: string;
    pipelineId?: string;
    executionRegistryId?: string;
  },
): Promise<ExecutionRegistryEntry> {
  const registered = await registryPort.registerExecution({
    executionRegistryId: input.executionRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    pipelineId: input.pipelineId,
    structuralNotes:
      "Execution registered structurally — in-memory catalog only, no persistence, no engines",
  });

  if (!registered.ok || !registered.entry) {
    throw new Error(registered.message ?? "ExecutionRegistryPort failed to register execution");
  }

  return registered.entry;
}

/**
 * Anexa referência estrutural do Registry ao Execution Context (transporte).
 * Toda informação de catálogo permanece no Registry.
 * Nenhuma persistência real nesta anexação.
 */
export async function attachRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  entry: ExecutionRegistryEntry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionRegistryId",
        value: entry.executionRegistryId,
        notes:
          "Execution Registry reference — catalog obtained exclusively via ExecutionRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Registry attached structurally — no persistence, no database, no engines invoked",
        attributes: {
          executionRegistryId: entry.executionRegistryId,
          persistenceImplemented: false,
          databaseUsed: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionRegistryId: entry.executionRegistryId,
        persistenceImplemented: false,
        databaseUsed: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(updated.message ?? "ExecutionContextPort failed to attach execution registry");
  }

  return updated.context;
}

/**
 * Cria o Execution Trace estrutural para a execução.
 * Rastreamento controlado exclusivamente via ExecutionTracePort.
 * Nenhum log real. Nenhuma telemetria. Nenhuma persistência.
 */
export async function createExecutionTraceForContext(
  tracePort: ExecutionTracePort,
  input: {
    executionId: string;
    correlationId?: string;
    contextId?: string;
    stateMachineId?: string;
    eventBusId?: string;
    executionRegistryId?: string;
    pipelineId?: string;
    executionTraceId?: string;
  },
): Promise<ExecutionTrace> {
  const created = await tracePort.createTrace({
    executionTraceId: input.executionTraceId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    pipelineId: input.pipelineId,
    structuralNotes:
      "Execution Trace created structurally — no logs, no telemetry, no persistence, no engines",
  });

  if (!created.ok || !created.trace) {
    throw new Error(created.message ?? "ExecutionTracePort failed to create execution trace");
  }

  return created.trace;
}

/**
 * Anexa referência estrutural do Trace ao Execution Context (transporte).
 * Toda informação de rastreamento permanece no Trace.
 * Nenhum log / telemetria nesta anexação.
 */
export async function attachTraceToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  trace: ExecutionTrace,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionTraceId",
        value: trace.executionTraceId,
        notes: "Execution Trace reference — tracking obtained exclusively via ExecutionTracePort",
      },
    ],
    appendHistory: [
      {
        event: "execution-trace-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Trace attached structurally — no logs, no telemetry, no persistence, no engines",
        attributes: {
          executionTraceId: trace.executionTraceId,
          logsImplemented: false,
          telemetryImplemented: false,
          persistenceImplemented: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionTraceId: trace.executionTraceId,
        logsImplemented: false,
        telemetryImplemented: false,
        persistenceImplemented: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(updated.message ?? "ExecutionContextPort failed to attach execution trace");
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Capability Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionCapabilityRegistryPort.
 * Nenhuma descoberta automática. Nenhum carregamento dinâmico. Nenhuma Engine.
 */
export async function registerCapabilityRegistryForContext(
  capabilityRegistryPort: ExecutionCapabilityRegistryPort,
  input: {
    executionId: string;
    correlationId?: string;
    contextId?: string;
    stateMachineId?: string;
    eventBusId?: string;
    executionRegistryId?: string;
    executionTraceId?: string;
    pipelineId?: string;
    executionCapabilityRegistryId?: string;
  },
): Promise<ExecutionCapabilityRegistry> {
  const registered = await capabilityRegistryPort.registerCapability({
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    pipelineId: input.pipelineId,
    key: "structural-platform-capabilities",
    name: "Structural Platform Capabilities",
    category: "structural",
    categoryLabel: "structural",
    descriptorLabel: "Structural Platform Capabilities",
    definitionDescription:
      "Bootstrap structural capability — represents available platform capabilities without execution",
    portRef: "ExecutionCapabilityRegistryPort",
    portContract: "structural-capability-registry",
    structuralNotes:
      "Capability Registry registered structurally — no auto-discovery, no dynamic loading, no engines",
    tags: ["capability-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ??
        "ExecutionCapabilityRegistryPort failed to register capability registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Capability Registry ao Execution Context (transporte).
 * Toda informação de capacidades permanece no Capability Registry.
 * Nenhuma execução de capacidade nesta anexação.
 */
export async function attachCapabilityRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionCapabilityRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionCapabilityRegistryId",
        value: registry.executionCapabilityRegistryId,
        notes:
          "Execution Capability Registry reference — capabilities obtained exclusively via ExecutionCapabilityRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-capability-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Capability Registry attached structurally — no auto-discovery, no dynamic loading, no engines",
        attributes: {
          executionCapabilityRegistryId: registry.executionCapabilityRegistryId,
          autoDiscoveryImplemented: false,
          dynamicLoadingImplemented: false,
          capabilitiesExecuted: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionCapabilityRegistryId: registry.executionCapabilityRegistryId,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution capability registry",
    );
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Dependency Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionDependencyRegistryPort.
 * Nenhuma resolução. Nenhuma ordenação. Nenhum DAG. Nenhuma Engine.
 */
export async function registerDependencyRegistryForContext(
  dependencyRegistryPort: ExecutionDependencyRegistryPort,
  input: {
    executionId: string;
    correlationId?: string;
    contextId?: string;
    stateMachineId?: string;
    eventBusId?: string;
    executionRegistryId?: string;
    executionTraceId?: string;
    executionCapabilityRegistryId?: string;
    pipelineId?: string;
    executionDependencyRegistryId?: string;
  },
): Promise<ExecutionDependencyRegistry> {
  const registered = await dependencyRegistryPort.registerDependency({
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-platform-dependencies",
    name: "Structural Platform Dependencies",
    sourceKey: "structural-platform-capabilities",
    targetKey: "structural-pipeline-composition",
    relation: "depends-on",
    definitionDescription:
      "Bootstrap structural dependency — represents platform dependency relations without resolution",
    portRef: "ExecutionDependencyRegistryPort",
    portContract: "structural-dependency-registry",
    structuralNotes:
      "Dependency Registry registered structurally — no resolution, no ordering, no DAG, no engines",
    tags: ["dependency-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ??
        "ExecutionDependencyRegistryPort failed to register dependency registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Dependency Registry ao Execution Context (transporte).
 * Toda informação de dependências permanece no Dependency Registry.
 * Nenhuma resolução / ordenação nesta anexação.
 */
export async function attachDependencyRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionDependencyRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionDependencyRegistryId",
        value: registry.executionDependencyRegistryId,
        notes:
          "Execution Dependency Registry reference — dependencies obtained exclusively via ExecutionDependencyRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-dependency-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Dependency Registry attached structurally — no resolution, no ordering, no DAG, no engines",
        attributes: {
          executionDependencyRegistryId: registry.executionDependencyRegistryId,
          dependencyResolutionImplemented: false,
          topologicalSortImplemented: false,
          dagSolverImplemented: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionDependencyRegistryId: registry.executionDependencyRegistryId,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution dependency registry",
    );
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Policy Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionPolicyRegistryPort.
 * Nenhuma interpretação. Nenhuma aplicação de regras. Nenhuma Engine.
 */
export async function registerPolicyRegistryForContext(
  policyRegistryPort: ExecutionPolicyRegistryPort,
  input: {
    executionId: string;
    correlationId?: string;
    contextId?: string;
    stateMachineId?: string;
    eventBusId?: string;
    executionRegistryId?: string;
    executionTraceId?: string;
    executionCapabilityRegistryId?: string;
    executionDependencyRegistryId?: string;
    pipelineId?: string;
    executionPolicyRegistryId?: string;
  },
): Promise<ExecutionPolicyRegistry> {
  const registered = await policyRegistryPort.registerPolicy({
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-platform-policies",
    name: "Structural Platform Policies",
    category: "structural",
    scope: "platform",
    definitionDescription:
      "Bootstrap structural policy — represents platform policies without evaluation",
    portRef: "ExecutionPolicyRegistryPort",
    portContract: "structural-policy-registry",
    structuralNotes:
      "Policy Registry registered structurally — no interpretation, no rule engine, no engines",
    tags: ["policy-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ?? "ExecutionPolicyRegistryPort failed to register policy registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Policy Registry ao Execution Context (transporte).
 * Toda informação de políticas permanece no Policy Registry.
 * Nenhuma interpretação / avaliação nesta anexação.
 */
export async function attachPolicyRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionPolicyRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionPolicyRegistryId",
        value: registry.executionPolicyRegistryId,
        notes:
          "Execution Policy Registry reference — policies obtained exclusively via ExecutionPolicyRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-policy-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Policy Registry attached structurally — no interpretation, no rule engine, no engines",
        attributes: {
          executionPolicyRegistryId: registry.executionPolicyRegistryId,
          policyInterpretationImplemented: false,
          ruleEngineInvoked: false,
          policiesEvaluated: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionPolicyRegistryId: registry.executionPolicyRegistryId,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution policy registry",
    );
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Constraint Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionConstraintRegistryPort.
 * Nenhuma validação. Nenhum bloqueio. Nenhuma Engine.
 */
export async function registerConstraintRegistryForContext(
  constraintRegistryPort: ExecutionConstraintRegistryPort,
  input: {
    executionId: string;
    correlationId?: string;
    contextId?: string;
    stateMachineId?: string;
    eventBusId?: string;
    executionRegistryId?: string;
    executionTraceId?: string;
    executionCapabilityRegistryId?: string;
    executionDependencyRegistryId?: string;
    executionPolicyRegistryId?: string;
    pipelineId?: string;
    executionConstraintRegistryId?: string;
  },
): Promise<ExecutionConstraintRegistry> {
  const registered = await constraintRegistryPort.registerConstraint({
    executionConstraintRegistryId: input.executionConstraintRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-platform-constraints",
    name: "Structural Platform Constraints",
    category: "structural",
    scope: "platform",
    definitionDescription:
      "Bootstrap structural constraint — represents platform constraints without validation",
    portRef: "ExecutionConstraintRegistryPort",
    portContract: "structural-constraint-registry",
    structuralNotes:
      "Constraint Registry registered structurally — no validation, no blocking, no engines",
    tags: ["constraint-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ??
        "ExecutionConstraintRegistryPort failed to register constraint registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Constraint Registry ao Execution Context (transporte).
 * Toda informação de restrições permanece no Constraint Registry.
 * Nenhuma validação / bloqueio nesta anexação.
 */
export async function attachConstraintRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionConstraintRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionConstraintRegistryId",
        value: registry.executionConstraintRegistryId,
        notes:
          "Execution Constraint Registry reference — constraints obtained exclusively via ExecutionConstraintRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-constraint-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Constraint Registry attached structurally — no validation, no blocking, no engines",
        attributes: {
          executionConstraintRegistryId: registry.executionConstraintRegistryId,
          constraintValidationImplemented: false,
          constraintsValidated: false,
          executionBlocked: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionConstraintRegistryId: registry.executionConstraintRegistryId,
        constraintValidationImplemented: false,
        constraintsValidated: false,
        executionBlocked: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution constraint registry",
    );
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Requirement Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionRequirementRegistryPort.
 * Nenhuma validação. Nenhuma verificação de pré-condições. Nenhuma Engine.
 */
export async function registerRequirementRegistryForContext(
  requirementRegistryPort: ExecutionRequirementRegistryPort,
  input: {
    executionId: string;
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
    pipelineId?: string;
    executionRequirementRegistryId?: string;
  },
): Promise<ExecutionRequirementRegistry> {
  const registered = await requirementRegistryPort.registerRequirement({
    executionRequirementRegistryId: input.executionRequirementRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    executionConstraintRegistryId: input.executionConstraintRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-platform-requirements",
    name: "Structural Platform Requirements",
    category: "structural",
    scope: "platform",
    definitionDescription:
      "Bootstrap structural requirement — represents platform requirements without validation",
    portRef: "ExecutionRequirementRegistryPort",
    portContract: "structural-requirement-registry",
    structuralNotes:
      "Requirement Registry registered structurally — no validation, no precondition checks, no engines",
    tags: ["requirement-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ??
        "ExecutionRequirementRegistryPort failed to register requirement registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Requirement Registry ao Execution Context (transporte).
 * Toda informação de requisitos permanece no Requirement Registry.
 * Nenhuma validação / verificação de pré-condições nesta anexação.
 */
export async function attachRequirementRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionRequirementRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionRequirementRegistryId",
        value: registry.executionRequirementRegistryId,
        notes:
          "Execution Requirement Registry reference — requirements obtained exclusively via ExecutionRequirementRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-requirement-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Requirement Registry attached structurally — no validation, no precondition checks, no engines",
        attributes: {
          executionRequirementRegistryId: registry.executionRequirementRegistryId,
          requirementValidationImplemented: false,
          requirementsValidated: false,
          preconditionsChecked: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionRequirementRegistryId: registry.executionRequirementRegistryId,
        requirementValidationImplemented: false,
        requirementsValidated: false,
        preconditionsChecked: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution requirement registry",
    );
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Resource Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionResourceRegistryPort.
 * Nenhuma alocação. Nenhuma reserva. Nenhum balanceamento. Nenhuma Engine.
 */
export async function registerResourceRegistryForContext(
  resourceRegistryPort: ExecutionResourceRegistryPort,
  input: {
    executionId: string;
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
    executionResourceRegistryId?: string;
  },
): Promise<ExecutionResourceRegistry> {
  const registered = await resourceRegistryPort.registerResource({
    executionResourceRegistryId: input.executionResourceRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    executionConstraintRegistryId: input.executionConstraintRegistryId,
    executionRequirementRegistryId: input.executionRequirementRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-platform-resources",
    name: "Structural Platform Resources",
    category: "structural",
    scope: "platform",
    definitionDescription:
      "Bootstrap structural resource — represents platform resources without allocation",
    portRef: "ExecutionResourceRegistryPort",
    portContract: "structural-resource-registry",
    structuralNotes:
      "Resource Registry registered structurally — no allocation, no reservation/load balancing, no engines",
    tags: ["resource-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ?? "ExecutionResourceRegistryPort failed to register resource registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Resource Registry ao Execution Context (transporte).
 * Toda informação de recursos permanece no Resource Registry.
 * Nenhuma alocação / reserva / balanceamento nesta anexação.
 */
export async function attachResourceRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionResourceRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionResourceRegistryId",
        value: registry.executionResourceRegistryId,
        notes:
          "Execution Resource Registry reference — resources obtained exclusively via ExecutionResourceRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-resource-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Resource Registry attached structurally — no allocation, no reservation/load balancing, no engines",
        attributes: {
          executionResourceRegistryId: registry.executionResourceRegistryId,
          resourceAllocationImplemented: false,
          resourcesAllocated: false,
          resourcesReserved: false,
          loadBalancingImplemented: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionResourceRegistryId: registry.executionResourceRegistryId,
        resourceAllocationImplemented: false,
        resourcesAllocated: false,
        resourcesReserved: false,
        loadBalancingImplemented: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution resource registry",
    );
  }

  return updated.context;
}

/**
 * Registra estruturalmente o Environment Registry para a execução.
 * Catálogo controlado exclusivamente via ExecutionEnvironmentRegistryPort.
 * Nenhuma seleção. Nenhum provisionamento. Nenhuma ativação. Nenhuma Engine.
 */
export async function registerEnvironmentRegistryForContext(
  environmentRegistryPort: ExecutionEnvironmentRegistryPort,
  input: {
    executionId: string;
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
    executionEnvironmentRegistryId?: string;
  },
): Promise<ExecutionEnvironmentRegistry> {
  const registered = await environmentRegistryPort.registerEnvironment({
    executionEnvironmentRegistryId: input.executionEnvironmentRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    executionConstraintRegistryId: input.executionConstraintRegistryId,
    executionRequirementRegistryId: input.executionRequirementRegistryId,
    executionResourceRegistryId: input.executionResourceRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-platform-environments",
    name: "Structural Platform Environments",
    category: "structural",
    scope: "platform",
    definitionDescription:
      "Bootstrap structural environment — represents platform environments without selection/activation",
    portRef: "ExecutionEnvironmentRegistryPort",
    portContract: "structural-environment-registry",
    structuralNotes:
      "Environment Registry registered structurally — no selection, no provisioning/activation, no engines",
    tags: ["environment-registry", "foundation", "structural"],
  });

  if (!registered.ok || !registered.registry) {
    throw new Error(
      registered.message ??
        "ExecutionEnvironmentRegistryPort failed to register environment registry",
    );
  }

  return registered.registry;
}

/**
 * Anexa referência estrutural do Environment Registry ao Execution Context (transporte).
 * Toda informação de ambientes permanece no Environment Registry.
 * Nenhuma seleção / provisionamento / ativação nesta anexação.
 */
export async function attachEnvironmentRegistryToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  registry: ExecutionEnvironmentRegistry,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionEnvironmentRegistryId",
        value: registry.executionEnvironmentRegistryId,
        notes:
          "Execution Environment Registry reference — environments obtained exclusively via ExecutionEnvironmentRegistryPort",
      },
    ],
    appendHistory: [
      {
        event: "execution-environment-registry-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Execution Environment Registry attached structurally — no selection, no provisioning/activation, no engines",
        attributes: {
          executionEnvironmentRegistryId: registry.executionEnvironmentRegistryId,
          environmentSelectionImplemented: false,
          environmentsActivated: false,
          environmentsSelected: false,
          environmentActivationImplemented: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionEnvironmentRegistryId: registry.executionEnvironmentRegistryId,
        environmentSelectionImplemented: false,
        environmentsActivated: false,
        environmentsSelected: false,
        environmentActivationImplemented: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution environment registry",
    );
  }

  return updated.context;
}

/**
 * Obtém / cria estruturalmente a Message Queue para a execução.
 * Infraestrutura controlada exclusivamente via ExecutionQueuePort.
 * Nenhuma mensagem publicada. Nenhum consumidor. Nenhum worker. Nenhuma Engine.
 */
export async function registerMessageQueueForContext(
  messageQueuePort: ExecutionQueuePort,
  input: {
    executionId: string;
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
    executionEnvironmentRegistryId?: string;
    pipelineId?: string;
    executionMessageQueueId?: string;
  },
): Promise<CanonicalQueue> {
  const resolved = await messageQueuePort.getQueue({
    executionMessageQueueId: input.executionMessageQueueId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    executionConstraintRegistryId: input.executionConstraintRegistryId,
    executionRequirementRegistryId: input.executionRequirementRegistryId,
    executionResourceRegistryId: input.executionResourceRegistryId,
    executionEnvironmentRegistryId: input.executionEnvironmentRegistryId,
    pipelineId: input.pipelineId,
    key: "structural-execution-queue",
    name: "Structural Execution Message Queue",
    createIfMissing: true,
    structuralNotes:
      "Message Queue registered structurally — no publishing, no consumers, no workers, no engines",
    tags: ["message-queue", "foundation", "structural"],
  });

  if (!resolved.ok || !resolved.queue) {
    throw new Error(
      resolved.message ?? "ExecutionQueuePort failed to resolve structural message queue",
    );
  }

  return resolved.queue;
}

/**
 * Anexa referência estrutural do Message Queue ao Execution Context (transporte).
 * Anexa apenas executionMessageQueueId.
 * Nenhuma mensagem publicada. Nenhum consumidor. Nenhum worker.
 */
export async function attachMessageQueueToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  queue: CanonicalQueue,
  stamp: string,
): Promise<ExecutionContext> {
  const updated = await executionContextPort.updateContext({
    contextId,
    appendReferences: [
      {
        name: "executionMessageQueueId",
        value: queue.executionMessageQueueId,
        notes:
          "Execution Message Queue reference — queue obtained exclusively via ExecutionQueuePort",
      },
    ],
    appendHistory: [
      {
        event: "execution-message-queue-attached",
        phase: "created",
        status: "pending",
        occurredAt: stamp,
        notes:
          "Message Queue attached structurally — no publishing, no consumers, no workers, no engines",
        attributes: {
          executionMessageQueueId: queue.executionMessageQueueId,
          messagesPublished: false,
          messagesConsumed: false,
          workersInvoked: false,
          processingPerformed: false,
          realQueueBackend: false,
          enginesInvoked: false,
        },
      },
    ],
    metadata: {
      kind: "execution-context-metadata",
      customAttributes: {
        executionMessageQueueId: queue.executionMessageQueueId,
        messagesPublished: false,
        messagesConsumed: false,
        workersInvoked: false,
        processingPerformed: false,
        realQueueBackend: false,
      },
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(
      updated.message ?? "ExecutionContextPort failed to attach execution message queue",
    );
  }

  return updated.context;
}

/**
 * Anexa a composição do Pipeline Resolver ao Execution Context (estrutural).
 * O Resolver permanece independente do conteúdo do Context.
 */
export async function attachPipelineToExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  resolution: PipelineResolutionResult,
  stamp: string,
  createStageId: () => string = createExecutionContextStageId,
): Promise<ExecutionContext> {
  const stages: ExecutionContextStage[] = resolution.orderedNodes.map((node) => ({
    kind: "execution-context-stage" as const,
    id: createStageId(),
    name: node.stageName,
    order: node.order,
    portRef: node.portRef,
    portContract: node.portContract,
    status: "ready" as const,
    attachedAt: stamp,
    notes: `Pipeline stage attached structurally via PipelineResolverPort — no engine invoked`,
  }));

  const pipeline: ExecutionContextPipelineAttachment = {
    pipelineId: resolution.pipelineId,
    pipelineName: resolution.pipelineName,
    pipelineVersion: resolution.definition.version,
    resolutionId: resolution.resolutionId,
    resolutionResultId: resolution.id,
    stageCount: resolution.stageCount,
    nodeCount: resolution.nodeCount,
    officialPortRefs: resolution.officialPortRefs,
    officialPortContracts: resolution.officialPortContracts,
    enginesInvoked: false,
    stagesExecuted: false,
    attachedAt: stamp,
    structuralNotes:
      "Pipeline composition attached structurally — Resolver independent of Context content",
  };

  const updated = await executionContextPort.updateContext({
    contextId,
    status: "ready",
    phase: "pipeline-attached",
    pipeline,
    stages,
    appendHistory: [
      {
        event: "pipeline-attached",
        phase: "pipeline-attached",
        status: "ready",
        occurredAt: stamp,
        notes: "Pipeline composition attached from PipelineResolverPort — no stages executed",
        attributes: {
          pipelineId: resolution.pipelineId,
          stageCount: resolution.stageCount,
        },
      },
    ],
    appendSnapshot: {
      status: "ready",
      phase: "pipeline-attached",
      stageCount: stages.length,
      referenceCount: 0,
      historyCount: 0,
      capturedAt: stamp,
      notes: "snapshot after pipeline attachment",
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(updated.message ?? "ExecutionContextPort failed to attach pipeline");
  }

  return updated.context;
}

/**
 * Enriquece estruturalmente o Execution Context após o percurso estrutural do pipeline.
 * Nenhum processamento real — apenas refs / history / snapshots.
 */
export async function finalizeExecutionContext(
  executionContextPort: ExecutionContextPort,
  contextId: string,
  steps: readonly CanonicalExecutionStep[],
  refs: {
    intakeRef: string;
    documentRef: string;
    processingRef: string;
    ocrRef: string;
    mappingRef: string;
    vocabularyRef: string;
    profileRef: string;
    healthcareModelRef: string;
    bindingRef: string;
    runtimeRef: string;
    auditorRef: string;
  },
  resultId: string,
  orchestratorTraceId: string,
  stamp: string,
): Promise<ExecutionContext> {
  const stages: ExecutionContextStage[] = steps.map((step) => ({
    kind: "execution-context-stage" as const,
    id: step.id,
    name: step.name,
    order: step.order,
    portRef: step.portRef,
    portContract: step.portContract,
    status: "completed" as const,
    artifactRef: step.artifactRef,
    attachedAt: stamp,
    notes: step.notes,
  }));

  const updated = await executionContextPort.updateContext({
    contextId,
    status: "completed",
    phase: "finalized",
    stages,
    resultId,
    orchestratorTraceId,
    appendReferences: [
      { name: "intakeRef", value: refs.intakeRef, stageName: "document-intake" },
      { name: "documentRef", value: refs.documentRef, stageName: "document-processing" },
      { name: "processingRef", value: refs.processingRef, stageName: "processing-provider" },
      { name: "ocrRef", value: refs.ocrRef, stageName: "ocr-provider" },
      { name: "mappingRef", value: refs.mappingRef, stageName: "tiss-mapping" },
      { name: "vocabularyRef", value: refs.vocabularyRef, stageName: "tiss-vocabulary" },
      { name: "profileRef", value: refs.profileRef, stageName: "tiss-profile" },
      { name: "healthcareModelRef", value: refs.healthcareModelRef, stageName: "healthcare-model" },
      { name: "bindingRef", value: refs.bindingRef, stageName: "contract-rule-binding" },
      { name: "runtimeRef", value: refs.runtimeRef, stageName: "tiss-rule-runtime" },
      { name: "auditorRef", value: refs.auditorRef, stageName: "ai-auditor" },
    ],
    appendHistory: [
      {
        event: "structurally-enriched",
        phase: "structurally-enriched",
        status: "completed",
        occurredAt: stamp,
        notes: "Context enriched structurally after pipeline walk — no engines invoked",
      },
      {
        event: "finalized",
        phase: "finalized",
        status: "completed",
        occurredAt: stamp,
        notes: "Execution Context finalized — structural transport only",
      },
    ],
    appendSnapshot: {
      status: "completed",
      phase: "finalized",
      stageCount: stages.length,
      referenceCount: 0,
      historyCount: 0,
      capturedAt: stamp,
      notes: "final structural snapshot",
    },
    metadata: {
      kind: "execution-context-metadata",
      finishedAt: stamp,
    },
  });

  if (!updated.ok || !updated.context) {
    throw new Error(updated.message ?? "ExecutionContextPort failed to finalize context");
  }

  return updated.context;
}

export function foundationCapabilitiesBase(adapterId: string) {
  return {
    supportsStartExecution: true as const,
    supportsGetExecution: true as const,
    supportsListExecutions: true as const,
    supportsHealth: true as const,
    supportsCapabilities: true as const,
    supportsTracing: true as const,
    orchestratesViaFoundationPortsOnly: true as const,
    foundationPortCount: ORCHESTRATED_FOUNDATION_PORTS.length,
    foundationPortRefs: ORCHESTRATED_FOUNDATION_PORTS,
    supportsFuturePortInvocation: true as const,
    dependsOnPipelineResolver: true as const,
    resolvesPipelineDynamically: true as const,
    dependsOnExecutionContext: true as const,
    usesExecutionContextExclusively: true as const,
    dependsOnExecutionStateMachine: true as const,
    controlsLifecycleViaExecutionStateMachine: true as const,
    dependsOnExecutionEventBus: true as const,
    usesExecutionEventBusStructurally: true as const,
    dependsOnExecutionRegistry: true as const,
    usesExecutionRegistryStructurally: true as const,
    dependsOnExecutionTrace: true as const,
    usesExecutionTraceStructurally: true as const,
    dependsOnExecutionCapabilityRegistry: true as const,
    usesExecutionCapabilityRegistryStructurally: true as const,
    dependsOnExecutionDependencyRegistry: true as const,
    usesExecutionDependencyRegistryStructurally: true as const,
    dependsOnExecutionPolicyRegistry: true as const,
    usesExecutionPolicyRegistryStructurally: true as const,
    dependsOnExecutionConstraintRegistry: true as const,
    usesExecutionConstraintRegistryStructurally: true as const,
    dependsOnExecutionRequirementRegistry: true as const,
    usesExecutionRequirementRegistryStructurally: true as const,
    dependsOnExecutionResourceRegistry: true as const,
    usesExecutionResourceRegistryStructurally: true as const,
    dependsOnExecutionEnvironmentRegistry: true as const,
    usesExecutionEnvironmentRegistryStructurally: true as const,
    dependsOnExecutionQueue: true as const,
    usesExecutionQueueStructurally: true as const,
    implementsOcr: false as const,
    implementsAi: false as const,
    implementsXmlParser: false as const,
    implementsTissRules: false as const,
    implementsMapping: false as const,
    implementsValidation: false as const,
    implementsPersistence: false as const,
    implementsUi: false as const,
    implementsHttpWorkersQueues: false as const,
    orchestrationOnly: true as const,
    noDirectEngineCoupling: true as const,
    adapterId,
  };
}

export function filterContexts(
  contexts: readonly CanonicalExecutionContext[],
  status?: CanonicalExecutionStatus,
  limit?: number,
): CanonicalExecutionContext[] {
  let filtered = [...contexts];
  if (status) {
    filtered = filtered.filter((ctx) => ctx.status === status);
  }
  if (typeof limit === "number" && limit >= 0) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}
