/**
 * Helpers internos do Execution Trace (EPC-24 Sprint 07).
 *
 * Somente criação / append / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem logs. Sem telemetria. Sem Engines.
 */
import {
  createExecutionTraceId,
  createTraceEntryId,
  createTraceNodeId,
  createTraceSnapshotId,
  createTraceStepId,
  createTraceTimelineId,
} from "../ports/identity";
import {
  STRUCTURAL_TRACE_CAPABILITY,
  type ExecutionTrace,
  type ExecutionTraceEntry,
  type ExecutionTraceHealth,
  type ExecutionTraceMetadata,
  type ExecutionTraceNode,
  type ExecutionTraceReference,
  type ExecutionTraceSnapshot,
  type ExecutionTraceStatistics,
  type ExecutionTraceStep,
  type ExecutionTraceTimeline,
} from "../ports/models";
import type {
  AppendTraceInput,
  CreateTraceInput,
  ExecutionTracePortCapabilities,
} from "../ports/types";
import type { ExecutionTraceStore, StoredExecutionTrace } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionTracePortCapabilities, "provider"> {
  return {
    adapterId,
    supportsCreateTrace: true,
    supportsAppendTrace: true,
    supportsGetTrace: true,
    supportsListTraceEntries: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralTraceOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    logsImplemented: false,
    telemetryImplemented: false,
    observabilityExternal: false,
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

export function buildTrace(
  input: CreateTraceInput,
  executionTraceId: string,
  stamp: string,
  factories?: {
    createSnapshotId?: () => string;
    createTimelineId?: () => string;
    createStepId?: () => string;
    createNodeId?: () => string;
  },
): ExecutionTrace {
  const snapshotId = factories?.createSnapshotId ?? createTraceSnapshotId;
  const timelineId = factories?.createTimelineId ?? createTraceTimelineId;
  const stepId = factories?.createStepId ?? createTraceStepId;
  const nodeId = factories?.createNodeId ?? createTraceNodeId;

  const references: ExecutionTraceReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-trace-reference" as const,
    name: ref.name,
    value: ref.value,
    notes: ref.notes,
  }));

  const derivedRefs: ExecutionTraceReference[] = [];
  if (input.contextId) {
    derivedRefs.push({
      kind: "execution-trace-reference",
      name: "contextId",
      value: input.contextId,
      notes: "Structural context reference",
    });
  }
  if (input.stateMachineId) {
    derivedRefs.push({
      kind: "execution-trace-reference",
      name: "stateMachineId",
      value: input.stateMachineId,
      notes: "Structural state machine reference",
    });
  }
  if (input.eventBusId) {
    derivedRefs.push({
      kind: "execution-trace-reference",
      name: "eventBusId",
      value: input.eventBusId,
      notes: "Structural event bus reference",
    });
  }
  if (input.executionRegistryId) {
    derivedRefs.push({
      kind: "execution-trace-reference",
      name: "executionRegistryId",
      value: input.executionRegistryId,
      notes: "Structural registry reference",
    });
  }
  if (input.pipelineId) {
    derivedRefs.push({
      kind: "execution-trace-reference",
      name: "pipelineId",
      value: input.pipelineId,
      notes: "Structural pipeline reference",
    });
  }

  const allRefs = [...references, ...derivedRefs];

  const nodes: ExecutionTraceNode[] = (input.nodes ?? []).map((node, index) => ({
    kind: "execution-trace-node" as const,
    id: node.id ?? nodeId(),
    name: node.name,
    order: node.order ?? index + 1,
    portRef: node.portRef,
    notes: node.notes,
    enginesInvoked: false,
    processingPerformed: false,
  }));

  const steps: ExecutionTraceStep[] = (input.steps ?? []).map((step, index) => ({
    kind: "execution-trace-step" as const,
    id: step.id ?? stepId(),
    name: step.name,
    order: step.order ?? index + 1,
    status: step.status ?? "pending",
    occurredAt: stamp,
    nodeId: step.nodeId,
    notes: step.notes,
    enginesInvoked: false,
    logsWritten: false,
    telemetrySent: false,
  }));

  const metadata: ExecutionTraceMetadata = {
    kind: "execution-trace-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  const timeline: ExecutionTraceTimeline = {
    kind: "execution-trace-timeline",
    id: timelineId(),
    executionTraceId,
    executionId: input.executionId,
    entryIds: [],
    stepIds: steps.map((s) => s.id),
    entryCount: 0,
    updatedAt: stamp,
    notes: "Structural timeline — no logs, no telemetry",
    logsWritten: false,
    telemetrySent: false,
  };

  const snapshot: ExecutionTraceSnapshot = {
    kind: "execution-trace-snapshot",
    id: snapshotId(),
    executionTraceId,
    executionId: input.executionId,
    capturedAt: stamp,
    entryCount: 0,
    stepCount: steps.length,
    nodeCount: nodes.length,
    referenceCount: allRefs.length,
    notes: "Structural snapshot at trace creation — no functional audit",
    enginesInvoked: false,
    logsWritten: false,
    telemetrySent: false,
    processingPerformed: false,
  };

  return {
    kind: "execution-trace",
    id: executionTraceId,
    executionTraceId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    pipelineId: input.pipelineId,
    entries: [],
    steps,
    nodes,
    references: allRefs,
    metadata,
    snapshot,
    timeline,
    capability: STRUCTURAL_TRACE_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    persistenceImplemented: false,
    databaseUsed: false,
    logsImplemented: false,
    telemetryImplemented: false,
    observabilityExternal: false,
  };
}

export function appendEntryToTrace(
  trace: ExecutionTrace,
  input: AppendTraceInput,
  stamp: string,
  factories?: {
    createEntryId?: () => string;
    createSnapshotId?: () => string;
  },
): { trace: ExecutionTrace; entry: ExecutionTraceEntry } {
  const entryId = factories?.createEntryId ?? createTraceEntryId;
  const snapshotId = factories?.createSnapshotId ?? createTraceSnapshotId;

  const entryRefs: ExecutionTraceReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-trace-reference" as const,
    name: ref.name,
    value: ref.value,
    notes: ref.notes,
  }));

  const entry: ExecutionTraceEntry = {
    kind: "execution-trace-entry",
    id: input.entryId ?? entryId(),
    executionTraceId: trace.executionTraceId,
    executionId: trace.executionId,
    sequence: trace.entries.length + 1,
    name: input.name,
    occurredAt: stamp,
    stepId: input.stepId,
    nodeId: input.nodeId,
    references: entryRefs,
    metadata: {
      kind: "execution-trace-metadata",
      tags: input.tags,
      version: trace.metadata.version,
      createdAt: stamp,
      updatedAt: stamp,
      structuralNotes: input.notes,
      customAttributes: input.customAttributes,
    },
    notes: input.notes ?? "Structural append — no logs written, no telemetry sent",
    logsWritten: false,
    telemetrySent: false,
    enginesInvoked: false,
    processingPerformed: false,
    persistenceImplemented: false,
  };

  const entries = [...trace.entries, entry];
  const timeline: ExecutionTraceTimeline = {
    ...trace.timeline,
    entryIds: entries.map((e) => e.id),
    entryCount: entries.length,
    updatedAt: stamp,
  };

  const snapshot: ExecutionTraceSnapshot = {
    kind: "execution-trace-snapshot",
    id: snapshotId(),
    executionTraceId: trace.executionTraceId,
    executionId: trace.executionId,
    capturedAt: stamp,
    entryCount: entries.length,
    stepCount: trace.steps.length,
    nodeCount: trace.nodes.length,
    referenceCount: trace.references.length + entryRefs.length,
    notes: "Structural snapshot after append — no functional audit",
    enginesInvoked: false,
    logsWritten: false,
    telemetrySent: false,
    processingPerformed: false,
  };

  const nextTrace: ExecutionTrace = {
    ...trace,
    entries,
    timeline,
    snapshot,
    metadata: {
      ...trace.metadata,
      updatedAt: stamp,
    },
    updatedAt: stamp,
  };

  return { trace: nextTrace, entry };
}

export function buildStatistics(
  store: ExecutionTraceStore,
  stamp: string,
): ExecutionTraceStatistics {
  return {
    kind: "execution-trace-statistics",
    totalTraces: store.traceCount(),
    totalEntries: store.entryCount(),
    totalSteps: store.stepCount(),
    totalNodes: store.nodeCount(),
    totalReferences: store.referenceCount(),
    totalSnapshots: store.snapshotCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    logsImplemented: false,
    telemetryImplemented: false,
    enginesInvoked: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionTraceStore,
  stamp: string,
  message?: string,
): ExecutionTraceHealth {
  return {
    kind: "execution-trace-health",
    ok: true,
    message: message ?? "Execution Trace structural health ok — in-memory only, no logs/telemetry",
    traceCount: store.traceCount(),
    entryCount: store.entryCount(),
    timelineReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    logsImplemented: false,
    telemetryImplemented: false,
    enginesInvoked: false,
    checkedAt: stamp,
  };
}

export function persistTrace(store: ExecutionTraceStore, trace: ExecutionTrace): void {
  const stored: StoredExecutionTrace = { trace };
  store.setTrace(stored);
}

export function resolveTraceId(
  input: { executionTraceId?: string },
  createId: () => string = createExecutionTraceId,
): string {
  return input.executionTraceId ?? createId();
}
