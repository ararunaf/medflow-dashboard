/**
 * G-05 — TISS Schema Validation Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissParser,
  createCanonicalTissSchemaValidation,
  createCanonicalTissSerializer,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G07_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissKnowledgeEngine,
  TissLayoutEngine,
  TissParserEngine,
  TissSchemaValidationEngine,
  TissSerializerEngine,
} from "../../../src/lib/enterprise/tiss-engine";

describe("G-05 TISS Schema Validation — functional cases", () => {
  function seedDependencies() {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const parser = new TissParserEngine(knowledge, layout);
    const serializer = new TissSerializerEngine(knowledge, layout, parser);

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

    return { knowledge, layout, parser, serializer };
  }

  it("registra schema validation", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "sp-sadt-schema",
        name: "SP/SADT Schema",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.schemaValidationId, "sp-sadt-schema");
  });

  it("rejeita schema validation sem schemaValidationId", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SCHEMA_VALIDATION_MISSING_ID");
  });

  it("rejeita schema validation sem knowledgeId", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "x",
        name: "X",
        knowledgeId: "",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SCHEMA_VALIDATION_MISSING_KNOWLEDGE_ID");
  });

  it("rejeita schema validation sem layoutId", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SCHEMA_VALIDATION_MISSING_LAYOUT_ID");
  });

  it("rejeita schema validation sem parserId", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SCHEMA_VALIDATION_MISSING_PARSER_ID");
  });

  it("rejeita schema validation sem serializerId", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SCHEMA_VALIDATION_MISSING_SERIALIZER_ID");
  });

  it("consulta schema validation", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
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
    const found = schemaValidation.get("sp-sadt-schema");
    assert.ok(found);
    assert.equal(found?.schemaValidationId, "sp-sadt-schema");
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "sp-sadt-schema",
        name: "SP/SADT Schema",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "sp-sadt-schema",
        name: "SP/SADT Schema",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("reutiliza TissParserEngine", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "sp-sadt-schema",
        name: "SP/SADT Schema",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(parser.get("sp-sadt-3.0.0")?.parserId, "sp-sadt-3.0.0");
  });

  it("reutiliza TissSerializerEngine", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    const result = schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "sp-sadt-schema",
        name: "SP/SADT Schema",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(serializer.get("sp-sadt-serializer")?.serializerId, "sp-sadt-serializer");
  });

  it("gera estatísticas", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
    schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        tags: ["x"],
      }),
    });
    schemaValidation.register({
      schemaValidation: createCanonicalTissSchemaValidation({
        schemaValidationId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        serializerId: "sp-sadt-serializer",
        tags: ["x", "y"],
      }),
    });
    const result = schemaValidation.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
    assert.equal(result.stats.schemaValidationIds.length, 2);
  });

  it("valida schema de documento TISS", () => {
    const { knowledge, layout, parser, serializer } = seedDependencies();
    const schemaValidation = new TissSchemaValidationEngine(knowledge, layout, parser, serializer);
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
    const result = schemaValidation.validate({
      schemaValidationId: "sp-sadt-schema",
      document: `<guiaSP-SADT xmlns="http://www.ans.gov.br/padroes/tiss">
        <cabecalho> valor </cabecalho>
      </guiaSP-SADT>`,
    });
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_SCHEMA_VALIDATION_OK");
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G07_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    assert.equal(caps.tissBusinessValidationImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissSchemaValidationOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G07_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissSchemaValidationImplemented, true);
  });

  it("Registry resolve corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });
});
