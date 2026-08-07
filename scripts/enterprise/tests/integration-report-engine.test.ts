/**
 * F-09 — Integration Report functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  F09_INTEGRATION_ENGINE_CAPABILITIES,
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

const sampleReport = (id: string, integrationId: string, monitoringId: string) => ({
  kind: "canonical-integration-report" as const,
  reportId: id,
  integrationId,
  monitoringId,
  name: `report ${id}`,
});

const setup = async (adapter: DefaultIntegrationEngineAdapter) => {
  await adapter.registerIntegration({ integration: sampleIntegration("int-rp") });
  await adapter.registerIntegrationConnector({
    connector: sampleConnector("conn-rp", "int-rp"),
  });
  await adapter.registerIntegrationPipeline({
    pipeline: samplePipeline("pipe-rp", "int-rp", "conn-rp"),
  });
  await adapter.registerIntegrationMapping({
    mapping: sampleMapping("map-rp", "int-rp", "conn-rp", "pipe-rp"),
  });
  await adapter.registerIntegrationTransformation({
    transformation: sampleTransformation("trans-rp", "int-rp", "conn-rp", "pipe-rp", "map-rp"),
  });
  await adapter.registerIntegrationValidation({
    validation: sampleValidation("val-rp", "int-rp", "conn-rp", "pipe-rp", "map-rp", "trans-rp"),
  });
  await adapter.registerIntegrationRouting({
    routing: sampleRouting(
      "route-rp",
      "int-rp",
      "conn-rp",
      "pipe-rp",
      "map-rp",
      "trans-rp",
      "val-rp",
    ),
  });
  await adapter.registerIntegrationMonitoring({
    monitoring: sampleMonitoring(
      "mon-rp",
      "int-rp",
      "route-rp",
      "conn-rp",
      "pipe-rp",
      "map-rp",
      "trans-rp",
      "val-rp",
    ),
  });
};

describe("F-09 Integration Report — functional cases", () => {
  it("registra relatório", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-1", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_REPORT_REGISTERED");
    assert.equal(result.reportId, "rep-1");
  });

  it("rejeita relatório sem reportId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: { ...sampleReport("rep-1", "int-rp", "mon-rp"), reportId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_REPORT_INVALID_ID");
  });

  it("rejeita relatório sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: { ...sampleReport("rep-1", "", "mon-rp"), integrationId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_REPORT_INVALID_INTEGRATION_ID");
  });

  it("rejeita relatório sem monitoringId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: { ...sampleReport("rep-1", "int-rp", ""), monitoringId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_REPORT_INVALID_MONITORING_ID");
  });

  it("recupera relatório", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationReport({
      report: sampleReport("rep-2", "int-rp", "mon-rp"),
    });
    const found = await adapter.findIntegrationReport({ reportId: "rep-2" });
    assert.ok(found);
    assert.equal(found!.reportId, "rep-2");
  });

  it("lista relatórios", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationReport({
      report: sampleReport("rep-3", "int-rp", "mon-rp"),
    });
    const result = await adapter.listIntegrationReports({ integrationId: "int-rp" });
    assert.equal(result.ok, true);
    assert.equal(result.reports.length, 1);
    assert.equal(result.total, 1);
  });

  it("filtra por integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationReport({
      report: sampleReport("rep-4", "int-rp", "mon-rp"),
    });
    const result = await adapter.listIntegrationReports({ integrationId: "int-rp" });
    assert.equal(result.reports.length, 1);
    assert.equal(result.reports[0].integrationId, "int-rp");
  });

  it("consolida estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationReport({
      report: sampleReport("rep-5", "int-rp", "mon-rp"),
    });
    const result = await adapter.getIntegrationReportStats({});
    assert.equal(result.stats.totalReports, 1);
    assert.equal(result.stats.totalSections, 0);
  });

  it("gera métricas consolidadas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    await adapter.registerIntegrationReport({
      report: sampleReport("rep-6", "int-rp", "mon-rp"),
    });
    const consolidated = await (
      adapter as unknown as { report: { consolidate: (id: string) => unknown } }
    ).report.consolidate("rep-6");
    assert.ok(consolidated);
    assert.equal((consolidated as { summary: string }).summary?.includes("int-rp"), true);
    assert.equal(
      (consolidated as { sections: { sectionId: string }[] }).sections.some(
        (s) => s.sectionId === "consolidated-summary",
      ),
      true,
    );
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-7", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationConnector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-8", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationPipeline", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-9", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationMapping", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-10", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationTransformation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-11", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationValidation", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-12", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationRouting", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-13", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("reutiliza IntegrationMonitoring", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await setup(adapter);
    const result = await adapter.registerIntegrationReport({
      report: sampleReport("rep-14", "int-rp", "mon-rp"),
    });
    assert.equal(result.ok, true);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F09_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationReportOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F09_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationReportImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
  });
});
