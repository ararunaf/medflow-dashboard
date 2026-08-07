/**
 * F-10 — Generic Integration Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultIntegrationEngineAdapter,
  MockIntegrationEngineAdapter,
  F10_INTEGRATION_ENGINE_CAPABILITIES,
  IntegrationRegistryEngine,
  IntegrationConnectorEngine,
  IntegrationPipelineEngine,
  IntegrationMappingEngine,
  IntegrationTransformationEngine,
  IntegrationValidationEngine,
  IntegrationRoutingEngine,
  IntegrationMonitoringEngine,
  IntegrationReportEngine,
  GenericIntegrationEngine,
} from "../../../src/lib/enterprise/integration-engine";

describe("F-10 Generic Integration Engine — functional cases", () => {
  it("instancia GenericIntegrationEngine", () => {
    const registry = new IntegrationRegistryEngine();
    const connector = new IntegrationConnectorEngine(registry);
    const pipeline = new IntegrationPipelineEngine(registry, connector);
    const mapping = new IntegrationMappingEngine(registry, connector, pipeline);
    const transformation = new IntegrationTransformationEngine(
      registry,
      connector,
      pipeline,
      mapping,
    );
    const validation = new IntegrationValidationEngine(
      registry,
      connector,
      pipeline,
      mapping,
      transformation,
    );
    const routing = new IntegrationRoutingEngine(
      registry,
      connector,
      pipeline,
      mapping,
      transformation,
      validation,
    );
    const monitoring = new IntegrationMonitoringEngine(
      registry,
      connector,
      pipeline,
      mapping,
      transformation,
      validation,
      routing,
    );
    const report = new IntegrationReportEngine(
      registry,
      connector,
      pipeline,
      mapping,
      transformation,
      validation,
      routing,
      monitoring,
    );
    const generic = new GenericIntegrationEngine(
      registry,
      connector,
      pipeline,
      mapping,
      transformation,
      validation,
      routing,
      monitoring,
      report,
    );
    assert.ok(generic);
    assert.ok(generic.registry);
    assert.ok(generic.connector);
    assert.ok(generic.pipeline);
    assert.ok(generic.mapping);
    assert.ok(generic.transformation);
    assert.ok(generic.validation);
    assert.ok(generic.routing);
    assert.ok(generic.monitoring);
    assert.ok(generic.report);
  });

  it("expõe IntegrationRegistry", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.registry instanceof IntegrationRegistryEngine);
  });

  it("expõe IntegrationConnector", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.connector instanceof IntegrationConnectorEngine);
  });

  it("expõe IntegrationPipeline", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.pipeline instanceof IntegrationPipelineEngine);
  });

  it("expõe IntegrationMapping", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.mapping instanceof IntegrationMappingEngine);
  });

  it("expõe IntegrationTransformation", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.transformation instanceof IntegrationTransformationEngine);
  });

  it("expõe IntegrationValidation", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.validation instanceof IntegrationValidationEngine);
  });

  it("expõe IntegrationRouting", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.routing instanceof IntegrationRoutingEngine);
  });

  it("expõe IntegrationMonitoring", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.monitoring instanceof IntegrationMonitoringEngine);
  });

  it("expõe IntegrationReport", () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic.report instanceof IntegrationReportEngine);
  });

  it("DefaultIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationEngineImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationEngineOk, true);
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic);
  });

  it("MockIntegrationEngineAdapter implementa o Port", async () => {
    const adapter = new MockIntegrationEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, F10_INTEGRATION_ENGINE_CAPABILITIES);
    assert.equal(caps.integrationEngineImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.integrationEngineOk, true);
    const generic = adapter.getGenericIntegrationEngine();
    assert.ok(generic);
  });
});
