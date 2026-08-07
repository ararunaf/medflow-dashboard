/**
 * G-08 — TISS Repair Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissBusinessValidation,
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissOperatorValidation,
  createCanonicalTissParser,
  createCanonicalTissRepair,
  createCanonicalTissSchemaValidation,
  createCanonicalTissSerializer,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G08_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissBusinessValidationEngine,
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

  return {
    knowledge,
    layout,
    parser,
    serializer,
    schemaValidation,
    businessValidation,
    operatorValidation,
  };
}

function createRepair() {
  return createCanonicalTissRepair({
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
  });
}

describe("G-08 TISS Repair — functional cases", () => {
  it("registra reparo", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    const result = repair.register({ repair: createRepair() });
    assert.equal(result.ok, true);
    assert.equal(result.repairId, "sp-sadt-repair");
  });

  it("consulta reparo", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    const found = repair.get("sp-sadt-repair");
    assert.ok(found);
    assert.equal(found?.repairId, "sp-sadt-repair");
  });

  it("atualiza reparo", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    const result = repair.update({
      repairId: "sp-sadt-repair",
      repair: { name: "Updated" },
    });
    assert.equal(result.ok, true);
    assert.equal(result.repair?.name, "Updated");
  });

  it("remove reparo", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    const result = repair.remove({ repairId: "sp-sadt-repair" });
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_REPAIR_REMOVED");
    assert.equal(repair.get("sp-sadt-repair"), null);
  });

  it("rejeita reparo sem repairId", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    const r = createRepair();
    r.repairId = "";
    const result = repair.register({ repair: r });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_REPAIR_MISSING_ID");
  });

  it("rejeita reparo com operator validation inexistente", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    const r = createRepair();
    r.operatorValidationId = "missing";
    const result = repair.register({ repair: r });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_REPAIR_UNKNOWN_OPERATOR_VALIDATION");
  });

  it("executa reparo replace", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    const document = "<root>  a  b</root>";
    const result = repair.repair({ repairId: "sp-sadt-repair", document });
    assert.equal(result.ok, true);
    assert.equal(result.document, "<root> a b</root>");
  });

  it("executa reparo trim", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    const r = createRepair();
    r.rule = { type: "trim", options: {} };
    repair.register({ repair: r });
    const result = repair.repair({ repairId: "sp-sadt-repair", document: "  <root>x</root>  " });
    assert.equal(result.ok, true);
    assert.equal(result.document, "<root>x</root>");
  });

  it("rejeita reparo com documento inválido", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    const result = repair.repair({ repairId: "sp-sadt-repair", document: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_REPAIR_PARSE_FAILED");
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(deps.knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(deps.layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("reutiliza TissParserEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(deps.parser.get("sp-sadt-3.0.0")?.parserId, "sp-sadt-3.0.0");
  });

  it("reutiliza TissSerializerEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(deps.serializer.get("sp-sadt-serializer")?.serializerId, "sp-sadt-serializer");
  });

  it("reutiliza TissSchemaValidationEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(deps.schemaValidation.get("sp-sadt-schema")?.schemaValidationId, "sp-sadt-schema");
  });

  it("reutiliza TissBusinessValidationEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(
      deps.businessValidation.get("sp-sadt-business")?.businessValidationId,
      "sp-sadt-business",
    );
  });

  it("reutiliza TissOperatorValidationEngine", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    repair.register({ repair: createRepair() });
    assert.equal(
      deps.operatorValidation.get("sp-sadt-operator")?.operatorValidationId,
      "sp-sadt-operator",
    );
  });

  it("gera estatísticas", () => {
    const deps = seedDependencies();
    const repair = new TissRepairEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
      deps.operatorValidation,
    );
    const r1 = createRepair();
    r1.repairId = "a";
    r1.tags = ["x"];
    const r2 = createRepair();
    r2.repairId = "b";
    r2.tags = ["x", "y"];
    repair.register({ repair: r1 });
    repair.register({ repair: r2 });
    const result = repair.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G08_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissRepairImplemented, true);
    assert.equal(caps.tissCorrectionImplemented, false);
    assert.equal(caps.tissEngineImplemented, false);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissRepairOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G08_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissRepairImplemented, true);
    assert.equal(caps.tissCorrectionImplemented, false);
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
    assert.equal(caps.tissRepairImplemented, true);
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
