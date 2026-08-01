/**
 * Helpers internos de transporte estrutural do Execution Context (EPC-24 Sprint 03).
 *
 * Somente criação / enriquecimento / metadados in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações. Sem execução de etapas.
 */
import {
  createContextId,
  createHistoryId,
  createReferenceId,
  createSnapshotId,
  createTraceId,
} from "../ports/identity";
import type {
  ExecutionContext,
  ExecutionContextCapability,
  ExecutionContextHistoryEntry,
  ExecutionContextReference,
  ExecutionContextSnapshot,
  ExecutionContextStatus,
  ExecutionContextTrace,
} from "../ports/models";
import type {
  CreateContextInput,
  ExecutionContextCapabilities,
  ListContextsInput,
  UpdateContextInput,
} from "../ports/types";
import type { ExecutionContextStore } from "../store";

export const STRUCTURAL_CAPABILITY: ExecutionContextCapability = {
  kind: "execution-context-capability",
  structuralTransportOnly: true,
  enginesInvoked: false,
  stagesExecuted: false,
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

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionContextCapabilities, "provider"> {
  return {
    adapterId,
    supportsCreateContext: true,
    supportsUpdateContext: true,
    supportsGetContext: true,
    supportsListContexts: true,
    supportsHealth: true,
    supportsCapabilities: true,
    structuralTransportOnly: true,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
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
}

function buildReferences(
  input: CreateContextInput | undefined,
  createId: () => string,
): ExecutionContextReference[] {
  return (input?.references ?? []).map((ref) => ({
    kind: "execution-context-reference" as const,
    id: createId(),
    name: ref.name,
    value: ref.value,
    stageName: ref.stageName,
    notes: ref.notes,
  }));
}

export function buildContext(
  input: CreateContextInput | undefined,
  contextId: string,
  stamp: string,
  factories?: {
    createReferenceId?: () => string;
    createHistoryId?: () => string;
    createSnapshotId?: () => string;
    createTraceId?: () => string;
  },
): ExecutionContext {
  const refId = factories?.createReferenceId ?? createReferenceId;
  const histId = factories?.createHistoryId ?? createHistoryId;
  const snapId = factories?.createSnapshotId ?? createSnapshotId;
  const trcId = factories?.createTraceId ?? createTraceId;

  const references = buildReferences(input, refId);
  const history: ExecutionContextHistoryEntry[] = [
    {
      kind: "execution-context-history",
      id: histId(),
      contextId,
      event: "context-created",
      phase: "created",
      status: "pending",
      occurredAt: stamp,
      notes: "Execution Context created structurally — no processing performed",
    },
  ];

  const snapshot: ExecutionContextSnapshot = {
    kind: "execution-context-snapshot",
    id: snapId(),
    contextId,
    status: "pending",
    phase: "created",
    stageCount: 0,
    referenceCount: references.length,
    historyCount: history.length,
    capturedAt: stamp,
    notes: "initial structural snapshot",
  };

  const trace: ExecutionContextTrace = {
    kind: "execution-context-trace",
    id: trcId(),
    contextId,
    correlationId: input?.correlationId,
    stages: [],
    history,
    startedAt: stamp,
    status: "pending",
    errors: [],
    warnings: [],
    structuralOnly: true,
  };

  return {
    kind: "execution-context",
    id: contextId,
    identity: {
      kind: "execution-context-identity",
      contextId,
      executionId: contextId,
      correlationId: input?.correlationId,
      tenantRef: input?.tenantRef,
      channel: input?.channel,
    },
    metadata: {
      kind: "execution-context-metadata",
      tags: input?.tags,
      version: input?.version ?? "1",
      createdAt: stamp,
      updatedAt: stamp,
      startedAt: stamp,
      structuralNotes: input?.structuralNotes,
      customAttributes: input?.customAttributes,
    },
    state: {
      kind: "execution-context-state",
      status: "pending",
      phase: "created",
      stageCount: 0,
      enginesInvoked: false,
      stagesExecuted: false,
      processingPerformed: false,
    },
    references,
    history,
    stages: [],
    capability: STRUCTURAL_CAPABILITY,
    snapshots: [snapshot],
    trace,
    requestCorrelationId: input?.correlationId,
  };
}

export function applyUpdate(
  existing: ExecutionContext,
  input: UpdateContextInput,
  stamp: string,
  factories?: {
    createReferenceId?: () => string;
    createHistoryId?: () => string;
    createSnapshotId?: () => string;
  },
): ExecutionContext {
  const refId = factories?.createReferenceId ?? createReferenceId;
  const histId = factories?.createHistoryId ?? createHistoryId;
  const snapId = factories?.createSnapshotId ?? createSnapshotId;

  const appendedRefs: ExecutionContextReference[] = (input.appendReferences ?? []).map((ref) => ({
    kind: "execution-context-reference" as const,
    id: refId(),
    name: ref.name,
    value: ref.value,
    stageName: ref.stageName,
    notes: ref.notes,
  }));

  const appendedHistory: ExecutionContextHistoryEntry[] = (input.appendHistory ?? []).map(
    (entry) => ({
      kind: "execution-context-history" as const,
      id: histId(),
      contextId: existing.id,
      event: entry.event,
      phase: entry.phase,
      status: entry.status,
      occurredAt: entry.occurredAt ?? stamp,
      notes: entry.notes,
      attributes: entry.attributes,
    }),
  );

  const stages = input.stages ?? existing.stages;
  const references = [...existing.references, ...appendedRefs];
  const history = [...existing.history, ...appendedHistory];

  const phase = input.phase ?? existing.state.phase;
  const status = input.status ?? existing.state.status;

  const snapshots = [...existing.snapshots];
  if (input.appendSnapshot) {
    snapshots.push({
      kind: "execution-context-snapshot",
      id: snapId(),
      contextId: existing.id,
      status: input.appendSnapshot.status ?? status,
      phase: input.appendSnapshot.phase ?? phase,
      stageCount: input.appendSnapshot.stageCount ?? stages.length,
      referenceCount: input.appendSnapshot.referenceCount ?? references.length,
      historyCount: input.appendSnapshot.historyCount ?? history.length,
      capturedAt: input.appendSnapshot.capturedAt ?? stamp,
      notes: input.appendSnapshot.notes,
    });
  }

  const metadata = {
    ...existing.metadata,
    ...input.metadata,
    kind: "execution-context-metadata" as const,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ?? input.metadata?.structuralNotes ?? existing.metadata.structuralNotes,
    finishedAt:
      input.metadata?.finishedAt ??
      (status === "completed" || status === "failed" || status === "cancelled"
        ? (existing.metadata.finishedAt ?? stamp)
        : existing.metadata.finishedAt),
  };

  const trace = input.trace
    ? {
        ...input.trace,
        history,
        stages: [...stages],
        status,
      }
    : existing.trace
      ? {
          ...existing.trace,
          history,
          stages: [...stages],
          status,
          finishedAt:
            status === "completed" || status === "failed" || status === "cancelled"
              ? (existing.trace.finishedAt ?? stamp)
              : existing.trace.finishedAt,
        }
      : undefined;

  return {
    ...existing,
    metadata,
    state: {
      ...existing.state,
      kind: "execution-context-state",
      status,
      phase,
      currentStageName: input.currentStageName ?? existing.state.currentStageName,
      currentStageOrder: input.currentStageOrder ?? existing.state.currentStageOrder,
      stageCount: stages.length,
      enginesInvoked: false,
      stagesExecuted: false,
      processingPerformed: false,
    },
    references,
    history,
    stages,
    snapshots,
    trace,
    pipeline: input.pipeline ?? existing.pipeline,
    resultId: input.resultId ?? existing.resultId,
    orchestratorTraceId: input.orchestratorTraceId ?? existing.orchestratorTraceId,
    capability: STRUCTURAL_CAPABILITY,
  };
}

export function persistContext(store: ExecutionContextStore, context: ExecutionContext): void {
  store.setContext({ context });
}

export function filterContexts(
  contexts: readonly ExecutionContext[],
  input?: ListContextsInput,
): ExecutionContext[] {
  let filtered = [...contexts];
  if (input?.status) {
    filtered = filtered.filter((ctx) => ctx.state.status === input.status);
  }
  if (input?.phase) {
    filtered = filtered.filter((ctx) => ctx.state.phase === input.phase);
  }
  if (typeof input?.limit === "number" && input.limit >= 0) {
    filtered = filtered.slice(0, input.limit);
  }
  return filtered;
}

export function createIds(factories?: { createContextId?: () => string }): { contextId: string } {
  return {
    contextId: factories?.createContextId?.() ?? createContextId(),
  };
}

export function isTerminalStatus(status: ExecutionContextStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}
