/**
 * I-03 — EnterpriseWorkflowStateMachineEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { EnterpriseWorkflowStateMachineEngine } from "../../../src/lib/enterprise/workflow-engine/state-machine";
import { EnterpriseWorkflowPipelineEngine } from "../../../src/lib/enterprise/workflow-engine/pipeline";
import { EnterpriseWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/workflow";

function smFixture(
  stateMachineId: string,
  workflowId?: string,
  pipelineId?: string,
): Parameters<EnterpriseWorkflowStateMachineEngine["register"]>[0] {
  return {
    stateMachineId,
    workflowId,
    pipelineId,
    states: [
      { stateId: "draft", name: "Draft" },
      { stateId: "review", name: "Review" },
      { stateId: "approved", name: "Approved" },
    ],
    initialStateId: "draft",
    transitions: [
      { transitionId: "draft-review", from: "draft", to: "review" },
      { transitionId: "review-approved", from: "review", to: "approved" },
    ],
  };
}

describe("I-03 EnterpriseWorkflowStateMachineEngine — functional cases", () => {
  it("registra estados", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    const result = engine.register(smFixture("sm-1"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "STATE_MACHINE_REGISTERED");
    assert.equal(result.stateMachine?.states.length, 3);
  });

  it("registra transições", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    const transitions = engine.listTransitions("sm-1");
    assert.equal(transitions?.length, 2);
    assert.equal(transitions?.[0].transitionId, "draft-review");
  });

  it("valida transições", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    assert.equal(engine.validateTransition("sm-1", "review"), true);
    assert.equal(engine.validateTransition("sm-1", "approved"), false);
  });

  it("rejeita estado inválido", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    const result = engine.register({
      ...smFixture("sm-1"),
      transitions: [{ transitionId: "bad", from: "draft", to: "missing" }],
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "STATE_MACHINE_INVALID_TRANSITION");
  });

  it("rejeita transição inválida", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    const result = engine.transition("sm-1", "approved");
    assert.equal(result.ok, false);
    assert.equal(result.code, "STATE_MACHINE_INVALID_TRANSITION");
  });

  it("consulta estado atual", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    assert.equal(engine.currentState("sm-1"), "draft");
    engine.transition("sm-1", "review");
    assert.equal(engine.currentState("sm-1"), "review");
  });

  it("lista estados", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    const states = engine.listStates("sm-1");
    assert.equal(states?.length, 3);
    assert.equal(states?.[0].stateId, "draft");
  });

  it("lista transições", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    const all = engine.listAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].stateMachineId, "sm-1");
  });

  it("gera estatísticas básicas", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    engine.register(smFixture("sm-1"));
    const stats = engine.stats();
    assert.equal(stats.total, 1);
    assert.equal(stats.totalStates, 3);
    assert.equal(stats.totalTransitions, 2);
  });

  it("apenas workflowStateMachineImplemented está adicionada às true", async () => {
    const caps = new EnterpriseWorkflowStateMachineEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, true);
    assert.equal(caps.workflowExecutionImplemented, false);
    assert.equal(caps.workflowMonitoringImplemented, false);
    assert.equal(caps.workflowMetricsImplemented, false);
    assert.equal(caps.workflowRecoveryImplemented, false);
    assert.equal(caps.workflowFacadeImplemented, false);
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create({ workflowId: "wf-1", name: "WF", description: "d", status: "draft" });
    const smEngine = new EnterpriseWorkflowStateMachineEngine(workflowEngine);
    const result = smEngine.register(smFixture("sm-1", "wf-1"));
    assert.equal(result.ok, true);
    assert.strictEqual(smEngine.getWorkflowEngine(), workflowEngine);
  });

  it("reutiliza EnterpriseWorkflowPipelineEngine", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create({ workflowId: "wf-1", name: "WF", description: "d", status: "draft" });
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register({
      pipelineId: "pl-1",
      name: "PL",
      description: "d",
      workflowIds: ["wf-1"],
      stageOrder: ["stage-1"],
    });
    const smEngine = new EnterpriseWorkflowStateMachineEngine(workflowEngine, pipelineEngine);
    const result = smEngine.register(smFixture("sm-1", "wf-1", "pl-1"));
    assert.equal(result.ok, true);
    assert.strictEqual(smEngine.getPipelineEngine(), pipelineEngine);
  });

  it("rejeita pipeline desconhecido", async () => {
    const engine = new EnterpriseWorkflowStateMachineEngine();
    const result = engine.register(smFixture("sm-1", undefined, "pl-unknown"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "STATE_MACHINE_UNKNOWN_PIPELINE");
  });
});
