/**
 * G-07 — TISS Operator Validation Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissBusinessValidation,
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissOperatorValidation,
  createCanonicalTissParser,
  createCanonicalTissSchemaValidation,
  createCanonicalTissSerializer,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G10_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissBusinessValidationEngine,
  TissKnowledgeEngine,
  TissLayoutEngine,
  TissOperatorValidationEngine,
  TissParserEngine,
  TissSchemaValidationEngine,
  TissSerializerEngine,
} from "../../../src/lib/enterprise/tiss-engine";

const sampleDocument =
  '<ans:guiaTiSSTag xmlns:ans="http://www.ans.gov.br/padroes/tiss"><ans:cabecalho>1</ans:cabecalho></ans:guiaTiSSTag>';

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

  return { knowledge, layout, parser, serializer, schemaValidation, businessValidation };
}

describe("G-07 TISS Operator Validation — functional cases", () => {
  it("cria validação de operadora", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    const result = operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-001",
        name: "Operadora 001",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "operatorSpecific", expectedValue: "X" },
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.operatorValidationId, "op-001");
  });

  it("consulta validação de operadora", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-002",
        name: "Operadora 002",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "002",
        rule: { field: "operatorSpecific", expectedValue: "Y" },
      }),
    });
    const found = operatorValidation.get("op-002");
    assert.ok(found);
    assert.equal(found?.operatorValidationId, "op-002");
  });

  it("lista validações de operadora", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-003",
        name: "Operadora 003",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "003",
        rule: { field: "operatorSpecific", expectedValue: "Z" },
        tags: ["tag-a"],
      }),
    });
    const result = operatorValidation.listResult("tag-a");
    assert.equal(result.ok, true);
    assert.equal(result.operatorValidations.length, 1);
  });

  it("remove validação de operadora", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-remove",
        name: "To remove",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "rm",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    const removed = operatorValidation.remove({ operatorValidationId: "op-remove" });
    assert.equal(removed.ok, true);
    assert.equal(removed.code, "TISS_OPERATOR_VALIDATION_REMOVED");
    assert.equal(operatorValidation.get("op-remove"), null);
  });

  it("atualiza validação de operadora", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-update",
        name: "Old",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "up",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    const updated = operatorValidation.update({
      operatorValidationId: "op-update",
      operatorValidation: { name: "New" },
    });
    assert.equal(updated.ok, true);
    assert.equal(updated.operatorValidation?.name, "New");
  });

  it("rejeita validação sem operatorValidationId", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    const result = operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_OPERATOR_VALIDATION_MISSING_ID");
  });

  it("rejeita validação sem operatorId", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    const result = operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-no-id",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_OPERATOR_VALIDATION_MISSING_OPERATOR_ID");
  });

  it("rejeita validação sem businessValidationId", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    const result = operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-no-bv",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_OPERATOR_VALIDATION_MISSING_BUSINESS_VALIDATION_ID");
  });

  it("rejeita validação com business validation inexistente", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    const result = operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-unk",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "missing",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_OPERATOR_VALIDATION_UNKNOWN_BUSINESS_VALIDATION");
  });

  it("valida operatorId", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-check",
        name: "Check",
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
    const result = operatorValidation.validate({
      operatorValidationId: "op-check",
      document: sampleDocument,
      operatorId: "002",
      facts: { tipoAtendimento: "1", operatorSpecific: "A" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_OPERATOR_VALIDATION_OPERATOR_ID_MISMATCH");
  });

  it("valida regra de operadora com sucesso", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-ok",
        name: "OK",
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
    const result = operatorValidation.validate({
      operatorValidationId: "op-ok",
      document: sampleDocument,
      operatorId: "001",
      facts: { tipoAtendimento: "1", operatorSpecific: "A" },
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_OPERATOR_VALIDATION_OK");
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-k",
        name: "K",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(deps.knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-l",
        name: "L",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(deps.layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("reutiliza TissParserEngine", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-p",
        name: "P",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(deps.parser.get("sp-sadt-3.0.0")?.parserId, "sp-sadt-3.0.0");
  });

  it("reutiliza TissSerializerEngine", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-s",
        name: "S",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(deps.serializer.get("sp-sadt-serializer")?.serializerId, "sp-sadt-serializer");
  });

  it("reutiliza TissSchemaValidationEngine", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-sc",
        name: "SC",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(deps.schemaValidation.get("sp-sadt-schema")?.schemaValidationId, "sp-sadt-schema");
  });

  it("reutiliza TissBusinessValidationEngine", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-bv",
        name: "BV",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(
      deps.businessValidation.get("sp-sadt-business")?.businessValidationId,
      "sp-sadt-business",
    );
  });

  it("gera estatísticas", () => {
    const deps = seedDependencies();
    const operatorValidation = new TissOperatorValidationEngine(
      deps.knowledge,
      deps.layout,
      deps.parser,
      deps.serializer,
      deps.schemaValidation,
      deps.businessValidation,
    );
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-stat-1",
        name: "S1",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "001",
        rule: { field: "x", expectedValue: "y" },
        tags: ["tag-a"],
      }),
    });
    operatorValidation.register({
      operatorValidation: createCanonicalTissOperatorValidation({
        operatorValidationId: "op-stat-2",
        name: "S2",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        businessValidationId: "sp-sadt-business",
        operatorId: "002",
        rule: { field: "x", expectedValue: "y" },
        tags: ["tag-a", "tag-b"],
      }),
    });
    const result = operatorValidation.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag["tag-a"], 2);
    assert.equal(result.stats.byTag["tag-b"], 1);
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G10_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissOperatorValidationImplemented, true);
    assert.equal(caps.tissRepairImplemented, true);
    assert.equal(caps.tissCorrectionImplemented, true);
    assert.equal(caps.tissEngineImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissOperatorValidationOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G10_TISS_ENTERPRISE_CAPABILITIES);
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
    assert.equal(caps.tissOperatorValidationImplemented, true);
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
