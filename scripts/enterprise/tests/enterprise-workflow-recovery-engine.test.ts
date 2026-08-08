/**
 * I-07 — EnterpriseWorkflowRecoveryEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { EnterpriseWorkflowRecoveryEngine } from "../../../src/lib/enterprise/workflow-engine/recovery";
import { EnterpriseWorkflowMetricsEngine } from "../../../src/lib/enterprise/workflow-engine/metrics";
import { EnterpriseWorkflowMonitoringEngine } from "../../../src/lib/enterprise/workflow-engine/monitoring";
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
    ],
    initialStateId: "draft",
    transitions: [{ transitionId: "draft-review", from: "draft", to: "review" }],
  });
  const executionEngine = new EnterpriseWorkflowExecutionEngine(
    workflowEngine,
    pipelineEngine,
    stateMachineEngine,
  );
  executionEngine.execute({ executionId: "exec-1", workflowId: "wf-1", targetState: "review" });
  const monitoringEngine = new EnterpriseWorkflowMonitoringEngine(
    workflowEngine,
    pipelineEngine,
    stateMachineEngine,
    executionEngine,
  );
  monitoringEngine.register({
    monitoringId: "mon-1",
    executionId: "exec-1",
    workflowId: "wf-1",
    pipelineId: "pl-1",
    status: "failed",
  });
  const metricsEngine = new EnterpriseWorkflowMetricsEngine(
    workflowEngine,
    pipelineEngine,
    stateMachineEngine,
    executionEngine,
    monitoringEngine,
  );
  return {
    workflowEngine,
    pipelineEngine,
    stateMachineEngine,
    executionEngine,
    monitoringEngine,
    metricsEngine,
  };
}

describe("I-07 EnterpriseWorkflowRecoveryEngine — functional cases", () => {
  it("registra política de recuperação", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    const result = engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "RECOVERY_POLICY_REGISTERED");
  });

  it("consulta política", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    assert.equal(engine.find("pol-1")?.name, "Recovery");
  });

  it("lista políticas", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    assert.equal(engine.listAll().length, 1);
  });

  it("associa workflow à política", async () => {
    const deps = setup();
    deps.workflowEngine.create({
      workflowId: "wf-2",
      name: "WF2",
      description: "d",
      status: "draft",
    });
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    const result = engine.associate("pol-1", "wf-2");
    assert.equal(result.ok, true);
    assert.equal(result.code, "RECOVERY_ASSOCIATED");
  });

  it("recuperação manual", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    const result = engine.manual("act-1", "exec-1");
    assert.equal(result.ok, true);
    assert.equal(result.code, "RECOVERY_ACTION_EXECUTED");
    assert.equal(result.record?.status, "completed");
  });

  it("recuperação automática estrutural", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "auto",
      workflowIds: ["wf-1"],
    });
    const result = engine.automatic("act-1", "exec-1");
    assert.equal(result.ok, true);
    assert.equal(result.code, "RECOVERY_ACTION_EXECUTED");
    assert.equal(result.record?.status, "simulated");
  });

  it("rejeita execução inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    const result = engine.manual("act-1", "missing");
    assert.equal(result.ok, false);
    assert.equal(result.code, "RECOVERY_UNKNOWN_EXECUTION");
  });

  it("rejeita workflow inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    const result = engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["missing"],
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "RECOVERY_UNKNOWN_WORKFLOW");
  });

  it("rejeita sem política", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    const result = engine.manual("act-1", "exec-1");
    assert.equal(result.ok, false);
    assert.equal(result.code, "RECOVERY_NO_POLICY");
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    assert.strictEqual(engine.getWorkflowEngine(), deps.workflowEngine);
  });

  it("reutiliza EnterpriseWorkflowPipelineEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    assert.strictEqual(engine.getPipelineEngine(), deps.pipelineEngine);
  });

  it("reutiliza EnterpriseWorkflowStateMachineEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    assert.strictEqual(engine.getStateMachineEngine(), deps.stateMachineEngine);
  });

  it("reutiliza EnterpriseWorkflowExecutionEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    assert.strictEqual(engine.getExecutionEngine(), deps.executionEngine);
  });

  it("reutiliza EnterpriseWorkflowMonitoringEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    assert.strictEqual(engine.getMonitoringEngine(), deps.monitoringEngine);
  });

  it("reutiliza EnterpriseWorkflowMetricsEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    assert.strictEqual(engine.getMetricsEngine(), deps.metricsEngine);
  });

  it("apenas workflowRecoveryImplemented foi adicionada", async () => {
    const caps = new EnterpriseWorkflowRecoveryEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, true);
    assert.equal(caps.workflowExecutionImplemented, true);
    assert.equal(caps.workflowMonitoringImplemented, true);
    assert.equal(caps.workflowMetricsImplemented, true);
    assert.equal(caps.workflowRecoveryImplemented, true);
    assert.equal(caps.workflowFacadeImplemented, false);
  });

  it("estatísticas", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowRecoveryEngine(...Object.values(deps));
    engine.register({
      policyId: "pol-1",
      name: "Recovery",
      description: "d",
      mode: "manual",
      workflowIds: ["wf-1"],
    });
    engine.manual("act-1", "exec-1");
    const stats = engine.stats();
    assert.equal(stats.totalPolicies, 1);
    assert.equal(stats.totalActions, 1);
    assert.equal(stats.byPolicy["pol-1"], 1);
    assert.equal(stats.byMode.manual, 1);
  });
});
