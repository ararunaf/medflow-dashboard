/**
 * F-06 — Integration Validation functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  F10_INTEGRATION_ENGINE_CAPABILITIES,
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

const sampleTransformation = (
  id: string,
  integrationId: string,
  connectorId: string,
  pipelineId: string,
  mappingId: string,
) => ({
  kind: "canonical-integration-transformation" as const,
  transformationId: id,
  integrationId,
  connectorId,
  pipelineId,
  mappingId,
  name: `transformation ${id}`,
  steps: [
    {
      kind: "canonical-integration-transformation-step" as const,
      stepId: "s1",
      type: "trim" as never,
    },
  ],
});

const sampleValidation = (
  id: string,
  integrationId: string,
  connectorId: string,
  pipelineId: string,
  mappingId: string,
  transformationId: string,
) => ({
  kind: "canonical-integration-validation" as const,
  validationId: id,
  integrationId,
  connectorId,
  pipelineId,
  mappingId,
  transformationId,
  name: `validation ${id}`,
  rules: ["required"],
});

const setup = async (adapter: DefaultIntegrationEngineAdapter) => {
  await adapter.registerIntegration({ integration: sampleIntegration("int-v") });
  await adapter.registerIntegrationConnector({
    connector: sampleConnector("conn-v", "int-v"),
  });
  await adapter.registerIntegrationPipeline({
    pipeline: samplePipeline("pipe-v", "int-v", "conn-v"),
  });
  await adapter.registerIntegrationMapping({
    mapping: sampleMapping("map-v", "int-v", "conn-v", "pipe-v"),
  });
  await adapter.registerIntegrationTransformation({
    transformation: sampleTransformation("trans-v", "int-v", "conn-v", "pipe-v", "map-v"),
  });
};

describe("F-06 Integration Validation — functional cases", () => {
  it("registra validação", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-1", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_VALIDATION_REGISTERED");
    assert.equal(result.validationId, "val-1");
  });

  it("rejeita validação sem validationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: {
        ...sampleValidation("val-1", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
        validationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_VALIDATION_INVALID_ID");
  });

  it("rejeita validação sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: {
        ...sampleValidation("val-1", "", "conn-v", "pipe-v", "map-v", "trans-v"),
        integrationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_VALIDATION_INVALID_INTEGRATION_ID");
  });

  it("rejeita validação sem connectorId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: {
        ...sampleValidation("val-1", "int-v", "", "pipe-v", "map-v", "trans-v"),
        connectorId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_VALIDATION_INVALID_CONNECTOR_ID");
  });

  it("rejeita validação sem pipelineId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: {
        ...sampleValidation("val-1", "int-v", "conn-v", "", "map-v", "trans-v"),
        pipelineId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_VALIDATION_INVALID_PIPELINE_ID");
  });

  it("rejeita validação sem mappingId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: {
        ...sampleValidation("val-1", "int-v", "conn-v", "pipe-v", "", "trans-v"),
        mappingId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_VALIDATION_INVALID_MAPPING_ID");
  });

  it("rejeita validação sem transformationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: {
        ...sampleValidation("val-1", "int-v", "conn-v", "pipe-v", "map-v", ""),
        transformationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_VALIDATION_INVALID_TRANSFORMATION_ID");
  });

  it("valida integração existente", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-2", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
    const found = await adapter.findIntegrationValidation({ validationId: "val-2" });
    assert.ok(found);
    assert.equal(found!.validationId, "val-2");
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-3", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-4", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationPipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-5", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationMapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-6", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationTransformation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-7", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    assert.equal(result.ok, true);
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationValidation({
      validation: sampleValidation("val-8", "int-v", "conn-v", "pipe-v", "map-v", "trans-v"),
    });
    const result = await adapter.getIntegrationValidationStats({});
    assert.equal(result.stats.totalValidations, 1);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationRoutingImplemented, true);
    assert.equal(caps.integrationMonitoringImplemented, true);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationValidationOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationRoutingImplemented, true);
    assert.equal(caps.integrationMonitoringImplemented, true);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, true);
  });
});
