/**
 * Helpers de History / Checkpoint — EPC-05.
 * Estruturais apenas; sem auditoria de negócio.
 */
import type {
  WorkflowCheckpoint,
  WorkflowCheckpointId,
  WorkflowHistoryEntry,
  WorkflowStageId,
  WorkflowStatus,
} from "./types";

let seq = 0;

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createHistoryEntry(
  partial: Omit<WorkflowHistoryEntry, "id" | "at"> & { id?: string; at?: string },
): WorkflowHistoryEntry {
  return {
    id: partial.id ?? nextId("hist"),
    at: partial.at ?? nowIso(),
    kind: partial.kind,
    fromStageId: partial.fromStageId,
    toStageId: partial.toStageId,
    transitionId: partial.transitionId,
    checkpointId: partial.checkpointId,
    status: partial.status,
    eventName: partial.eventName,
    actionName: partial.actionName,
    message: partial.message,
    payload: partial.payload,
  };
}

export function createCheckpoint(input: {
  stageId: WorkflowStageId;
  status: WorkflowStatus;
  label?: string;
  payload?: Readonly<Record<string, unknown>>;
  id?: WorkflowCheckpointId;
  at?: string;
}): WorkflowCheckpoint {
  return {
    id: input.id ?? nextId("ckpt"),
    at: input.at ?? nowIso(),
    stageId: input.stageId,
    status: input.status,
    label: input.label,
    payload: input.payload,
  };
}

export function findCheckpoint(
  checkpoints: readonly WorkflowCheckpoint[],
  checkpointId?: WorkflowCheckpointId,
): WorkflowCheckpoint | undefined {
  if (checkpoints.length === 0) return undefined;
  if (checkpointId) {
    return checkpoints.find((c) => c.id === checkpointId);
  }
  return checkpoints[checkpoints.length - 1];
}

export function appendHistory(
  history: readonly WorkflowHistoryEntry[],
  entry: WorkflowHistoryEntry,
): readonly WorkflowHistoryEntry[] {
  return [...history, entry];
}

export function appendCheckpoint(
  checkpoints: readonly WorkflowCheckpoint[],
  checkpoint: WorkflowCheckpoint,
): readonly WorkflowCheckpoint[] {
  return [...checkpoints, checkpoint];
}
