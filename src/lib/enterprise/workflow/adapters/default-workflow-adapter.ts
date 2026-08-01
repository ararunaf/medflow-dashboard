/**
 * DefaultWorkflowAdapter — adapter default de workflow (EPC-05).
 *
 * Encapsula o Default Workflow Store (in-process) atrás do WorkflowPort.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Persistence / Storage /
 * Metadata / Configuration / UI / APIs.
 */
import type { WorkflowPort } from "../ports/workflow-port";
import type {
  AdvanceWorkflowInput,
  AdvanceWorkflowResult,
  CancelWorkflowInput,
  CancelWorkflowResult,
  GetStateInput,
  GetStateResult,
  GetWorkflowInput,
  GetWorkflowResult,
  ListWorkflowsInput,
  ListWorkflowsResult,
  RegisterWorkflowInput,
  RegisterWorkflowResult,
  RollbackWorkflowInput,
  RollbackWorkflowResult,
  StartWorkflowInput,
  StartWorkflowResult,
  WorkflowCapabilities,
  WorkflowDefinition,
  WorkflowHealth,
} from "../ports/types";
import { nowIso } from "../ports/history";
import {
  advanceWorkflowInstance,
  cancelWorkflowInstance,
  rollbackWorkflowInstance,
  startWorkflowInstance,
} from "../runtime/workflow-runtime";
import { DefaultWorkflowStore, type WorkflowStore } from "../store";

export const DEFAULT_WORKFLOW_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * (ex.: PersistencePort) sem acoplar o Port a detalhes de produto.
 */
export type DefaultWorkflowRuntime = {
  /** Store ativo. Default: DefaultWorkflowStore in-process. */
  store?: WorkflowStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
};

function defaultRuntime(): DefaultWorkflowRuntime {
  return {
    store: new DefaultWorkflowStore(),
  };
}

export class DefaultWorkflowAdapter implements WorkflowPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultWorkflowRuntime;
  private readonly store: WorkflowStore;

  constructor(runtime: DefaultWorkflowRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultWorkflowStore();
  }

  capabilities(): WorkflowCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_WORKFLOW_ADAPTER_ID,
      supportsRegisterWorkflow: true,
      supportsGetWorkflow: true,
      supportsListWorkflows: true,
      supportsStart: true,
      supportsAdvance: true,
      supportsRollback: true,
      supportsCancel: true,
      supportsGetState: true,
      supportsConditions: true,
      supportsHistory: true,
      supportsTimeout: true,
    };
  }

  async health(): Promise<WorkflowHealth> {
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
          (probe.ok ? "Default workflow probe ok." : "Default workflow probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultWorkflowStore pronto (sem I/O externo — EPC-05).",
    };
  }

  async registerWorkflow(input: RegisterWorkflowInput): Promise<RegisterWorkflowResult> {
    const existing = this.store.getWorkflow(input.workflow.id);
    const at = nowIso();
    const workflow: WorkflowDefinition = {
      ...input.workflow,
      status: input.workflow.status ?? "active",
      createdAt: existing?.createdAt ?? input.workflow.createdAt ?? at,
      updatedAt: at,
    };
    this.store.setWorkflow(workflow);
    return {
      ok: true,
      id: workflow.id,
      message: existing ? "workflow updated" : "workflow registered",
      code: existing ? "updated" : "registered",
    };
  }

  async getWorkflow(input: GetWorkflowInput): Promise<GetWorkflowResult> {
    if (input.id) {
      const byId = this.store.getWorkflow(input.id);
      if (!byId) {
        return { ok: false, message: "not found", code: "not_found" };
      }
      return { ok: true, workflow: byId };
    }

    const match = this.store.listWorkflows().find((wf) => matchesWorkflowQuery(wf, input));
    if (!match) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, workflow: match };
  }

  async listWorkflows(input: ListWorkflowsInput = {}): Promise<ListWorkflowsResult> {
    const workflows = this.store.listWorkflows().filter((wf) => {
      if (input.namespace != null && wf.namespace !== input.namespace) return false;
      if (input.status != null && (wf.status ?? "active") !== input.status) return false;
      if (input.tag != null && !(wf.tags ?? []).includes(input.tag)) return false;
      if (input.namePrefix != null && !wf.name.startsWith(input.namePrefix)) return false;
      return true;
    });
    return { ok: true, workflows };
  }

  async start(input: StartWorkflowInput): Promise<StartWorkflowResult> {
    const workflow = this.store.getWorkflow(input.workflowId);
    if (!workflow) {
      return { ok: false, message: "workflow not found", code: "not_found" };
    }
    if (input.instanceId && this.store.getState(input.instanceId)) {
      return { ok: false, message: "instance already exists", code: "conflict" };
    }
    const result = startWorkflowInstance(workflow, input);
    if (result.ok && result.state) {
      this.store.setState(result.state);
    }
    return result;
  }

  async advance(input: AdvanceWorkflowInput): Promise<AdvanceWorkflowResult> {
    const state = this.store.getState(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    const workflow = this.store.getWorkflow(state.workflowId);
    if (!workflow) {
      return { ok: false, message: "workflow not found", code: "not_found", state };
    }
    const result = advanceWorkflowInstance(workflow, state, input);
    if (result.ok && result.state) {
      this.store.setState(result.state);
    }
    return result;
  }

  async rollback(input: RollbackWorkflowInput): Promise<RollbackWorkflowResult> {
    const state = this.store.getState(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    const result = rollbackWorkflowInstance(state, input);
    if (result.ok && result.state) {
      this.store.setState(result.state);
    }
    return result;
  }

  async cancel(input: CancelWorkflowInput): Promise<CancelWorkflowResult> {
    const state = this.store.getState(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    const result = cancelWorkflowInstance(state, input);
    if (result.ok && result.state) {
      this.store.setState(result.state);
    }
    return result;
  }

  async getState(input: GetStateInput): Promise<GetStateResult> {
    const state = this.store.getState(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    return { ok: true, state };
  }
}

function matchesWorkflowQuery(workflow: WorkflowDefinition, input: GetWorkflowInput): boolean {
  if (input.name != null && workflow.name !== input.name) return false;
  if (input.namespace != null && workflow.namespace !== input.namespace) return false;
  return input.name != null;
}
