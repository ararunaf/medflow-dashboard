/**
 * G-04 — TISS Serializer Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissParser,
  createCanonicalTissSerializer,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G07_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissKnowledgeEngine,
  TissLayoutEngine,
  TissParserEngine,
  TissSerializerEngine,
} from "../../../src/lib/enterprise/tiss-engine";

describe("G-04 TISS Serializer — functional cases", () => {
  function seedDependencies() {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const parser = new TissParserEngine(knowledge, layout);

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

    return { knowledge, layout, parser };
  }

  it("registra serializer", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "sp-sadt-serializer",
        name: "SP/SADT Serializer",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.serializerId, "sp-sadt-serializer");
  });

  it("rejeita serializer sem serializerId", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SERIALIZER_MISSING_ID");
  });

  it("rejeita serializer sem conhecimento", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "desconhecido",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SERIALIZER_UNKNOWN_KNOWLEDGE");
  });

  it("rejeita serializer sem layout", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "desconhecido",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SERIALIZER_UNKNOWN_LAYOUT");
  });

  it("rejeita serializer sem parser", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "desconhecido",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SERIALIZER_UNKNOWN_PARSER");
  });

  it("rejeita serializer com parser incoerente", () => {
    const { knowledge, layout, parser } = seedDependencies();
    layout.register(
      createCanonicalTissLayout({
        layoutId: "outro-layout",
        name: "Outro Layout",
        knowledgeId: "tiss-3.0.0",
      }),
    );
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "outro",
        name: "Outro",
        knowledgeId: "tiss-3.0.0",
        layoutId: "outro-layout",
      }),
    });
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "outro",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SERIALIZER_INCOHERENT_PARSER");
  });

  it("recupera serializer", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "sp-sadt-serializer",
        name: "SP/SADT Serializer",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    const found = serializer.get("sp-sadt-serializer");
    assert.ok(found);
    assert.equal(found?.serializerId, "sp-sadt-serializer");
  });

  it("lista serializers", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        tags: ["x"],
      }),
    });
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        tags: ["y"],
      }),
    });
    const result = serializer.listResult();
    assert.equal(result.serializers.length, 2);
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("reutiliza TissParserEngine", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    const result = serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(parser.get("sp-sadt-3.0.0")?.parserId, "sp-sadt-3.0.0");
  });

  it("valida knowledge/layout/parser e serializa", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "sp-sadt-serializer",
        name: "SP/SADT Serializer",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    const parseResult = parser.parse({
      parserId: "sp-sadt-3.0.0",
      document: `<guiaSP-SADT xmlns="http://www.ans.gov.br/padroes/tiss">
        <cabecalho> valor </cabecalho>
      </guiaSP-SADT>`,
    });
    assert.equal(parseResult.ok, true);
    const result = serializer.serialize({
      serializerId: "sp-sadt-serializer",
      result: parseResult.result!,
    });
    assert.equal(result.ok, true);
    assert.ok(result.document);
    assert.ok(result.document?.includes("<guiaSP-SADT"));
    assert.ok(result.document?.includes("</guiaSP-SADT>"));
  });

  it("rejeita serialização com resultado incoerente", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "sp-sadt-serializer",
        name: "SP/SADT Serializer",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
      }),
    });
    const result = serializer.serialize({
      serializerId: "sp-sadt-serializer",
      result: {
        kind: "tiss-parse-result",
        parserId: "outro",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        root: "guiaSP-SADT",
        elements: [],
        raw: "",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SERIALIZER_INCOHERENT_RESULT");
  });

  it("gera estatísticas", () => {
    const { knowledge, layout, parser } = seedDependencies();
    const serializer = new TissSerializerEngine(knowledge, layout, parser);
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        tags: ["x"],
      }),
    });
    serializer.register({
      serializer: createCanonicalTissSerializer({
        serializerId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        parserId: "sp-sadt-3.0.0",
        tags: ["x", "y"],
      }),
    });
    const result = serializer.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
    assert.equal(result.stats.serializerIds.length, 2);
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
    assert.equal(health.tissSerializerOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G07_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissSerializerImplemented, true);
  });

  it("Registry resolve corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });
});
