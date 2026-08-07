/**
 * G-01 — TISS Knowledge Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createCanonicalTissKnowledge,
  createTissEnginePort,
  DefaultTissEngineAdapter,
  G05_TISS_ENTERPRISE_CAPABILITIES,
  MockTissEngineAdapter,
  tissEngineRegistry,
  TissKnowledgeEngine,
} from "../../../src/lib/enterprise/tiss-engine";

describe("G-01 TISS Knowledge — functional cases", () => {
  it("registra conhecimento", async () => {
    const engine = new TissKnowledgeEngine();
    const knowledge = createCanonicalTissKnowledge({
      knowledgeId: "tiss-3.0.0",
      name: "TISS 3.0.0",
      description: "Versão 3.0.0 do TISS",
      version: "3.0.0",
      tags: ["tiss", "version"],
    });
    const result = engine.register({ knowledge });
    assert.equal(result.ok, true);
    assert.equal(result.knowledgeId, "tiss-3.0.0");
    assert.equal(result.knowledge?.name, "TISS 3.0.0");
  });

  it("rejeita knowledge sem id", async () => {
    const engine = new TissKnowledgeEngine();
    const result = engine.register({
      knowledge: { kind: "tiss-knowledge", knowledgeId: "", name: "Name" } as any,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_KNOWLEDGE_MISSING_ID");
  });

  it("rejeita knowledge sem nome", async () => {
    const engine = new TissKnowledgeEngine();
    const result = engine.register({
      knowledge: {
        kind: "tiss-knowledge",
        knowledgeId: "id",
        name: "",
      } as any,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_KNOWLEDGE_MISSING_NAME");
  });

  it("recupera knowledge", async () => {
    const engine = new TissKnowledgeEngine();
    engine.register({
      knowledge: createCanonicalTissKnowledge({ knowledgeId: "tiss-3.0.0", name: "TISS 3.0.0" }),
    });
    const found = engine.get("tiss-3.0.0");
    assert.ok(found);
    assert.equal(found?.knowledgeId, "tiss-3.0.0");
  });

  it("lista conhecimentos", async () => {
    const engine = new TissKnowledgeEngine();
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "a",
        name: "A",
        tags: ["x"],
      }),
    });
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "b",
        name: "B",
        tags: ["y"],
      }),
    });
    const result = engine.listResult();
    assert.equal(result.knowledges.length, 2);
  });

  it("filtra conhecimentos por tag", async () => {
    const engine = new TissKnowledgeEngine();
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "a",
        name: "A",
        tags: ["x"],
      }),
    });
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "b",
        name: "B",
        tags: ["y"],
      }),
    });
    const result = engine.listResult("x");
    assert.equal(result.knowledges.length, 1);
    assert.equal(result.knowledges[0].knowledgeId, "a");
  });

  it("pesquisa conhecimento", async () => {
    const engine = new TissKnowledgeEngine();
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "tiss-3.0.0",
        name: "TISS 3.0.0",
        description: "Padrão TISS",
      }),
    });
    const result = engine.searchResult("padrão");
    assert.equal(result.knowledges.length, 1);
  });

  it("gera estatísticas", async () => {
    const engine = new TissKnowledgeEngine();
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "a",
        name: "A",
        tags: ["x"],
      }),
    });
    engine.register({
      knowledge: createCanonicalTissKnowledge({
        knowledgeId: "b",
        name: "B",
        tags: ["x", "y"],
      }),
    });
    const result = engine.statsResult();
    assert.equal(result.stats.total, 2);
    assert.equal(result.stats.byTag.x, 2);
    assert.equal(result.stats.byTag.y, 1);
  });

  it("DefaultAdapter implementa o Port", async () => {
    const adapter = new DefaultTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G05_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    const identity = adapter.identity();
    assert.equal(identity.id, "enterprise-tiss-engine");
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissKnowledgeOk, true);
  });

  it("MockAdapter implementa o Port", async () => {
    const adapter = new MockTissEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, G05_TISS_ENTERPRISE_CAPABILITIES);
    assert.equal(caps.tissKnowledgeImplemented, true);
    assert.equal(caps.tissLayoutImplemented, true);
    assert.equal(caps.tissParserImplemented, true);
    assert.equal(caps.tissSerializerImplemented, true);
    assert.equal(caps.tissSchemaValidationImplemented, true);
    const identity = adapter.identity();
    assert.equal(identity.id, "enterprise-tiss-engine-mock");
    assert.equal(identity.provider, "mock");
  });

  it("Registry resolve adapters corretamente", () => {
    const a = tissEngineRegistry.resolve("default");
    const b = tissEngineRegistry.resolve("mock");
    assert.ok(a instanceof DefaultTissEngineAdapter);
    assert.ok(b instanceof MockTissEngineAdapter);
  });

  it("Registry sem fallback silencioso", () => {
    assert.throws(() => tissEngineRegistry.resolve("unknown" as any));
  });

  it("createTissEnginePort resolve default", () => {
    const port = createTissEnginePort("default");
    assert.ok(port instanceof DefaultTissEngineAdapter);
  });
});
