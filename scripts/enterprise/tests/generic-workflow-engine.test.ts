/**
 * I-08 — GenericWorkflowEngine facade tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { GenericWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/generic-workflow-engine";
import { EnterpriseWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/workflow";
import { EnterpriseWorkflowPipelineEngine } from "../../../src/lib/enterprise/workflow-engine/pipeline";
import { EnterpriseWorkflowStateMachineEngine } from "../../../src/lib/enterprise/workflow-engine/state-machine";
import { EnterpriseWorkflowExecutionEngine } from "../../../src/lib/enterprise/workflow-engine/execution";
import { EnterpriseWorkflowMonitoringEngine } from "../../../src/lib/enterprise/workflow-engine/monitoring";
import { EnterpriseWorkflowMetricsEngine } from "../../../src/lib/enterprise/workflow-engine/metrics";
import { EnterpriseWorkflowRecoveryEngine } from "../../../src/lib/enterprise/workflow-engine/recovery";

function setup() {
  const workflow = new EnterpriseWorkflowEngine();
  const pipeline = new EnterpriseWorkflowPipelineEngine(workflow);
  const stateMachine = new EnterpriseWorkflowStateMachineEngine(workflow, pipeline);
  const execution = new EnterpriseWorkflowExecutionEngine(workflow, pipeline, stateMachine);
  const monitoring = new EnterpriseWorkflowMonitoringEngine(
    workflow,
    pipeline,
    stateMachine,
    execution,
  );
  const metrics = new EnterpriseWorkflowMetricsEngine(
    workflow,
    pipeline,
    stateMachine,
    execution,
    monitoring,
  );
  const recovery = new EnterpriseWorkflowRecoveryEngine(
    workflow,
    pipeline,
    stateMachine,
    execution,
    monitoring,
    metrics,
  );
  return { workflow, pipeline, stateMachine, execution, monitoring, metrics, recovery };
}

describe("I-08 GenericWorkflowEngine — facade", () => {
  it("constrói fachada com engines por padrão", async () => {
    const facade = new GenericWorkflowEngine();
    assert.ok(facade.workflow);
    assert.ok(facade.pipeline);
    assert.ok(facade.stateMachine);
    assert.ok(facade.execution);
    assert.ok(facade.monitoring);
    assert.ok(facade.metrics);
    assert.ok(facade.recovery);
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.workflow, deps.workflow);
  });

  it("reutiliza EnterpriseWorkflowPipelineEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.pipeline, deps.pipeline);
  });

  it("reutiliza EnterpriseWorkflowStateMachineEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.stateMachine, deps.stateMachine);
  });

  it("reutiliza EnterpriseWorkflowExecutionEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.execution, deps.execution);
  });

  it("reutiliza EnterpriseWorkflowMonitoringEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.monitoring, deps.monitoring);
  });

  it("reutiliza EnterpriseWorkflowMetricsEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.metrics, deps.metrics);
  });

  it("reutiliza EnterpriseWorkflowRecoveryEngine", async () => {
    const deps = setup();
    const facade = new GenericWorkflowEngine(...Object.values(deps));
    assert.strictEqual(facade.recovery, deps.recovery);
  });

  it("getCapabilities retorna todas as flags TRUE", async () => {
    const caps = new GenericWorkflowEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, true);
    assert.equal(caps.workflowExecutionImplemented, true);
    assert.equal(caps.workflowMonitoringImplemented, true);
    assert.equal(caps.workflowMetricsImplemented, true);
    assert.equal(caps.workflowRecoveryImplemented, true);
    assert.equal(caps.workflowFacadeImplemented, true);
  });

  it("fachada é pura e não implementa métodos de negócio", async () => {
    const keys = Object.getOwnPropertyNames(GenericWorkflowEngine.prototype);
    assert.ok(keys.includes("getCapabilities"));
    assert.ok(!keys.includes("execute"));
    assert.ok(!keys.includes("register"));
    assert.ok(!keys.includes("recover"));
    assert.ok(!keys.includes("monitor"));
  });
});
