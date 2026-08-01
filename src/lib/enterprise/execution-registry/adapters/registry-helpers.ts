/**
 * Helpers internos do Execution Registry (EPC-24 Sprint 06).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem acesso externo.
 */
import {
  createExecutionRegistryId,
  createRegistryIndexId,
  createRegistryRecordId,
  createRegistrySnapshotId,
} from "../ports/identity";
import {
  STRUCTURAL_REGISTRY_CAPABILITY,
  type ExecutionRegistryEntry,
  type ExecutionRegistryFilter,
  type ExecutionRegistryHealth,
  type ExecutionRegistryIndex,
  type ExecutionRegistryMetadata,
  type ExecutionRegistryQuery,
  type ExecutionRegistryRecord,
  type ExecutionRegistryReference,
  type ExecutionRegistrySnapshot,
  type ExecutionRegistryStatistics,
} from "../ports/models";
import type { ExecutionRegistryPortCapabilities, RegisterExecutionInput } from "../ports/types";
import type { ExecutionRegistryStore, StoredExecutionRegistryEntry } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterExecution: true,
    supportsGetExecution: true,
    supportsListExecutions: true,
    supportsFindExecution: true,
    supportsRemoveExecution: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
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

export function buildRegistryEntry(
  input: RegisterExecutionInput,
  executionRegistryId: string,
  stamp: string,
  factories?: {
    createSnapshotId?: () => string;
    createRecordId?: () => string;
  },
): { entry: ExecutionRegistryEntry; record: ExecutionRegistryRecord } {
  const snapshotId = factories?.createSnapshotId ?? createRegistrySnapshotId;
  const recordId = factories?.createRecordId ?? createRegistryRecordId;

  const references: ExecutionRegistryReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-registry-reference" as const,
    name: ref.name,
    value: ref.value,
    notes: ref.notes,
  }));

  // Refs estruturais derivadas dos IDs anexados
  const derivedRefs: ExecutionRegistryReference[] = [];
  if (input.contextId) {
    derivedRefs.push({
      kind: "execution-registry-reference",
      name: "contextId",
      value: input.contextId,
      notes: "Structural context reference",
    });
  }
  if (input.stateMachineId) {
    derivedRefs.push({
      kind: "execution-registry-reference",
      name: "stateMachineId",
      value: input.stateMachineId,
      notes: "Structural state machine reference",
    });
  }
  if (input.eventBusId) {
    derivedRefs.push({
      kind: "execution-registry-reference",
      name: "eventBusId",
      value: input.eventBusId,
      notes: "Structural event bus reference",
    });
  }
  if (input.pipelineId) {
    derivedRefs.push({
      kind: "execution-registry-reference",
      name: "pipelineId",
      value: input.pipelineId,
      notes: "Structural pipeline reference",
    });
  }

  const allRefs = [...references, ...derivedRefs];

  const metadata: ExecutionRegistryMetadata = {
    kind: "execution-registry-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  const snapshot: ExecutionRegistrySnapshot = {
    kind: "execution-registry-snapshot",
    id: snapshotId(),
    executionRegistryId,
    executionId: input.executionId,
    capturedAt: stamp,
    referenceCount: allRefs.length,
    notes: "Structural snapshot at registration — no functional history",
    enginesInvoked: false,
    processingPerformed: false,
  };

  const entry: ExecutionRegistryEntry = {
    kind: "execution-registry-entry",
    id: executionRegistryId,
    executionRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    pipelineId: input.pipelineId,
    references: allRefs,
    metadata,
    snapshot,
    capability: STRUCTURAL_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const record: ExecutionRegistryRecord = {
    kind: "execution-registry-record",
    id: recordId(),
    executionRegistryId,
    executionId: input.executionId,
    entry,
    recordedAt: stamp,
    notes: "Structural registry record — in-memory only, no persistence",
  };

  return { entry, record };
}

export function matchesFilter(
  entry: ExecutionRegistryEntry,
  filter?: ExecutionRegistryFilter,
): boolean {
  if (!filter) return true;
  if (filter.executionId && entry.executionId !== filter.executionId) return false;
  if (filter.correlationId && entry.correlationId !== filter.correlationId) return false;
  if (filter.contextId && entry.contextId !== filter.contextId) return false;
  if (filter.stateMachineId && entry.stateMachineId !== filter.stateMachineId) return false;
  if (filter.eventBusId && entry.eventBusId !== filter.eventBusId) return false;
  if (filter.pipelineId && entry.pipelineId !== filter.pipelineId) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = entry.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function matchesQuery(
  entry: ExecutionRegistryEntry,
  query: ExecutionRegistryQuery,
): boolean {
  if (query.executionRegistryId && entry.executionRegistryId !== query.executionRegistryId) {
    return false;
  }
  if (query.executionId && entry.executionId !== query.executionId) return false;
  if (query.correlationId && entry.correlationId !== query.correlationId) return false;
  return matchesFilter(entry, query.filter);
}

export function buildIndex(
  entries: readonly ExecutionRegistryEntry[],
  stamp: string,
  createIndexId: () => string = createRegistryIndexId,
): ExecutionRegistryIndex {
  return {
    kind: "execution-registry-index",
    id: createIndexId(),
    entryCount: entries.length,
    executionIds: entries.map((e) => e.executionId),
    executionRegistryIds: entries.map((e) => e.executionRegistryId),
    updatedAt: stamp,
    notes: "Structural in-memory index — no distributed cache",
  };
}

export function buildStatistics(
  store: ExecutionRegistryStore,
  stamp: string,
): ExecutionRegistryStatistics {
  return {
    kind: "execution-registry-statistics",
    totalEntries: store.entryCount(),
    totalRecords: store.recordCount(),
    totalReferences: store.referenceCount(),
    totalSnapshots: store.snapshotCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionRegistryStore,
  stamp: string,
  message?: string,
): ExecutionRegistryHealth {
  return {
    kind: "execution-registry-health",
    ok: true,
    message: message ?? "Execution Registry structural health ok — in-memory only",
    entryCount: store.entryCount(),
    recordCount: store.recordCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    checkedAt: stamp,
  };
}

export function persistEntry(
  store: ExecutionRegistryStore,
  entry: ExecutionRegistryEntry,
  record: ExecutionRegistryRecord,
): void {
  const stored: StoredExecutionRegistryEntry = { entry, record };
  store.setEntry(stored);
}

export function resolveRegistryId(
  input: { executionRegistryId?: string; executionId?: string },
  createId: () => string = createExecutionRegistryId,
): string {
  return input.executionRegistryId ?? createId();
}
