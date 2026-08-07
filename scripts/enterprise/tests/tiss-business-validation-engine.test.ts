/**
 * G-06 — TISS Business Validation Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissBusinessValidation,
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissParser,
  createCanonicalTissSchemaValidation,
  createCanonicalTissSerializer,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G09_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissBusinessValidationEngine,
  TissKnowledgeEngine,
  TissLayoutEngine,
  TissParserEngine,
  TissSchemaValidationEngine,
  TissSerializerEngine,
} from "../../../src/lib/enterprise/tiss-engine";

describe("G-06 TISS Business Validation — functional cases", () => {
  function seedDependencies() {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const parser = new TissParserEngine(knowledge, layout);
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);

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

    return { knowledge, layout, parser, serializer, schemaValidation };
  }

  it("registra business validation", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
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
    assert.equal(result.ok, true);
    assert.equal(result.businessValidationId, "sp-sadt-business");
  });

  it("rejeita business validation sem businessValidationId", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BUSINESS_VALIDATION_MISSING_ID");
  });

  it("rejeita business validation sem knowledgeId", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "x",
        name: "X",
        knowledgeId: "",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BUSINESS_VALIDATION_MISSING_KNOWLEDGE_ID");
  });

  it("rejeita business validation sem layoutId", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BUSINESS_VALIDATION_MISSING_LAYOUT_ID");
  });

  it("rejeita business validation sem parserId", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BUSINESS_VALIDATION_MISSING_PARSER_ID");
  });

  it("rejeita business validation sem serializerId", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BUSINESS_VALIDATION_MISSING_SERIALIZER_ID");
  });

  it("rejeita business validation sem schemaValidationId", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "",
        rule: { field: "x", expectedValue: "y" },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BUSINESS_VALIDATION_MISSING_SCHEMA_VALIDATION_ID");
  });

  it("consulta business validation", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
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
    const found = businessValidation.get("sp-sadt-business");
    assert.ok(found);
    assert.equal(found?.businessValidationId, "sp-sadt-business");
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
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
    assert.equal(result.ok, true);
    assert.equal(knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
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
    assert.equal(result.ok, true);
    assert.equal(layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("reutiliza TissParserEngine", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
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
    assert.equal(result.ok, true);
    assert.equal(parser.get("sp-sadt-3.0.0")?.parserId, "sp-sadt-3.0.0");
  });

  it("reutiliza TissSerializerEngine", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
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
    assert.equal(result.ok, true);
    assert.equal(serializer.get("sp-sadt-serializer")?.serializerId, "sp-sadt-serializer");
  });

  it("reutiliza TissSchemaValidationEngine", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    const result = businessValidation.register({
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
    assert.equal(result.ok, true);
    assert.equal(schemaValidation.get("sp-sadt-schema")?.schemaValidationId, "sp-sadt-schema");
  });

  it("gera estatísticas", () => {
    const { knowledge, layout, parser, serializer, schemaValidation } = seedDependencies();
    const businessValidation = new TissBusinessValidationEngine(
      knowledge,
      layout,
      parser,
      serializer,
      schemaValidation,
    );
    businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
        tags: ["x"],
      }),
    });
    businessValidation.register({
      businessValidation: createCanonicalTissBusinessValidation({
        businessValidationId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        schemaValidationId: "sp-sadt-schema",
        rule: { field: "x", expectedValue: "y" },
        tags: ["x", "y"],
      }),
    });
    const result = businessValidation.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
    assert.equal(result.stats.businessValidationIds.length, 2);
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G09_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    assert.equal(caps.tissBusinessValidationImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissBusinessValidationOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G09_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissBusinessValidationImplemented, true);
  });

  it("Registry resolve corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });
});
