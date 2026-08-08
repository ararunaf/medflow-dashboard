/**
 * I-05 — EnterpriseWorkflowMonitoringEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
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
  return { workflowEngine, pipelineEngine, stateMachineEngine, executionEngine };
}

describe("I-05 EnterpriseWorkflowMonitoringEngine — functional cases", () => {
  it("registra monitoramento de execução", async () => {
    const { workflowEngine, pipelineEngine, stateMachineEngine, executionEngine } = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(
      workflowEngine,
      pipelineEngine,
      stateMachineEngine,
      executionEngine,
    );
    const result = engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "MONITORING_REGISTERED");
    assert.equal(result.record?.status, "running");
  });

  it("consulta monitoramento", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    const found = engine.find("mon-1");
    assert.equal(found?.monitoringId, "mon-1");
  });

  it("lista monitoramentos", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    assert.equal(engine.listAll().length, 1);
  });

  it("rejeita monitoramento inexistente na busca", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    assert.equal(engine.find("missing"), null);
  });

  it("rejeita workflow inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    const result = engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "missing",
      pipelineId: "pl-1",
      status: "running",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "MONITORING_UNKNOWN_WORKFLOW");
  });

  it("rejeita pipeline inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    const result = engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "missing",
      status: "running",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "MONITORING_UNKNOWN_PIPELINE");
  });

  it("rejeita execução inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    const result = engine.register({
      monitoringId: "mon-1",
      executionId: "missing",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "MONITORING_UNKNOWN_EXECUTION");
  });

  it("acompanha status da execução", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    const updated = engine.trackStatus("mon-1", "completed");
    assert.equal(updated.ok, true);
    assert.equal(updated.record?.status, "completed");
  });

  it("consulta execução monitorada", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    const monitored = engine.getMonitoredExecution("mon-1");
    assert.equal(monitored?.executionId, "exec-1");
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    assert.strictEqual(engine.getWorkflowEngine(), deps.workflowEngine);
  });

  it("reutiliza EnterpriseWorkflowPipelineEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    assert.strictEqual(engine.getPipelineEngine(), deps.pipelineEngine);
  });

  it("reutiliza EnterpriseWorkflowStateMachineEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    assert.strictEqual(engine.getStateMachineEngine(), deps.stateMachineEngine);
  });

  it("reutiliza EnterpriseWorkflowExecutionEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    assert.strictEqual(engine.getExecutionEngine(), deps.executionEngine);
  });

  it("apenas workflowMonitoringImplemented foi adicionada", async () => {
    const caps = new EnterpriseWorkflowMonitoringEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, true);
    assert.equal(caps.workflowExecutionImplemented, true);
    assert.equal(caps.workflowMonitoringImplemented, true);
    assert.equal(caps.workflowMetricsImplemented, false);
    assert.equal(caps.workflowRecoveryImplemented, false);
    assert.equal(caps.workflowFacadeImplemented, false);
  });

  it("gera estatísticas", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMonitoringEngine(...Object.values(deps));
    engine.register({
      monitoringId: "mon-1",
      executionId: "exec-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      status: "running",
    });
    const stats = engine.stats();
    assert.equal(stats.total, 1);
    assert.equal(stats.byStatus.running, 1);
    assert.equal(stats.byWorkflow["wf-1"], 1);
    assert.equal(stats.byPipeline["pl-1"], 1);
  });
});
