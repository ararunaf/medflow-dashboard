/**
 * G-09 — TISS Correction Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissBusinessValidation,
  createCanonicalTissCorrection,
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissOperatorValidation,
  createCanonicalTissParser,
  createCanonicalTissRepair,
  createCanonicalTissSchemaValidation,
  createCanonicalTissSerializer,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G09_TISS_ENTERPRISE_CAPABILITIES,
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

function seedDependencies() {
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

  knowledge.register({
    knowledge: createCanonicalTissKnowledge({
      knowledgeId: "tiss-3.0.0",
      name: "TISS 3.0.0",
    }),
  });
  layout.register(
    createCanonicalTissLayout({
      layoutId: "guias-sp-sadt",
      name: "Guia SP/SADT",
      knowledgeId: "tiss-3.0.0",
    }),
  );
  parser.register({
    parser: createCanonicalTissParser({
      parserId: "sp-sadt-3.0.0",
      name: "SP/SADT Parser",
      knowledgeId: "tiss-3.0.0",
      layoutId: "guias-sp-sadt",
    }),
  });
  serializer.register({
    serializer: createCanonicalTissSerializer({
      serializerId: "sp-sadt-serializer",
      name: "SP/SADT Serializer",
      knowledgeId: "tiss-3.0.0",
      layoutId: "guias-sp-sadt",
      parserId: "sp-sadt-3.0.0",
    }),
  });
  schemaValidation.register({
    schemaValidation: createCanonicalTissSchemaValidation({
      schemaValidationId: "sp-sadt-schema",
      name: "SP/SADT Schema",
      knowledgeId: "tiss-3.0.0",
      layoutId: "guias-sp-sadt",
      parserId: "sp-sadt-3.0.0",
      serializerId: "sp-sadt-serializer",
    }),
  });
  businessValidation.register({
    businessValidation: createCanonicalTissBusinessValidation({
      businessValidationId: "sp-sadt-business",
      name: "SP/SADT Business Rule",
      knowledgeId: "tiss-3.0.0",
      layoutId: "guias-sp-sadt",
      parserId: "sp-sadt-3.0.0",
      serializerId: "sp-sadt-serializer",
      schemaValidationId: "sp-sadt-schema",
      rule: { field: "tipoAtendimento", expectedValue: "1" },
    }),
  });
  operatorValidation.register({
    operatorValidation: createCanonicalTissOperatorValidation({
      operatorValidationId: "sp-sadt-operator",
      name: "SP/SADT Operator",
      knowledgeId: "tiss-3.0.0",
      layoutId: "guias-sp-sadt",
      parserId: "sp-sadt-3.0.0",
      serializerId: "sp-sadt-serializer",
      schemaValidationId: "sp-sadt-schema",
      businessValidationId: "sp-sadt-business",
      operatorId: "001",
      rule: { field: "operatorSpecific", expectedValue: "A" },
    }),
  });
  repair.register({
    repair: createCanonicalTissRepair({
      repairId: "sp-sadt-repair",
      name: "SP/SADT Repair",
      knowledgeId: "tiss-3.0.0",
      layoutId: "guias-sp-sadt",
      parserId: "sp-sadt-3.0.0",
      serializerId: "sp-sadt-serializer",
      schemaValidationId: "sp-sadt-schema",
      businessValidationId: "sp-sadt-business",
      operatorValidationId: "sp-sadt-operator",
      rule: { type: "replace", options: { find: "  ", replace: " " } },
    }),
  });

  return {
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
    businessValidation,
    operatorValidation,
    repair,
  };
}

function createCorrection() {
  return createCanonicalTissCorrection({
    correctionId: "sp-sadt-correction",
    name: "SP/SADT Correction",
    knowledgeId: "tiss-3.0.0",
    layoutId: "guias-sp-sadt",
    parserId: "sp-sadt-3.0.0",
    serializerId: "sp-sadt-serializer",
    schemaValidationId: "sp-sadt-schema",
    businessValidationId: "sp-sadt-business",
    operatorValidationId: "sp-sadt-operator",
    repairId: "sp-sadt-repair",
    rule: { type: "replace", options: { find: "foo", replace: "bar" } },
  });
}

describe("G-09 TISS Correction — functional cases", () => {
  it("registra correção", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    const result = correction.register({ correction: createCorrection() });
    assert.equal(result.ok, true);
    assert.equal(result.correctionId, "sp-sadt-correction");
  });

  it("consulta correção", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    const found = correction.get("sp-sadt-correction");
    assert.ok(found);
    assert.equal(found?.correctionId, "sp-sadt-correction");
  });

  it("atualiza correção", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    const result = correction.update({
      correctionId: "sp-sadt-correction",
      correction: { name: "Updated" },
    });
    assert.equal(result.ok, true);
    assert.equal(result.correction?.name, "Updated");
  });

  it("remove correção", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    const result = correction.remove({ correctionId: "sp-sadt-correction" });
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_CORRECTION_REMOVED");
    assert.equal(correction.get("sp-sadt-correction"), null);
  });

  it("rejeita correção sem correctionId", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    const c = createCorrection();
    c.correctionId = "";
    const result = correction.register({ correction: c });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_CORRECTION_MISSING_ID");
  });

  it("rejeita correção com repair inexistente", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    const c = createCorrection();
    c.repairId = "missing";
    const result = correction.register({ correction: c });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_CORRECTION_UNKNOWN_REPAIR");
  });

  it("executa correção replace", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    const document = "<root>  foo  bar</root>";
    const result = correction.correct({ correctionId: "sp-sadt-correction", document });
    assert.equal(result.ok, true);
    assert.equal(result.document, "<root> bar bar</root>");
  });

  it("executa correção prefix", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    const c = createCorrection();
    c.rule = { type: "prefix", options: { value: "<!--OK-->" } };
    correction.register({ correction: c });
    const result = correction.correct({
      correctionId: "sp-sadt-correction",
      document: "<root>x</root>",
    });
    assert.equal(result.ok, true);
    assert.equal(result.document, "<!--OK--><root>x</root>");
  });

  it("rejeita correção com documento inválido", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    const result = correction.correct({ correctionId: "sp-sadt-correction", document: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_CORRECTION_REPAIR_FAILED");
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(deps.knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(deps.layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("reutiliza TissParserEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(deps.parser.get("sp-sadt-3.0.0")?.parserId, "sp-sadt-3.0.0");
  });

  it("reutiliza TissSerializerEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(deps.serializer.get("sp-sadt-serializer")?.serializerId, "sp-sadt-serializer");
  });

  it("reutiliza TissSchemaValidationEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(deps.schemaValidation.get("sp-sadt-schema")?.schemaValidationId, "sp-sadt-schema");
  });

  it("reutiliza TissBusinessValidationEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(
      deps.businessValidation.get("sp-sadt-business")?.businessValidationId,
      "sp-sadt-business",
    );
  });

  it("reutiliza TissOperatorValidationEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(
      deps.operatorValidation.get("sp-sadt-operator")?.operatorValidationId,
      "sp-sadt-operator",
    );
  });

  it("reutiliza TissRepairEngine", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    correction.register({ correction: createCorrection() });
    assert.equal(deps.repair.get("sp-sadt-repair")?.repairId, "sp-sadt-repair");
  });

  it("gera estatísticas", () => {
    const deps = seedDependencies();
    const correction = new TissCorrectionEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
      deps.repair,
    );
    const c1 = createCorrection();
    c1.correctionId = "a";
    c1.tags = ["x"];
    const c2 = createCorrection();
    c2.correctionId = "b";
    c2.tags = ["x", "y"];
    correction.register({ correction: c1 });
    correction.register({ correction: c2 });
    const result = correction.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G09_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissCorrectionImplemented, true);
    assert.equal(caps.tissEngineImplemented, false);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissCorrectionOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G09_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissCorrectionImplemented, true);
    assert.equal(caps.tissEngineImplemented, false);
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
    assert.equal(caps.tissCorrectionImplemented, true);
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
