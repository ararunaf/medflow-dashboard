/**
 * WorkflowStore — contrato interno do store (EPC-05).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations.
 * Prep futuro: implementação backed by PersistencePort.
 */
import type { WorkflowDefinition, WorkflowState } from "../ports/types";

export type StoredWorkflowDefinition = WorkflowDefinition;
export type StoredWorkflowState = WorkflowState;

export interface WorkflowStore {
  readonly storeId: string;

  getWorkflow(id: string): StoredWorkflowDefinition | undefined;
  setWorkflow(workflow: StoredWorkflowDefinition): void;
  listWorkflows(): readonly StoredWorkflowDefinition[];
  removeWorkflow(id: string): boolean;

  getState(instanceId: string): StoredWorkflowState | undefined;
  setState(state: StoredWorkflowState): void;
  listStates(): readonly StoredWorkflowState[];
  removeState(instanceId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
