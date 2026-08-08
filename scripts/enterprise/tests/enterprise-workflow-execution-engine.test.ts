/**
 * I-04 — EnterpriseWorkflowExecutionEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { EnterpriseWorkflowExecutionEngine } from "../../../src/lib/enterprise/workflow-engine/execution";
import { EnterpriseWorkflowStateMachineEngine } from "../../../src/lib/enterprise/workflow-engine/state-machine";
import { EnterpriseWorkflowPipelineEngine } from "../../../src/lib/enterprise/workflow-engine/pipeline";
import { EnterpriseWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/workflow";

function setup() {
  const workflowEngine = new EnterpriseWorkflowEngine();
  workflowEngine.create({
    workflowId: "wf-1",
    name: "WF",
    description: "d",
    status: "draft",
  });
  const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
  pipelineEngine.register({
    pipelineId: "pl-1",
    name: "PL",
    description: "d",
    workflowIds: ["wf-1"],
    stageOrder: ["stage-1"],
  });
  const stateMachineEngine = new EnterpriseWorkflowStateMachineEngine(
    workflowEngine,
    pipelineEngine,
  );
  stateMachineEngine.register({
    stateMachineId: "sm-1",
    workflowId: "wf-1",
    pipelineId: "pl-1",
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
  });
  return { workflowEngine, pipelineEngine, stateMachineEngine };
}

describe("I-04 EnterpriseWorkflowExecutionEngine — functional cases", () => {
  it("executa workflow válido", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    const result = engine.execute({
      executionId: "exec-1",
      workflowId: "wf-1",
      targetState: "review",
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "EXECUTION_SUCCESS");
    assert.equal(result.record?.fromState, "draft");
    assert.equal(result.record?.toState, "review");
  });

  it("rejeita execução inválida", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    const result = engine.execute({
      executionId: "exec-1",
      workflowId: "wf-1",
      targetState: "approved",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "EXECUTION_INVALID_TRANSITION");
  });

  it("rejeita workflow inexistente", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    const result = engine.execute({
      executionId: "exec-1",
      workflowId: "missing",
      targetState: "review",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "EXECUTION_UNKNOWN_WORKFLOW");
  });

  it("rejeita pipeline inexistente", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    pipelineEngine["pipelines"].delete("pl-1");
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    const result = engine.execute({
      executionId: "exec-1",
      workflowId: "wf-1",
      targetState: "review",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "EXECUTION_UNKNOWN_PIPELINE");
  });

  it("rejeita transição inválida", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    const result = engine.execute({
      executionId: "exec-1",
      workflowId: "wf-1",
      targetState: "missing",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "EXECUTION_INVALID_TRANSITION");
  });

  it("muda corretamente o estado após execução", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    engine.execute({ executionId: "exec-1", workflowId: "wf-1", targetState: "review" });
    assert.equal(stateMachineEngine.currentState("sm-1"), "review");
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    assert.strictEqual(engine.getWorkflowEngine(), workflowEngine);
  });

  it("reutiliza EnterpriseWorkflowPipelineEngine", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    assert.strictEqual(engine.getPipelineEngine(), pipelineEngine);
  });

  it("reutiliza EnterpriseWorkflowStateMachineEngine", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    assert.strictEqual(engine.getStateMachineEngine(), stateMachineEngine);
  });

  it("apenas workflowExecutionImplemented foi adicionada", async () => {
    const caps = new EnterpriseWorkflowExecutionEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, true);
    assert.equal(caps.workflowExecutionImplemented, true);
    assert.equal(caps.workflowMonitoringImplemented, false);
    assert.equal(caps.workflowMetricsImplemented, false);
    assert.equal(caps.workflowRecoveryImplemented, false);
    assert.equal(caps.workflowFacadeImplemented, false);
  });

  it("gera estatísticas básicas", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine } = setup();
    const engine = new EnterpriseWorkflowExecutionEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
    );
    engine.execute({ executionId: "exec-1", workflowId: "wf-1", targetState: "review" });
    const stats = engine.stats();
    assert.equal(stats.total, 1);
    assert.equal(stats.successful, 1);
  });
});
