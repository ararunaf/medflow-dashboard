/**
 * I-02 — EnterpriseWorkflowPipelineEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { EnterpriseWorkflowPipelineEngine } from "../../../src/lib/enterprise/workflow-engine/pipeline";
import { EnterpriseWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/workflow";

function workflowFixture(workflowId: string) {
  return {
    workflowId,
    name: `Workflow ${workflowId}`,
    description: `Description for ${workflowId}`,
    status: "draft" as const,
  };
}

function pipelineFixture(pipelineId: string, workflowIds: string[] = []) {
  return {
    pipelineId,
    name: `Pipeline ${pipelineId}`,
    description: `Description for ${pipelineId}`,
    workflowIds,
    stageOrder: ["stage-1"],
  };
}

describe("I-02 EnterpriseWorkflowPipelineEngine — functional cases", () => {
  it("registra um pipeline", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    const result = pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    assert.equal(result.ok, true);
    assert.equal(result.code, "PIPELINE_REGISTERED");
    assert.equal(result.pipeline?.pipelineId, "pl-1");
  });

  it("rejeita pipeline sem pipelineId", async () => {
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine();
    const result = pipelineEngine.register({ ...pipelineFixture("pl-1"), pipelineId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "PIPELINE_INVALID_ID");
  });

  it("rejeita pipeline sem name", async () => {
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine();
    const result = pipelineEngine.register({ ...pipelineFixture("pl-1"), name: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "PIPELINE_INVALID_NAME");
  });

  it("rejeita pipeline duplicado", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    const result = pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    assert.equal(result.ok, false);
    assert.equal(result.code, "PIPELINE_ALREADY_EXISTS");
  });

  it("rejeita pipeline com workflow desconhecido", async () => {
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine();
    const result = pipelineEngine.register(pipelineFixture("pl-1", ["wf-unknown"]));
    assert.equal(result.ok, false);
    assert.equal(result.code, "PIPELINE_UNKNOWN_WORKFLOW");
  });

  it("localiza pipeline por id", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    const found = pipelineEngine.find("pl-1");
    assert.equal(found?.pipelineId, "pl-1");
  });

  it("retorna null para pipeline inexistente", async () => {
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine();
    const found = pipelineEngine.find("pl-1");
    assert.equal(found, null);
  });

  it("lista todos os pipelines", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    workflowEngine.create(workflowFixture("wf-2"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    pipelineEngine.register(pipelineFixture("pl-2", ["wf-2"]));
    const all = pipelineEngine.listAll();
    assert.equal(all.length, 2);
  });

  it("associa workflow a pipeline", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    workflowEngine.create(workflowFixture("wf-2"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    const result = pipelineEngine.associate("pl-1", "wf-2");
    assert.equal(result.ok, true);
    assert.equal(result.code, "PIPELINE_WORKFLOW_ASSOCIATED");
    assert.equal(result.pipeline?.workflowIds.length, 2);
  });

  it("rejeita associação de pipeline inexistente", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    const result = pipelineEngine.associate("pl-1", "wf-1");
    assert.equal(result.ok, false);
    assert.equal(result.code, "PIPELINE_NOT_FOUND");
  });

  it("rejeita associação de workflow inexistente", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    const result = pipelineEngine.associate("pl-1", "wf-unknown");
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_NOT_FOUND");
  });

  it("rejeita associação duplicada", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1"]));
    const result = pipelineEngine.associate("pl-1", "wf-1");
    assert.equal(result.ok, false);
    assert.equal(result.code, "PIPELINE_WORKFLOW_ALREADY_ASSOCIATED");
  });

  it("gera estatísticas básicas", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    workflowEngine.create(workflowFixture("wf-1"));
    workflowEngine.create(workflowFixture("wf-2"));
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    pipelineEngine.register(pipelineFixture("pl-1", ["wf-1", "wf-2"]));
    const stats = pipelineEngine.stats();
    assert.equal(stats.total, 1);
    assert.equal(stats.totalWorkflowAssociations, 2);
    assert.equal(stats.pipelinesPerWorkflow["wf-1"], 1);
    assert.equal(stats.pipelinesPerWorkflow["wf-2"], 1);
  });

  it("workflowEngineImplemented e workflowPipelineImplemented estão ativas", async () => {
    const caps = new EnterpriseWorkflowPipelineEngine().getCapabilities();
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, true);
    assert.equal(caps.workflowStateMachineImplemented, false);
    assert.equal(caps.workflowExecutionImplemented, false);
    assert.equal(caps.workflowMonitoringImplemented, false);
    assert.equal(caps.workflowMetricsImplemented, false);
    assert.equal(caps.workflowRecoveryImplemented, false);
    assert.equal(caps.workflowFacadeImplemented, false);
  });

  it("reutiliza EnterpriseWorkflowEngine", async () => {
    const workflowEngine = new EnterpriseWorkflowEngine();
    const pipelineEngine = new EnterpriseWorkflowPipelineEngine(workflowEngine);
    assert.strictEqual(pipelineEngine.getWorkflowEngine(), workflowEngine);
  });
});
