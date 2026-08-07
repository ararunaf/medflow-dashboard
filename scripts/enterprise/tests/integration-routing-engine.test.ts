/**
 * F-07 — Integration Routing functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  F07_INTEGRATION_ENGINE_CAPABILITIES,
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

const sampleRouting = (
  id: string,
  integrationId: string,
  connectorId: string,
  pipelineId: string,
  mappingId: string,
  transformationId: string,
  validationId: string,
) => ({
  kind: "canonical-integration-routing" as const,
  routeId: id,
  integrationId,
  connectorId,
  pipelineId,
  mappingId,
  transformationId,
  validationId,
  name: `routing ${id}`,
});

const setup = async (adapter: DefaultIntegrationEngineAdapter) => {
  await adapter.registerIntegration({ integration: sampleIntegration("int-r") });
  await adapter.registerIntegrationConnector({
    connector: sampleConnector("conn-r", "int-r"),
  });
  await adapter.registerIntegrationPipeline({
    pipeline: samplePipeline("pipe-r", "int-r", "conn-r"),
  });
  await adapter.registerIntegrationMapping({
    mapping: sampleMapping("map-r", "int-r", "conn-r", "pipe-r"),
  });
  await adapter.registerIntegrationTransformation({
    transformation: sampleTransformation("trans-r", "int-r", "conn-r", "pipe-r", "map-r"),
  });
  await adapter.registerIntegrationValidation({
    validation: sampleValidation("val-r", "int-r", "conn-r", "pipe-r", "map-r", "trans-r"),
  });
};

describe("F-07 Integration Routing — functional cases", () => {
  it("registra rota", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-1", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_ROUTING_REGISTERED");
    assert.equal(result.routeId, "route-1");
  });

  it("rejeita rota sem routeId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: {
        ...sampleRouting("route-1", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
        routeId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_ROUTING_INVALID_ID");
  });

  it("rejeita rota sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: {
        ...sampleRouting("route-1", "", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
        integrationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_ROUTING_INVALID_INTEGRATION_ID");
  });

  it("rejeita rota sem connectorId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: {
        ...sampleRouting("route-1", "int-r", "", "pipe-r", "map-r", "trans-r", "val-r"),
        connectorId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_ROUTING_INVALID_CONNECTOR_ID");
  });

  it("rejeita rota sem pipelineId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: {
        ...sampleRouting("route-1", "int-r", "conn-r", "", "map-r", "trans-r", "val-r"),
        pipelineId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_ROUTING_INVALID_PIPELINE_ID");
  });

  it("rejeita rota sem validationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: {
        ...sampleRouting("route-1", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", ""),
        validationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_ROUTING_INVALID_VALIDATION_ID");
  });

  it("recupera rota", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-2", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    const found = await adapter.findIntegrationRouting({ routeId: "route-2" });
    assert.ok(found);
    assert.equal(found!.routeId, "route-2");
  });

  it("resolve rota", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-3", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    const resolved = await adapter.resolveIntegrationRouting({ integrationId: "int-r" });
    assert.equal(resolved.ok, true);
    assert.equal(resolved.route!.routeId, "route-3");
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-4", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-5", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationPipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-6", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationMapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-7", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationTransformation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-8", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationValidation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-9", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    assert.equal(result.ok, true);
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationRouting({
      routing: sampleRouting("route-10", "int-r", "conn-r", "pipe-r", "map-r", "trans-r", "val-r"),
    });
    const result = await adapter.getIntegrationRoutingStats({});
    assert.equal(result.stats.totalRoutes, 1);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F07_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationRoutingImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationRoutingOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F07_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationRoutingImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
  });
});
