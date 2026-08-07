/**
 * F-01 — Integration Registry functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  createIntegrationEnginePort,
  integrationEngineRegistry,
} from "../../../src/lib/enterprise/integration-engine";

const sampleIntegration = (id: string, category?: string) => ({
  kind: "canonical-integration" as const,
  integrationId: id,
  name: `integration ${id}`,
  description: `desc ${id}`,
  category,
  tags: ["demo"],
});

describe("F-01 Integration Registry — functional cases", () => {
  it("registra integração", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegration({
      integration: sampleIntegration("int-1", "category-a"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "INTEGRATION_REGISTRY_REGISTERED");
    assert.equal(result.integrationId, "int-1");
  });

  it("rejeita integração sem integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegration({
      integration: { ...sampleIntegration("", "category-a"), integrationId: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_REGISTRY_INVALID_ID");
  });

  it("rejeita integração sem name", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const result = await adapter.registerIntegration({
      integration: { ...sampleIntegration("int-bad"), name: "" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTEGRATION_REGISTRY_INVALID_NAME");
  });

  it("recupera por integrationId", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-2", "category-a") });
    const found = await adapter.findIntegration({ integrationId: "int-2" });
    assert.ok(found);
    assert.equal(found!.integrationId, "int-2");
  });

  it("lista integrações", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-3", "category-b") });
    await adapter.registerIntegration({ integration: sampleIntegration("int-4", "category-b") });
    const result = await adapter.listIntegrations({});
    assert.equal(result.ok, true);
    assert.equal(result.integrations.length, 2);
    assert.equal(result.total, 2);
  });

  it("lista por categoria", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-5", "category-x") });
    await adapter.registerIntegration({ integration: sampleIntegration("int-6", "category-y") });
    const result = await adapter.listIntegrations({ category: "category-x" });
    assert.equal(result.integrations.length, 1);
    assert.equal(result.integrations[0].integrationId, "int-5");
  });

  it("gera estatísticas", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    await adapter.registerIntegration({ integration: sampleIntegration("int-7", "category-z") });
    await adapter.registerIntegration({ integration: sampleIntegration("int-8", "category-z") });
    const result = await adapter.getIntegrationRegistryStats({});
    assert.equal(result.ok, true);
    assert.equal(result.stats.totalIntegrations, 2);
    assert.equal(result.stats.categories.length, 1);
    assert.equal(result.stats.tags.length, 1);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.equal(caps.integrationRegistryImplemented, true);
    assert.equal(caps.integrationConnectorImplemented, true);
    assert.equal(caps.integrationPipelineImplemented, true);
    assert.equal(caps.integrationEngineImplemented, false);
    const identity = adapter.identity();
    assert.equal(identity.id, "enterprise-integration-engine");
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationRegistryOk, true);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.equal(caps.integrationRegistryImplemented, true);
    assert.equal(caps.integrationConnectorImplemented, true);
    assert.equal(caps.integrationPipelineImplemented, true);
    const identity = adapter.identity();
    assert.equal(identity.id, "enterprise-integration-engine-mock");
    assert.equal(identity.provider, "mock");
  });

  it("Registry resolve default e mock corretamente", () => {
    const list = integrationEngineRegistry.list();
    assert.deepStrictEqual(list, ["default", "mock"]);

    const defaultPort = createIntegrationEnginePort("default");
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createIntegrationEnginePort("mock");
    assert.equal(mockPort.providerId, "mock");
  });

  it("registry não possui fallback silencioso", () => {
    assert.throws(() => createIntegrationEnginePort("unknown" as "default"), /Unknown/);
  });
});
