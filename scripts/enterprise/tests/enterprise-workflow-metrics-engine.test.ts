/**
 * I-06 — EnterpriseWorkflowMetricsEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
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
    status: "completed",
  });
  return { workflowEngine, pipelineEngine, stateMachineEngine, executionEngine, monitoringEngine };
}

describe("I-06 EnterpriseWorkflowMetricsEngine — functional cases", () => {
  it("registra métrica", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    const result = engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 120,
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "METRIC_REGISTERED");
    assert.equal(result.record?.value, 120);
  });

  it("consulta métrica", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 120,
    });
    assert.equal(engine.find("met-1")?.metricName, "duration");
  });

  it("lista métricas", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 120,
    });
    assert.equal(engine.listAll().length, 1);
  });

  it("agrega estatísticas", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 100,
    });
    engine.register({
      metricId: "met-2",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 200,
    });
    const stats = engine.stats();
    assert.equal(stats.total, 2);
    assert.equal(stats.byWorkflow["wf-1"].sum, 300);
    assert.equal(stats.byWorkflow["wf-1"].avg, 150);
    assert.equal(stats.byPipeline["pl-1"].count, 2);
    assert.equal(stats.byExecution["exec-1"].min, 100);
    assert.equal(stats.byMonitoring["mon-1"].max, 200);
  });

  it("rejeita workflow inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    const result = engine.register({
      metricId: "met-1",
      workflowId: "missing",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 120,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "METRIC_UNKNOWN_WORKFLOW");
  });

  it("rejeita pipeline inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    const result = engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "missing",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 120,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "METRIC_UNKNOWN_PIPELINE");
  });

  it("rejeita execução inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    const result = engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "missing",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 120,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "METRIC_UNKNOWN_EXECUTION");
  });

  it("rejeita monitoramento inexistente", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    const result = engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "missing",
      metricName: "duration",
      value: 120,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "METRIC_UNKNOWN_MONITORING");
  });

  it("indicadores por workflow", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 100,
    });
    const indicator = engine.workflowIndicator("wf-1");
    assert.equal(indicator?.sum, 100);
  });

  it("indicadores por pipeline", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 100,
    });
    const indicator = engine.pipelineIndicator("pl-1");
    assert.equal(indicator?.count, 1);
  });

  it("indicadores por execução", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 100,
    });
    const indicator = engine.executionIndicator("exec-1");
    assert.equal(indicator?.avg, 100);
  });

  it("indicadores por monitoramento", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    engine.register({
      metricId: "met-1",
      workflowId: "wf-1",
      pipelineId: "pl-1",
      executionId: "exec-1",
      monitoringId: "mon-1",
      metricName: "duration",
      value: 100,
    });
    const indicator = engine.monitoringIndicator("mon-1");
    assert.equal(indicator?.max, 100);
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    assert.strictEqual(engine.getWorkflowEngine(), deps.workflowEngine);
  });

  it("reutiliza EnterpriseWorkflowPipelineEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    assert.strictEqual(engine.getPipelineEngine(), deps.pipelineEngine);
  });

  it("reutiliza EnterpriseWorkflowStateMachineEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    assert.strictEqual(engine.getStateMachineEngine(), deps.stateMachineEngine);
  });

  it("reutiliza EnterpriseWorkflowExecutionEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    assert.strictEqual(engine.getExecutionEngine(), deps.executionEngine);
  });

  it("reutiliza EnterpriseWorkflowMonitoringEngine", async () => {
    const deps = setup();
    const engine = new EnterpriseWorkflowMetricsEngine(...Object.values(deps));
    assert.strictEqual(engine.getMonitoringEngine(), deps.monitoringEngine);
  });

  it("apenas workflowMetricsImplemented foi adicionada", async () => {
    const caps = new EnterpriseWorkflowMetricsEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, true);
    assert.equal(caps.workflowExecutionImplemented, true);
    assert.equal(caps.workflowMonitoringImplemented, true);
    assert.equal(caps.workflowMetricsImplemented, true);
    assert.equal(caps.workflowRecoveryImplemented, false);
    assert.equal(caps.workflowFacadeImplemented, false);
  });
});
