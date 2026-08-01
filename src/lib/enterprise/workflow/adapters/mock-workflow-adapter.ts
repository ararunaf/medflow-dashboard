/**
 * MockWorkflowAdapter — EPC-05.
 *
 * Permite testes, homologação, benchmark e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
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
  WorkflowProviderId,
  WorkflowState,
} from "../ports/types";
import { nowIso } from "../ports/history";
import {
  advanceWorkflowInstance,
  cancelWorkflowInstance,
  rollbackWorkflowInstance,
  startWorkflowInstance,
} from "../runtime/workflow-runtime";

export type MockWorkflowAdapterOptions = {
  provider?: Extract<WorkflowProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  workflows?: readonly WorkflowDefinition[];
  states?: readonly WorkflowState[];
};

export class MockWorkflowAdapter implements WorkflowPort {
  readonly providerId: Extract<WorkflowProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly workflows = new Map<string, WorkflowDefinition>();
  private readonly states = new Map<string, WorkflowState>();

  constructor(options: MockWorkflowAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} workflow ready.`;

    for (const workflow of options.workflows ?? []) {
      this.workflows.set(workflow.id, workflow);
    }
    for (const state of options.states ?? []) {
      this.states.set(state.instanceId, state);
    }
  }

  capabilities(): WorkflowCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async registerWorkflow(input: RegisterWorkflowInput): Promise<RegisterWorkflowResult> {
    const existing = this.workflows.get(input.workflow.id);
    const at = nowIso();
    const workflow: WorkflowDefinition = {
      ...input.workflow,
      status: input.workflow.status ?? "active",
      createdAt: existing?.createdAt ?? input.workflow.createdAt ?? at,
      updatedAt: at,
    };
    this.workflows.set(workflow.id, workflow);
    return {
      ok: true,
      id: workflow.id,
      message: existing ? "workflow updated" : "workflow registered",
      code: existing ? "updated" : "registered",
    };
  }

  async getWorkflow(input: GetWorkflowInput): Promise<GetWorkflowResult> {
    if (input.id) {
      const byId = this.workflows.get(input.id);
      if (!byId) {
        return { ok: false, message: "not found", code: "not_found" };
      }
      return { ok: true, workflow: byId };
    }

    const match = [...this.workflows.values()].find((wf) => matchesWorkflowQuery(wf, input));
    if (!match) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, workflow: match };
  }

  async listWorkflows(input: ListWorkflowsInput = {}): Promise<ListWorkflowsResult> {
    const workflows = [...this.workflows.values()].filter((wf) => {
      if (input.namespace != null && wf.namespace !== input.namespace) return false;
      if (input.status != null && (wf.status ?? "active") !== input.status) return false;
      if (input.tag != null && !(wf.tags ?? []).includes(input.tag)) return false;
      if (input.namePrefix != null && !wf.name.startsWith(input.namePrefix)) return false;
      return true;
    });
    return { ok: true, workflows };
  }

  async start(input: StartWorkflowInput): Promise<StartWorkflowResult> {
    const workflow = this.workflows.get(input.workflowId);
    if (!workflow) {
      return { ok: false, message: "workflow not found", code: "not_found" };
    }
    if (input.instanceId && this.states.get(input.instanceId)) {
      return { ok: false, message: "instance already exists", code: "conflict" };
    }
    const result = startWorkflowInstance(workflow, input);
    if (result.ok && result.state) {
      this.states.set(result.state.instanceId, result.state);
    }
    return result;
  }

  async advance(input: AdvanceWorkflowInput): Promise<AdvanceWorkflowResult> {
    const state = this.states.get(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    const workflow = this.workflows.get(state.workflowId);
    if (!workflow) {
      return { ok: false, message: "workflow not found", code: "not_found", state };
    }
    const result = advanceWorkflowInstance(workflow, state, input);
    if (result.ok && result.state) {
      this.states.set(result.state.instanceId, result.state);
    }
    return result;
  }

  async rollback(input: RollbackWorkflowInput): Promise<RollbackWorkflowResult> {
    const state = this.states.get(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    const result = rollbackWorkflowInstance(state, input);
    if (result.ok && result.state) {
      this.states.set(result.state.instanceId, result.state);
    }
    return result;
  }

  async cancel(input: CancelWorkflowInput): Promise<CancelWorkflowResult> {
    const state = this.states.get(input.instanceId);
    if (!state) {
      return { ok: false, message: "state not found", code: "not_found" };
    }
    const result = cancelWorkflowInstance(state, input);
    if (result.ok && result.state) {
      this.states.set(result.state.instanceId, result.state);
    }
    return result;
  }

  async getState(input: GetStateInput): Promise<GetStateResult> {
    const state = this.states.get(input.instanceId);
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
