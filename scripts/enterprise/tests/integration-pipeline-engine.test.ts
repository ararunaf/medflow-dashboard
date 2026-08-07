/**
 * F-03 — Integration Pipeline functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  F05_INTEGRATION_ENGINE_CAPABILITIES,
} from "../../../src/lib/enterprise/integration-engine";

const sampleIntegration = (id: string) => ({
  kind: "canonical-integration" as const,
  integrationId: id,
  name: `integration ${id}`,
});

const sampleConnector = (id: string, integrationId: string) => ({
  kind: "canonical-integration-connector" as const,
  connectorId: id,
  integrationId,
  name: `connector ${id}`,
});

const samplePipeline = (id: string, integrationId: string, connectors: string[]) => ({
  kind: "canonical-integration-pipeline" as const,
  pipelineId: id,
  integrationId,
  name: `pipeline ${id}`,
  stages: connectors.map((connectorId, index) => ({
    kind: "canonical-integration-pipeline-stage" as const,
    stageId: `stage-${index + 1}`,
    connectorId,
    name: `stage ${index + 1}`,
    order: index + 1,
  })),
});

describe("F-03 Integration Pipeline — functional cases", () => {
  it("registra pipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p1") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p1", "int-p1"),
    });
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-1", "int-p1", ["conn-p1"]),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_PIPELINE_REGISTERED");
    assert.equal(result.pipelineId, "pipe-1");
  });

  it("rejeita pipeline sem pipelineId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationPipeline({
      pipeline: { ...samplePipeline("pipe-bad", "int-p1", []), pipelineId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_INVALID_ID");
  });

  it("rejeita pipeline sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationPipeline({
      pipeline: { ...samplePipeline("pipe-bad", "", []), integrationId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_INVALID_INTEGRATION_ID");
  });

  it("rejeita pipeline sem name", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationPipeline({
      pipeline: { ...samplePipeline("pipe-bad", "int-p1", []), name: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_INVALID_NAME");
  });

  it("rejeita pipeline com integração inexistente", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-1", "int-missing", []),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_UNKNOWN_INTEGRATION");
  });

  it("rejeita pipeline com conector inexistente", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p2") });
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-2", "int-p2", ["conn-missing"]),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_UNKNOWN_CONNECTOR");
  });

  it("rejeita pipeline com conector de outra integração", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-a") });
    await adapter.registerIntegration({ integration: sampleIntegration("int-b") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-a", "int-a"),
    });
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-3", "int-b", ["conn-a"]),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_CONNECTOR_INTEGRATION_MISMATCH");
  });

  it("recupera pipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p4") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p4", "int-p4"),
    });
    await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-4", "int-p4", ["conn-p4"]),
    });
    const found = await adapter.findIntegrationPipeline({ pipelineId: "pipe-4" });
    assert.ok(found);
    assert.equal(found!.pipelineId, "pipe-4");
  });

  it("valida estrutura do pipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p5") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p5a", "int-p5"),
    });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p5b", "int-p5"),
    });
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-5", "int-p5", ["conn-p5a", "conn-p5b"]),
    });
    assert.equal(result.ok, true);
    assert.equal(result.pipeline!.stages.length, 2);
  });

  it("rejeita stage com stageId duplicado", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p6") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p6", "int-p6"),
    });
    const pipeline = samplePipeline("pipe-6", "int-p6", ["conn-p6", "conn-p6"]);
    const stagesWithDup = [pipeline.stages[0], { ...pipeline.stages[0], stageId: "stage-1" }];
    const result = await adapter.registerIntegrationPipeline({
      pipeline: { ...pipeline, stages: stagesWithDup },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_PIPELINE_DUPLICATE_STAGE_ID");
  });

  it("lista pipelines por integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p7") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p7", "int-p7"),
    });
    await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-7", "int-p7", ["conn-p7"]),
    });
    const result = await adapter.listIntegrationPipelines({ integrationId: "int-p7" });
    assert.equal(result.pipelines.length, 1);
    assert.equal(result.pipelines[0].pipelineId, "pipe-7");
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p8") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p8", "int-p8"),
    });
    await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-8", "int-p8", ["conn-p8"]),
    });
    const result = await adapter.getIntegrationPipelineStats({});
    assert.equal(result.stats.totalPipelines, 1);
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p9") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p9", "int-p9"),
    });
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-9", "int-p9", ["conn-p9"]),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-p10") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-p10", "int-p10"),
    });
    const result = await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-10", "int-p10", ["conn-p10"]),
    });
    assert.equal(result.ok, true);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F05_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationPipelineImplemented, true);
    assert.equal(caps.integrationMappingImplemented, true);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationPipelineOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F05_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationPipelineImplemented, true);
    assert.equal(caps.integrationMappingImplemented, true);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
  });
});
