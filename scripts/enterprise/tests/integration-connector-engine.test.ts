/**
 * F-02 — Integration Connector functional tests.
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
  configuration: { host: "generic" },
});

describe("F-02 Integration Connector — functional cases", () => {
  it("registra connector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-1") });
    const result = await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-1", "int-1"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_CONNECTOR_REGISTERED");
    assert.equal(result.connectorId, "conn-1");
  });

  it("rejeita connector sem connectorId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationConnector({
      connector: { ...sampleConnector("conn-bad", ""), connectorId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_CONNECTOR_INVALID_ID");
  });

  it("rejeita connector sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationConnector({
      connector: { ...sampleConnector("conn-bad", ""), integrationId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_CONNECTOR_INVALID_INTEGRATION_ID");
  });

  it("rejeita connector sem name", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationConnector({
      connector: { ...sampleConnector("conn-bad", "int-1"), name: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_CONNECTOR_INVALID_NAME");
  });

  it("rejeita connector com integração inexistente", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-1", "int-missing"),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_CONNECTOR_UNKNOWN_INTEGRATION");
  });

  it("recupera connector", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-2") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-2", "int-2"),
    });
    const found = await adapter.findIntegrationConnector({ connectorId: "conn-2" });
    assert.ok(found);
    assert.equal(found!.connectorId, "conn-2");
  });

  it("valida configuração mínima", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-3") });
    const result = await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-3", "int-3"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.connector!.configuration!.host, "generic");
  });

  it("reutiliza IntegrationRegistry", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-4") });
    const result = await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-4", "int-4"),
    });
    assert.equal(result.ok, true);
  });

  it("lista connectors por integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-5") });
    await adapter.registerIntegration({ integration: sampleIntegration("int-6") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-5", "int-5"),
    });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-6", "int-6"),
    });
    const result = await adapter.listIntegrationConnectors({ integrationId: "int-5" });
    assert.equal(result.connectors.length, 1);
    assert.equal(result.connectors[0].connectorId, "conn-5");
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-7") });
    await adapter.registerIntegrationConnector({
      connector: sampleConnector("conn-7", "int-7"),
    });
    const result = await adapter.getIntegrationConnectorStats({});
    assert.equal(result.stats.totalConnectors, 1);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F06_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationConnectorImplemented, true);
    assert.equal(caps.integrationPipelineImplemented, true);
    assert.equal(caps.integrationMappingImplemented, true);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F06_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationConnectorImplemented, true);
    assert.equal(caps.integrationPipelineImplemented, true);
    assert.equal(caps.integrationMappingImplemented, true);
    assert.equal(caps.integrationTransformationImplemented, true);
    assert.equal(caps.integrationValidationImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
  });
});
