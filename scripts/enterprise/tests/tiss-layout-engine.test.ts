/**
 * G-02 — TISS Layout Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissKnowledge,
  createCanonicalTissLayout,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G08_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissKnowledgeEngine,
  TissLayoutEngine,
} from "../../../src/lib/enterprise/tiss-engine";

describe("G-02 TISS Layout — functional cases", () => {
  it("registra layout", () => {
    const knowledge = new TissKnowledgeEngine();
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const layout = new TissLayoutEngine(knowledge);
    const result = layout.register(
      createCanonicalTissLayout({
        layoutId: "guias-sp-sadt",
        name: "Guia SP/SADT",
        knowledgeId: "tiss-3.0.0",
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(result.layoutId, "guias-sp-sadt");
  });

  it("rejeita layout sem layoutId", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const result = layout.register(
      createCanonicalTissLayout({
        layoutId: "",
        name: "No Id",
        knowledgeId: "x",
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_LAYOUT_MISSING_ID");
  });

  it("rejeita layout sem nome", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const result = layout.register(
      createCanonicalTissLayout({
        layoutId: "x",
        name: "",
        knowledgeId: "x",
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_LAYOUT_MISSING_NAME");
  });

  it("rejeita layout sem knowledgeId válido", () => {
    const knowledge = new TissKnowledgeEngine();
    const layout = new TissLayoutEngine(knowledge);
    const result = layout.register(
      createCanonicalTissLayout({
        layoutId: "x",
        name: "X",
        knowledgeId: "desconhecido",
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_LAYOUT_UNKNOWN_KNOWLEDGE");
  });

  it("recupera layout", () => {
    const knowledge = new TissKnowledgeEngine();
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const layout = new TissLayoutEngine(knowledge);
    layout.register(
      createCanonicalTissLayout({
        layoutId: "guias-sp-sadt",
        name: "Guia SP/SADT",
        knowledgeId: "tiss-3.0.0",
      }),
    );
    const found = layout.get("guias-sp-sadt");
    assert.ok(found);
    assert.equal(found?.layoutId, "guias-sp-sadt");
  });

  it("lista layouts", () => {
    const knowledge = new TissKnowledgeEngine();
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const layout = new TissLayoutEngine(knowledge);
    layout.register(
      createCanonicalTissLayout({
        layoutId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        tags: ["x"],
      }),
    );
    layout.register(
      createCanonicalTissLayout({
        layoutId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        tags: ["y"],
      }),
    );
    const result = layout.listResult();
    assert.equal(result.layouts.length, 2);
  });

  it("pesquisa layouts", () => {
    const knowledge = new TissKnowledgeEngine();
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const layout = new TissLayoutEngine(knowledge);
    layout.register(
      createCanonicalTissLayout({
        layoutId: "guias-sp-sadt",
        name: "Guia SP/SADT",
        knowledgeId: "tiss-3.0.0",
      }),
    );
    const result = layout.searchResult("sadt");
    assert.equal(result.layouts.length, 1);
  });

  it("gera estatísticas", () => {
    const knowledge = new TissKnowledgeEngine();
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const layout = new TissLayoutEngine(knowledge);
    layout.register(
      createCanonicalTissLayout({
        layoutId: "a",
        name: "A",
        knowledgeId: "tiss-3.0.0",
        tags: ["x"],
      }),
    );
    layout.register(
      createCanonicalTissLayout({
        layoutId: "b",
        name: "B",
        knowledgeId: "tiss-3.0.0",
        tags: ["x", "y"],
      }),
    );
    const result = layout.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
  });

  it("reutiliza TissKnowledgeEngine", () => {
    const knowledge = new TissKnowledgeEngine();
    knowledge.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
      }),
    });
    const layout = new TissLayoutEngine(knowledge);
    const result = layout.register(
      createCanonicalTissLayout({
        layoutId: "x",
        name: "X",
        knowledgeId: "tiss-3.0.0",
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(knowledge.get("tiss-3.0.0")?.knowledgeId, "tiss-3.0.0");
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G08_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    assert.equal(caps.tissBusinessValidationImplemented, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissLayoutOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G08_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    assert.equal(caps.tissBusinessValidationImplemented, true);
  });

  it("Registry resolve corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });

  it("Registry sem fallback silencioso", () => {
    assert.throws(() => tissEngineRegistry.resolve("unknown" as any));
  });
});
