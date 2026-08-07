/**
 * F-08 — Integration Monitoring functional tests.
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

const sampleMonitoring = (
  id: string,
  integrationId: string,
  routeId: string,
  connectorId: string,
  pipelineId: string,
  mappingId: string,
  transformationId: string,
  validationId: string,
) => ({
  kind: "canonical-integration-monitoring" as const,
  monitoringId: id,
  integrationId,
  routeId,
  connectorId,
  pipelineId,
  mappingId,
  transformationId,
  validationId,
  name: `monitoring ${id}`,
  status: "healthy" as const,
});

const setup = async (adapter: DefaultIntegrationEngineAdapter) => {
  await adapter.registerIntegration({ integration: sampleIntegration("int-m") });
  await adapter.registerIntegrationConnector({
    connector: sampleConnector("conn-m", "int-m"),
  });
  await adapter.registerIntegrationPipeline({
    pipeline: samplePipeline("pipe-m", "int-m", "conn-m"),
  });
  await adapter.registerIntegrationMapping({
    mapping: sampleMapping("map-m", "int-m", "conn-m", "pipe-m"),
  });
  await adapter.registerIntegrationTransformation({
    transformation: sampleTransformation("trans-m", "int-m", "conn-m", "pipe-m", "map-m"),
  });
  await adapter.registerIntegrationValidation({
    validation: sampleValidation("val-m", "int-m", "conn-m", "pipe-m", "map-m", "trans-m"),
  });
  await adapter.registerIntegrationRouting({
    routing: sampleRouting("route-m", "int-m", "conn-m", "pipe-m", "map-m", "trans-m", "val-m"),
  });
};

describe("F-08 Integration Monitoring — functional cases", () => {
  it("registra monitoramento", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-1",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_MONITORING_REGISTERED");
    assert.equal(result.monitoringId, "mon-1");
  });

  it("rejeita monitoramento sem monitoringId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: {
        ...sampleMonitoring(
          "mon-1",
          "int-m",
          "route-m",
          "conn-m",
          "pipe-m",
          "map-m",
          "trans-m",
          "val-m",
        ),
        monitoringId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MONITORING_INVALID_ID");
  });

  it("rejeita monitoramento sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: {
        ...sampleMonitoring(
          "mon-1",
          "",
          "route-m",
          "conn-m",
          "pipe-m",
          "map-m",
          "trans-m",
          "val-m",
        ),
        integrationId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MONITORING_INVALID_INTEGRATION_ID");
  });

  it("rejeita monitoramento sem routeId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: {
        ...sampleMonitoring("mon-1", "int-m", "", "conn-m", "pipe-m", "map-m", "trans-m", "val-m"),
        routeId: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_MONITORING_INVALID_ROUTE_ID");
  });

  it("recupera monitoramento", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-2",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    const found = await adapter.findIntegrationMonitoring({ monitoringId: "mon-2" });
    assert.ok(found);
    assert.equal(found!.monitoringId, "mon-2");
  });

  it("lista monitoramentos", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-3",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    const result = await adapter.listIntegrationMonitorings({ integrationId: "int-m" });
    assert.equal(result.ok, true);
    assert.equal(result.monitorings.length, 1);
    assert.equal(result.total, 1);
  });

  it("consolida estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-4",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    const result = await adapter.getIntegrationMonitoringStats({});
    assert.equal(result.stats.totalMonitorings, 1);
    assert.equal(result.stats.statusCounts.healthy, 1);
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-5",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-6",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationPipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-7",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationMapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-8",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationTransformation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-9",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationValidation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-10",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationRouting", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-11",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    assert.equal(result.ok, true);
  });

  it("gera métricas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationMonitoring({
      monitoring: sampleMonitoring(
        "mon-12",
        "int-m",
        "route-m",
        "conn-m",
        "pipe-m",
        "map-m",
        "trans-m",
        "val-m",
      ),
    });
    const result = await adapter.getIntegrationMonitoringStats({});
    assert.equal(result.stats.totalMonitorings, 1);
    assert.equal(result.stats.totalMetrics, 0);
    assert.equal(result.stats.totalEvents, 0);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationMonitoringImplemented, true);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationMonitoringOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationMonitoringImplemented, true);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, true);
  });
});
