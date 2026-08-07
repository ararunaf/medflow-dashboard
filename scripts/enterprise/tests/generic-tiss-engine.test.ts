/**
 * G-10 — Generic TISS Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G10_TISS_ENTERPRISE_CAPABILITIES,
  GenericTissEngine,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissBusinessValidationEngine,
  TissCorrectionEngine,
  TissKnowledgeEngine,
  TissLayoutEngine,
  TissOperatorValidationEngine,
  TissParserEngine,
  TissRepairEngine,
  TissSchemaValidationEngine,
  TissSerializerEngine,
} from "../../../src/lib/enterprise/tiss-engine";

function createEngines() {
  const knowledge = new TissKnowledgeEngine();
  const layout = new TissLayoutEngine(knowledge);
  const parser = new TissParserEngine(knowledge, layout);
  const serializer = new TissSerializerEngine(knowledge, layout, parser);
  const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
  const businessValidation = new TissBusinessValidationEngine(
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
  );
  const operatorValidation = new TissOperatorValidationEngine(
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
    businessValidation,
  );
  const repair = new TissRepairEngine(
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
    businessValidation,
    operatorValidation,
  );
  const correction = new TissCorrectionEngine(
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
    businessValidation,
    operatorValidation,
    repair,
  );

  return {
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
    businessValidation,
    operatorValidation,
    repair,
    correction,
  };
}

describe("G-10 Generic TISS Engine — functional cases", () => {
  it("constrói fachada com todos os engines", () => {
    const deps = createEngines();
    const generic = new GenericTissEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
      deps.correction,
    );
    assert.ok(generic.knowledge instanceof TissKnowledgeEngine);
    assert.ok(generic.layout instanceof TissLayoutEngine);
    assert.ok(generic.parser instanceof TissParserEngine);
    assert.ok(generic.serializer instanceof TissSerializerEngine);
    assert.ok(generic.schemaValidation instanceof TissSchemaValidationEngine);
    assert.ok(generic.businessValidation instanceof TissBusinessValidationEngine);
    assert.ok(generic.operatorValidation instanceof TissOperatorValidationEngine);
    assert.ok(generic.repair instanceof TissRepairEngine);
    assert.ok(generic.correction instanceof TissCorrectionEngine);
  });

  it("fachada não expõe métodos de negócio", () => {
    const deps = createEngines();
    const generic = new GenericTissEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
      deps.correction,
    );
    const keys = Object.getOwnPropertyNames(GenericTissEngine.prototype).filter(
      (k) => k !== "constructor",
    );
    assert.deepStrictEqual(keys, []);
  });

  it("fachada mantém as mesmas instâncias dos engines", () => {
    const deps = createEngines();
    const generic = new GenericTissEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
      deps.correction,
    );
    assert.strictEqual(generic.knowledge, deps.knowledge);
    assert.strictEqual(generic.correction, deps.correction);
  });

  it("DefaultAdapter implementa o Port e ativa tissEngine", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G10_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissEngineImplemented, true);
    assert.ok(adapter.generic instanceof GenericTissEngine);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissEngineOk, true);
  });

  it("MockAdapter implementa o Port e ativa tissEngine", () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G10_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissEngineImplemented, true);
    assert.ok(adapter.generic instanceof GenericTissEngine);
  });

  it("todas as capabilities do Bloco G estão TRUE", () => {
    const caps = G10_TISS_ENTERPRISE_CAPABILITIES;
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    assert.equal(caps.tissBusinessValidationImplemented, true);
    assert.equal(caps.tissOperatorValidationImplemented, true);
    assert.equal(caps.tissRepairImplemented, true);
    assert.equal(caps.tissCorrectionImplemented, true);
    assert.equal(caps.tissEngineImplemented, true);
  });

  it("Registry resolve corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });

  it("createTissEnginePort resolve default", async () => {
    const port = createTissEnginePort("default");
    const caps = port.getCapabilities();
    assert.equal(caps.tissEngineImplemented, true);
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("não cria lógica própria na fachada", () => {
    const deps = createEngines();
    const generic = new GenericTissEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
      deps.correction,
    );
    assert.equal(Object.keys(generic).length, 9);
    for (const value of Object.values(generic)) {
      assert.ok(value);
    }
  });

  it("DefaultAdapter generic engines são instâncias distintas especializadas", () => {
    const adapter = new DefaultTissEngineAdapter();
    assert.ok(adapter.generic.knowledge instanceof TissKnowledgeEngine);
    assert.ok(adapter.generic.repair instanceof TissRepairEngine);
    assert.ok(adapter.generic.correction instanceof TissCorrectionEngine);
  });
});
