/**
 * G-03 — TISS Parser Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createCanonicalTissParser,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G04_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissKnowledgeEngine,
  TissLayoutEngine,
  TissParserEngine,
} from "../../../src/lib/enterprise/tiss-engine";

describe("G-03 TISS Parser — functional cases", () => {
  it("registra parser", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    const result = parser.register({
      parser: createCanonicalTissParser({
        parserId: "sp-sadt-3.0.0",
        name: "SP/SADT Parser",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.parserId, "sp-sadt-3.0.0");
  });

  it("rejeita parser sem parserId", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const parser = new TissParserEngine(knowledge, layout);
    const result = parser.register({
      parser: createCanonicalTissParser({
        parserId: "",
        name: "No Id",
        knowledgeId: "x",
        layoutId: "y",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_PARSER_MISSING_ID");
  });

  it("rejeita parser sem conhecimento", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const parser = new TissParserEngine(knowledge, layout);
    const result = parser.register({
      parser: createCanonicalTissParser({
        parserId: "x",
        name: "X",
        knowledgeId: "desconhecido",
        layoutId: "y",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_PARSER_UNKNOWN_KNOWLEDGE");
  });

  it("rejeita parser sem layout", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const parser = new TissParserEngine(knowledge, layout);
    const result = parser.register({
      parser: createCanonicalTissParser({
        parserId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "desconhecido",
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_PARSER_UNKNOWN_LAYOUT");
  });

  it("recupera parser", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "sp-sadt-3.0.0",
        name: "SP/SADT Parser",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
      }),
    });
    const found = parser.get("sp-sadt-3.0.0");
    assert.ok(found);
    assert.equal(found?.parserId, "sp-sadt-3.0.0");
  });

  it("lista parsers", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        tags: ["x"],
      }),
    });
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        tags: ["y"],
      }),
    });
    const result = parser.listResult();
    assert.equal(result.parsers.length, 2);
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    const result = parser.register({
      parser: createCanonicalTissParser({
        parserId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("reutiliza TissLayoutEngine", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    const result = parser.register({
      parser: createCanonicalTissParser({
        parserId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(layout.get("guias-sp-sadt")?.layoutId, "guias-sp-sadt");
  });

  it("valida knowledge/layout e converte documento", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "sp-sadt-3.0.0",
        name: "SP/SADT Parser",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
      }),
    });
    const result = parser.parse({
      parserId: "sp-sadt-3.0.0",
      document: `<guiaSP-SADT xmlns="http://www.ans.gov.br/padroes/tiss">
        <cabecalho> valor </cabecalho>
      </guiaSP-SADT>`,
    });
    assert.equal(result.ok, true);
    assert.equal(result.result?.root, "guiaSP-SADT");
    assert.equal(result.result?.elements.length, 1);
    assert.equal(result.result?.knowledgeId, "tiss-3.0.0");
    assert.equal(result.result?.layoutId, "guias-sp-sadt");
  });

  it("rejeita documento vazio", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "sp-sadt-3.0.0",
        name: "SP/SADT Parser",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
      }),
    });
    const result = parser.parse({
      parserId: "sp-sadt-3.0.0",
      document: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_PARSER_EMPTY_DOCUMENT");
  });

  it("gera estatísticas", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
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
    const parser = new TissParserEngine(knowledge, layout);
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        tags: ["x"],
      }),
    });
    parser.register({
      parser: createCanonicalTissParser({
        parserId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        layoutId: "guias-sp-sadt",
        tags: ["x", "y"],
      }),
    });
    const result = parser.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
    assert.equal(result.stats.parserIds.length, 2);
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G04_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissParserOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G04_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
  });

  it("Registry resolve corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });
});
