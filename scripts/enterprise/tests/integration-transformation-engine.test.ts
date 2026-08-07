/**
 * F-05 — Integration Transformation functional tests.
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
  steps: { stepId: string; type: string; params?: Record<string, unknown> }[],
) => ({
  kind: "canonical-integration-transformation" as const,
  transformationId: id,
  integrationId,
  connectorId,
  pipelineId,
  mappingId,
  name: `transformation ${id}`,
  steps: steps.map((s) => ({
    kind: "canonical-integration-transformation-step" as const,
    stepId: s.stepId,
    type: s.type as never,
    params: s.params,
  })),
});

const setup = async (adapter: DefaultIntegrationEngineAdapter) => {
  await adapter.registerIntegration({ integration: sampleIntegration("int-t") });
  await adapter.registerIntegrationConnector({
    connector: sampleConnector("conn-t", "int-t"),
  });
  await adapter.registerIntegrationPipeline({
    pipeline: samplePipeline("pipe-t", "int-t", "conn-t"),
  });
  await adapter.registerIntegrationMapping({
    mapping: sampleMapping("map-t", "int-t", "conn-t", "pipe-t"),
  });
};

describe("F-05 Integration Transformation — functional cases", () => {
  it("registra transformação", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-1", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_TRANSFORMATION_REGISTERED");
    assert.equal(result.transformationId, "trans-1");
  });

  it("rejeita transformação sem transformationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: {
        ...sampleTransformation("trans-bad", "int-t", "conn-t", "pipe-t", "map-t", [
          { stepId: "s1", type: "trim" },
        ]),
        transformationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_TRANSFORMATION_INVALID_ID");
  });

  it("rejeita transformação sem mappingId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: {
        ...sampleTransformation("trans-bad", "int-t", "conn-t", "pipe-t", "", [
          { stepId: "s1", type: "trim" },
        ]),
        mappingId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_TRANSFORMATION_INVALID_MAPPING_ID");
  });

  it("rejeita transformação inválida", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-bad", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "invalid" as never },
      ]),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_TRANSFORMATION_INVALID_STEP_TYPE");
  });

  it("aplica trim", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-trim", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    const value = adapter.transformation.transform("  hello  ", "trans-trim");
    assert.equal(value, "hello");
  });

  it("aplica uppercase", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-up", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "uppercase" },
      ]),
    });
    const value = adapter.transformation.transform("hello", "trans-up");
    assert.equal(value, "HELLO");
  });

  it("aplica lowercase", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-low", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "lowercase" },
      ]),
    });
    const value = adapter.transformation.transform("HELLO", "trans-low");
    assert.equal(value, "hello");
  });

  it("aplica concat", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-concat", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "concat", params: { suffix: "-tail" } },
      ]),
    });
    const value = adapter.transformation.transform("hello", "trans-concat");
    assert.equal(value, "hello-tail");
  });

  it("aplica replace", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-replace", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "replace", params: { from: "a", to: "o" } },
      ]),
    });
    const value = adapter.transformation.transform("banana", "trans-replace");
    assert.equal(value, "bonono");
  });

  it("aplica cast", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-cast", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "cast", params: { to: "number" } },
      ]),
    });
    const value = adapter.transformation.transform("42", "trans-cast");
    assert.equal(value, 42);
  });

  it("aplica transformação encadeada", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-chain", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
        { stepId: "s2", type: "uppercase" },
      ]),
    });
    const value = adapter.transformation.transform("  hello  ", "trans-chain");
    assert.equal(value, "HELLO");
  });

  it("reutiliza IntegrationMapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-2", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationPipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-3", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-4", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-5", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    assert.equal(result.ok, true);
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationTransformation({
      transformation: sampleTransformation("trans-6", "int-t", "conn-t", "pipe-t", "map-t", [
        { stepId: "s1", type: "trim" },
      ]),
    });
    const result = await adapter.getIntegrationTransformationStats({});
    assert.equal(result.stats.totalTransformations, 1);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationRoutingImplemented, true);
    assert.equal(caps.integrationMonitoringImplemented, true);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationTransformationOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationRoutingImplemented, true);
    assert.equal(caps.integrationMonitoringImplemented, true);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, true);
  });
});
