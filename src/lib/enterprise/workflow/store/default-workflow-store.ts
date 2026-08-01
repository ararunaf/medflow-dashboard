/**
 * DefaultWorkflowStore — store in-process padrão (EPC-05).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 *
 * Persistência futura: substituir por adapter PersistencePort (FASE 8).
 */
import type {
  StoredWorkflowDefinition,
  StoredWorkflowState,
  WorkflowStore,
} from "./workflow-store";

export const DEFAULT_WORKFLOW_STORE_ID = "default-in-process";

export type DefaultWorkflowStoreOptions = {
  workflows?: readonly StoredWorkflowDefinition[];
  states?: readonly StoredWorkflowState[];
};

export class DefaultWorkflowStore implements WorkflowStore {
  readonly storeId = DEFAULT_WORKFLOW_STORE_ID;

  private readonly workflows = new Map<string, StoredWorkflowDefinition>();
  private readonly states = new Map<string, StoredWorkflowState>();

  constructor(options: DefaultWorkflowStoreOptions = {}) {
    for (const workflow of options.workflows ?? []) {
      this.workflows.set(workflow.id, workflow);
    }
    for (const state of options.states ?? []) {
      this.states.set(state.instanceId, state);
    }
  }

  getWorkflow(id: string): StoredWorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  setWorkflow(workflow: StoredWorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  listWorkflows(): readonly StoredWorkflowDefinition[] {
    return [...this.workflows.values()];
  }

  removeWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  getState(instanceId: string): StoredWorkflowState | undefined {
    return this.states.get(instanceId);
  }

  setState(state: StoredWorkflowState): void {
    this.states.set(state.instanceId, state);
  }

  listStates(): readonly StoredWorkflowState[] {
    return [...this.states.values()];
  }

  removeState(instanceId: string): boolean {
    return this.states.delete(instanceId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultWorkflowStore ready (${this.workflows.size} workflows, ${this.states.size} states).`,
    };
  }
}
