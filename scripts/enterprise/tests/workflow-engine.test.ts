#!/usr/bin/env node
/**
 * EPC-05 — Workflow Engine Foundation
 * Prova Application → WorkflowPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_CONDITION_KINDS,
  WORKFLOW_STATUSES,
  alwaysCondition,
  createWorkflowPort,
  DEFAULT_WORKFLOW_ADAPTER_ID,
  DefaultWorkflowAdapter,
  DefaultWorkflowStore,
  describeWorkflowGraph,
  evaluateConditionStructurally,
  eventCondition,
  expressionCondition,
  getInitialStage,
  getWorkflowHealthSummary,
  isKnownConditionKind,
  MockWorkflowAdapter,
  neverCondition,
  type WorkflowDefinition,
  type WorkflowPort,
} from "../../../src/lib/enterprise/workflow/index.ts";

function sampleWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: "wf-generic",
    name: "GenericFlow",
    namespace: "enterprise.core",
    description: "Domain-agnostic state machine — no clinical content",
    status: "active",
    tags: ["foundation"],
    stages: [
      { id: "stage-a", name: "Alpha", initial: true },
      { id: "stage-b", name: "Beta" },
      { id: "stage-c", name: "Gamma", terminal: true },
    ],
    transitions: [
      {
        id: "t-ab",
        name: "AtoB",
        fromStageId: "stage-a",
        toStageId: "stage-b",
        conditions: [alwaysCondition({ name: "pass" })],
        actions: [{ kind: "noop", name: "noop-ab" }],
      },
      {
        id: "t-bc",
        name: "BtoC",
        fromStageId: "stage-b",
        toStageId: "stage-c",
        conditions: [eventCondition("ready", { name: "await-ready" })],
        actions: [{ kind: "emit_event", name: "emit-done", eventName: "done" }],
      },
    ],
    events: [{ name: "ready" }, { name: "done" }],
    triggers: [{ kind: "start", name: "manual-start" }],
    metadataRef: {
      metadataId: "schema-opaque",
      metadataKind: "schema",
      metadataNamespace: "enterprise.core",
    },
    ...overrides,
  };
}

describe("EPC-05 WorkflowPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: WorkflowPort = new MockWorkflowAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterWorkflow, true);
    assert.equal(caps.supportsStart, true);
    assert.equal(caps.supportsAdvance, true);
    assert.equal(caps.supportsRollback, true);
    assert.equal(caps.supportsCancel, true);
    assert.equal(caps.supportsConditions, true);
    assert.equal(caps.supportsHistory, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createWorkflowPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultWorkflowStore();
    const port: WorkflowPort = new DefaultWorkflowAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_WORKFLOW_ADAPTER_ID);
    assert.equal(caps.supportsListWorkflows, true);
    assert.equal(caps.supportsGetState, true);
    assert.equal(caps.supportsTimeout, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultWorkflowAdapter({
      store: new DefaultWorkflowStore(),
      ping: async () => ({ ok: true, message: "workflow probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "workflow probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultWorkflowAdapter; futuros falham explicitamente", () => {
    const defaultPort = createWorkflowPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createWorkflowPort({ provider: "database" }), /ainda não implementado/i);
    assert.throws(() => createWorkflowPort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(() => createWorkflowPort({ provider: "persistence" }), /ainda não implementado/i);
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createWorkflowPort({ provider: "mock" });
    const summary = await getWorkflowHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("registerWorkflow/getWorkflow/listWorkflows funcionam no Mock", async () => {
    const port = new MockWorkflowAdapter();
    const workflow = sampleWorkflow();

    const reg = await port.registerWorkflow({ workflow });
    assert.equal(reg.ok, true);
    assert.equal(reg.id, "wf-generic");

    const get = await port.getWorkflow({ id: "wf-generic" });
    assert.equal(get.ok, true);
    assert.equal(get.workflow?.name, "GenericFlow");
    assert.equal(getInitialStage(get.workflow!)?.id, "stage-a");

    const byName = await port.getWorkflow({
      name: "GenericFlow",
      namespace: "enterprise.core",
    });
    assert.equal(byName.ok, true);

    const list = await port.listWorkflows({ namespace: "enterprise.core", tag: "foundation" });
    assert.equal(list.ok, true);
    assert.equal(list.workflows.length, 1);

    const graph = describeWorkflowGraph(workflow);
    assert.equal(graph.stageCount, 3);
    assert.equal(graph.transitionCount, 2);
    assert.equal(graph.hasInitial, true);
  });

  it("start/advance/getState orquestra estados sem regra de negócio", async () => {
    const store = new DefaultWorkflowStore();
    const port = new DefaultWorkflowAdapter({ store });
    await port.registerWorkflow({ workflow: sampleWorkflow() });

    const started = await port.start({
      workflowId: "wf-generic",
      instanceId: "inst-1",
      context: { token: "opaque" },
    });
    assert.equal(started.ok, true);
    assert.equal(started.state?.currentStageId, "stage-a");
    assert.equal(started.state?.status, "active");
    assert.ok((started.state?.checkpoints.length ?? 0) >= 1);

    const advanced = await port.advance({
      instanceId: "inst-1",
      transitionId: "t-ab",
      checkpoint: true,
    });
    assert.equal(advanced.ok, true);
    assert.equal(advanced.state?.currentStageId, "stage-b");

    const blocked = await port.advance({
      instanceId: "inst-1",
      transitionId: "t-bc",
    });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.code, "condition_failed");

    const done = await port.advance({
      instanceId: "inst-1",
      transitionId: "t-bc",
      eventName: "ready",
    });
    assert.equal(done.ok, true);
    assert.equal(done.state?.currentStageId, "stage-c");
    assert.equal(done.state?.status, "completed");

    const state = await port.getState({ instanceId: "inst-1" });
    assert.equal(state.ok, true);
    assert.ok((state.state?.history.length ?? 0) >= 2);
  });

  it("rollback e cancel funcionam estruturalmente", async () => {
    const port = new MockWorkflowAdapter();
    await port.registerWorkflow({ workflow: sampleWorkflow() });
    await port.start({ workflowId: "wf-generic", instanceId: "inst-rb" });
    await port.advance({
      instanceId: "inst-rb",
      transitionId: "t-ab",
      checkpoint: true,
      checkpointLabel: "before-b",
    });

    const mid = await port.getState({ instanceId: "inst-rb" });
    assert.equal(mid.state?.currentStageId, "stage-b");

    // Checkpoint pré-advance captura stage-a; rollback sem id usa o último checkpoint.
    const rb = await port.rollback({ instanceId: "inst-rb" });
    assert.equal(rb.ok, true);
    assert.equal(rb.state?.currentStageId, "stage-a");

    const cancelled = await port.cancel({ instanceId: "inst-rb", message: "stop" });
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.state?.status, "cancelled");

    const noAdvance = await port.advance({
      instanceId: "inst-rb",
      transitionId: "t-ab",
    });
    assert.equal(noAdvance.ok, false);
    assert.equal(noAdvance.code, "terminal_state");
  });

  it("conditions infraestrutura: always/never/event/expression (sem Rule Engine)", () => {
    assert.deepEqual(
      [...WORKFLOW_CONDITION_KINDS],
      ["always", "never", "expression", "event", "metadata", "external"],
    );
    assert.equal(isKnownConditionKind("event"), true);
    assert.equal(isKnownConditionKind("paciente"), false);
    assert.equal(evaluateConditionStructurally(alwaysCondition()), true);
    assert.equal(evaluateConditionStructurally(neverCondition()), false);
    assert.equal(evaluateConditionStructurally(eventCondition("go"), { eventName: "go" }), true);
    assert.equal(evaluateConditionStructurally(eventCondition("go"), { eventName: "no" }), false);
    assert.equal(evaluateConditionStructurally(expressionCondition("x > 0")), true);
  });

  it("conceitos nativos existem; nenhum conceito clínico no Port", () => {
    const port: WorkflowPort = new MockWorkflowAdapter();
    const keys = Object.keys(port).sort();
    assert.ok(!keys.includes("paciente"));
    assert.ok(!keys.includes("guia"));
    assert.ok(!keys.includes("operadora"));
    assert.ok(!keys.includes("contrato"));
    assert.ok(!keys.includes("financeiro"));
    assert.ok(!keys.includes("tiss"));
    assert.ok(!keys.includes("ocr"));
    assert.ok(!keys.includes("autorizacao"));
    assert.ok(!keys.includes("auditoria"));
    assert.ok(!keys.includes("supabase"));

    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.registerWorkflow, "function");
    assert.equal(typeof port.getWorkflow, "function");
    assert.equal(typeof port.listWorkflows, "function");
    assert.equal(typeof port.start, "function");
    assert.equal(typeof port.advance, "function");
    assert.equal(typeof port.rollback, "function");
    assert.equal(typeof port.cancel, "function");
    assert.equal(typeof port.getState, "function");
    assert.equal(typeof port.providerId, "string");

    assert.deepEqual(
      [...WORKFLOW_STATUSES],
      ["draft", "active", "paused", "completed", "cancelled", "failed", "timed_out", "rolled_back"],
    );
  });

  it("Workflow Engine usa apenas ref opaca a Metadata (sem conhecer entidades)", async () => {
    const port = createWorkflowPort({ provider: "mock" });
    await port.registerWorkflow({
      workflow: sampleWorkflow({
        id: "wf-meta",
        name: "MetaLinkedFlow",
        metadataRef: {
          metadataId: "opaque-entity-ref",
          metadataKind: "entity",
          metadataName: "Node",
        },
      }),
    });
    const get = await port.getWorkflow({ id: "wf-meta" });
    assert.equal(get.ok, true);
    assert.equal(get.workflow?.metadataRef?.metadataId, "opaque-entity-ref");
    assert.equal(get.workflow?.metadataRef?.metadataKind, "entity");
    // Engine não interpreta o conteúdo — apenas armazena a ref.
    assert.equal(typeof (get.workflow as { paciente?: unknown })?.paciente, "undefined");
  });

  it("modelo de execução: Stages → Transitions → Conditions → Actions → Events", async () => {
    const port = new MockWorkflowAdapter();
    const wf = sampleWorkflow();
    await port.registerWorkflow({ workflow: wf });

    assert.equal(wf.stages.length, 3);
    assert.equal(wf.transitions[0]?.conditions?.[0]?.kind, "always");
    assert.equal(wf.transitions[0]?.actions?.[0]?.kind, "noop");
    assert.equal(wf.events?.[0]?.name, "ready");

    const start = await port.start({ workflowId: "wf-generic", instanceId: "inst-exec" });
    assert.equal(start.state?.status, "active");

    await port.advance({ instanceId: "inst-exec", toStageId: "stage-b" });
    const state = await port.getState({ instanceId: "inst-exec" });
    assert.equal(state.state?.currentStageId, "stage-b");
    assert.ok(state.state?.history.some((h) => h.kind === "action"));
  });
});
