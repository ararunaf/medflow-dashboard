/**
 * F-04 — Integration Mapping functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  F06_INTEGRATION_ENGINE_CAPABILITIES,
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

const samplePipeline = (id: string, integrationId: string, connectorId: string) => ({
  kind: "canonical-integration-pipeline" as const,
  pipelineId: id,
  integrationId,
  name: `pipeline ${id}`,
  stages: [
    {
      kind: "canonical-integration-pipeline-stage" as const,
      stageId: "stage-1",
      connectorId,
      name: "stage 1",
      order: 1,
    },
  ],
});

const sampleMapping = (
  id: string,
  integrationId: string,
  connectorId: string,
  pipelineId: string,
) => ({
  kind: "canonical-integration-mapping" as const,
  mappingId: id,
  integrationId,
  connectorId,
  pipelineId,
  name: `mapping ${id}`,
  rules: [
    {
      kind: "canonical-integration-mapping-rule" as const,
      ruleId: "rule-1",
      sourcePath: "source.field.a",
      targetPath: "target.field.a",
    },
  ],
});

describe("F-04 Integration Mapping — functional cases", () => {
  const setup = async (adapter: DefaultIntegrationEngineAdapter) => {
    await adapter.registerIntegration({ integration: sampleIntegration("int-m") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-m", "int-m"),
    });
    await adapter.registerIntegrationPipeline({
      pipeline: samplePipeline("pipe-m", "int-m", "conn-m"),
    });
  };

  it("registra mapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-1", "int-m", "conn-m", "pipe-m"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_MAPPING_REGISTERED");
    assert.equal(result.mappingId, "map-1");
  });

  it("rejeita mapping sem mappingId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: { ...sampleMapping("map-bad", "int-m", "conn-m", "pipe-m"), mappingId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MAPPING_INVALID_ID");
  });

  it("rejeita mapping sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: { ...sampleMapping("map-bad", "", "conn-m", "pipe-m"), integrationId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MAPPING_INVALID_INTEGRATION_ID");
  });

  it("rejeita mapping sem connectorId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: { ...sampleMapping("map-bad", "int-m", "", "pipe-m"), connectorId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MAPPING_INVALID_CONNECTOR_ID");
  });

  it("rejeita mapping sem pipelineId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: { ...sampleMapping("map-bad", "int-m", "conn-m", ""), pipelineId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MAPPING_INVALID_PIPELINE_ID");
  });

  it("rejeita mapping inválido com regra duplicada", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const mapping = sampleMapping("map-dup", "int-m", "conn-m", "pipe-m");
    const result = await adapter.registerIntegrationMapping({
      mapping: {
        ...mapping,
        rules: [mapping.rules[0], mapping.rules[0]],
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MAPPING_DUPLICATE_RULE_ID");
  });

  it("recupera mapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-2", "int-m", "conn-m", "pipe-m"),
    });
    const found = await adapter.findIntegrationMapping({ mappingId: "map-2" });
    assert.ok(found);
    assert.equal(found!.mappingId, "map-2");
  });

  it("lista mappings por integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-3", "int-m", "conn-m", "pipe-m"),
    });
    const result = await adapter.listIntegrationMappings({ integrationId: "int-m" });
    assert.equal(result.mappings.length, 1);
    assert.equal(result.mappings[0].mappingId, "map-3");
  });

  it("lista mappings por pipelineId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-4", "int-m", "conn-m", "pipe-m"),
    });
    const result = await adapter.listIntegrationMappings({ pipelineId: "pipe-m" });
    assert.equal(result.mappings.length, 1);
    assert.equal(result.mappings[0].mappingId, "map-4");
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-5", "int-m", "conn-m", "pipe-m"),
    });
    const result = await adapter.getIntegrationMappingStats({});
    assert.equal(result.stats.totalMappings, 1);
  });

  it("reutiliza IntegrationPipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-6", "int-m", "conn-m", "pipe-m"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-7", "int-m", "conn-m", "pipe-m"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMapping({
      mapping: sampleMapping("map-8", "int-m", "conn-m", "pipe-m"),
    });
    assert.equal(result.ok, true);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F06_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationMappingImplemented, true);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationMappingOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F06_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationMappingImplemented, true);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
  });
});
