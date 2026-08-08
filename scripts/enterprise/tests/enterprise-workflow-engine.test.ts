/**
 * I-01 — EnterpriseWorkflowEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  EnterpriseWorkflowEngine,
  I01_WORKFLOW_CAPABILITIES,
} from "../../../src/lib/enterprise/workflow-engine/workflow";
import { GenericTissIntegrationEngine } from "../../../src/lib/enterprise/tiss-integration-engine";

function fixture(workflowId: string, status: "draft" | "active" | "archived" = "draft") {
  return {
    workflowId,
    name: `Workflow ${workflowId}`,
    description: `Description for ${workflowId}`,
    status,
  };
}

describe("I-01 EnterpriseWorkflowEngine — functional cases", () => {
  it("cria um workflow", async () => {
    const engine = new EnterpriseWorkflowEngine();
    const result = engine.create(fixture("wf-1"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "WORKFLOW_CREATED");
    assert.ok(result.workflow);
    assert.equal(result.workflow?.workflowId, "wf-1");
  });

  it("rejeita workflow sem workflowId", async () => {
    const engine = new EnterpriseWorkflowEngine();
    const result = engine.create({ ...fixture("wf-1"), workflowId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_INVALID_ID");
  });

  it("rejeita workflow sem name", async () => {
    const engine = new EnterpriseWorkflowEngine();
    const result = engine.create({ ...fixture("wf-1"), name: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_INVALID_NAME");
  });

  it("rejeita workflow duplicado", async () => {
    const engine = new EnterpriseWorkflowEngine();
    engine.create(fixture("wf-1"));
    const result = engine.create(fixture("wf-1"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_ALREADY_EXISTS");
  });

  it("consulta workflow por id", async () => {
    const engine = new EnterpriseWorkflowEngine();
    engine.create(fixture("wf-1"));
    const found = engine.get("wf-1");
    assert.equal(found?.workflowId, "wf-1");
  });

  it("retorna null para workflow inexistente", async () => {
    const engine = new EnterpriseWorkflowEngine();
    const found = engine.get("wf-2");
    assert.equal(found, null);
  });

  it("lista todos os workflows", async () => {
    const engine = new EnterpriseWorkflowEngine();
    engine.create(fixture("wf-1"));
    engine.create(fixture("wf-2"));
    const all = engine.listAll();
    assert.equal(all.length, 2);
  });

  it("atualiza workflow", async () => {
    const engine = new EnterpriseWorkflowEngine();
    engine.create(fixture("wf-1"));
    const result = engine.update("wf-1", { name: "Updated", status: "active" });
    assert.equal(result.ok, true);
    assert.equal(result.code, "WORKFLOW_UPDATED");
    assert.equal(result.workflow?.name, "Updated");
    assert.equal(result.workflow?.status, "active");
  });

  it("rejeita atualização de workflow inexistente", async () => {
    const engine = new EnterpriseWorkflowEngine();
    const result = engine.update("wf-1", { name: "Updated" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_NOT_FOUND");
  });

  it("remove workflow", async () => {
    const engine = new EnterpriseWorkflowEngine();
    engine.create(fixture("wf-1"));
    const result = engine.remove("wf-1");
    assert.equal(result.ok, true);
    assert.equal(result.code, "WORKFLOW_REMOVED");
    assert.equal(engine.get("wf-1"), null);
  });

  it("rejeita remoção de workflow inexistente", async () => {
    const engine = new EnterpriseWorkflowEngine();
    const result = engine.remove("wf-1");
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_NOT_FOUND");
  });

  it("gera estatísticas por status", async () => {
    const engine = new EnterpriseWorkflowEngine();
    engine.create(fixture("wf-1", "draft"));
    engine.create(fixture("wf-2", "draft"));
    engine.create(fixture("wf-3", "active"));
    const stats = engine.stats();
    assert.equal(stats.total, 3);
    assert.equal(stats.byStatus["draft"], 2);
    assert.equal(stats.byStatus["active"], 1);
  });

  it("somente workflowEngineImplemented está ativa", async () => {
    const caps = I01_WORKFLOW_CAPABILITIES;
    assert.equal(caps.workflowEngineImplemented, true);
    assert.equal(caps.workflowPipelineImplemented, false);
    assert.equal(caps.workflowStateMachineImplemented, false);
    assert.equal(caps.workflowExecutionImplemented, false);
    assert.equal(caps.workflowMonitoringImplemented, false);
    assert.equal(caps.workflowMetricsImplemented, false);
    assert.equal(caps.workflowRecoveryImplemented, false);
    assert.equal(caps.workflowFacadeImplemented, false);
  });

  it("reutiliza exclusivamente GenericTissIntegrationEngine", async () => {
    const tiss = new GenericTissIntegrationEngine();
    const engine = new EnterpriseWorkflowEngine(tiss);
    assert.strictEqual(engine.getTissIntegration(), tiss);
    assert.ok(tiss.communication);
    assert.ok(tiss.submission);
    assert.ok(tiss.audit);
  });
});
