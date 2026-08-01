#!/usr/bin/env node
/**
 * EPC-20 — TISS Vocabulary Foundation
 * Prova Application → TISSVocabularyPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TISS_VOCABULARY_ADAPTER_ID,
  DEFAULT_TISS_VOCABULARY_STORE_ID,
  DefaultTISSVocabularyAdapter,
  DefaultTISSVocabularyStore,
  MockTISSVocabularyAdapter,
  TISS_CONCEPT_CATEGORIES,
  TISS_FOUNDATION_CONCEPTS,
  TISS_RELATIONSHIP_CHAIN_EXAMPLE,
  createConceptRelationshipId,
  createTISSConceptId,
  createTISSVocabularyFactory,
  createTISSVocabularyPort,
  getTISSVocabularyHealthSummary,
  resetConceptRelationshipIdSequence,
  resetTISSConceptIdSequence,
  type ConceptRelationship,
  type TISSConcept,
  type TISSVocabularyPort,
} from "../../../src/lib/enterprise/tiss-vocabulary/index.ts";

describe("EPC-20 TISSVocabularyPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TISSVocabularyPort = new MockTISSVocabularyAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedConceptCount, 0);
    assert.equal(health.storedRelationshipCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterConcept, true);
    assert.equal(caps.supportsGetConcept, true);
    assert.equal(caps.supportsListConcepts, true);
    assert.equal(caps.supportsCanonicalVocabulary, true);
    assert.equal(caps.supportsStructuralRelationships, true);
    assert.equal(caps.supportsFutureTissMapping, true);
    assert.equal(caps.supportsFutureHealthcareModel, true);
    assert.equal(caps.supportsFutureRuleEngine, true);
    assert.equal(caps.supportsFutureWorkflow, true);
    assert.equal(caps.supportsFutureAiAuditor, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.independentOfXmlLayout, true);
    assert.equal(caps.independentOfXmlVersion, true);
    assert.equal(caps.supportsFutureMultiVersionTiss, true);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsTissValidation, false);
    assert.equal(caps.implementsRules, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
  });

  it("DefaultTISSVocabularyAdapter é o default da fundação", async () => {
    const port: TISSVocabularyPort = new DefaultTISSVocabularyAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_TISS_VOCABULARY_ADAPTER_ID);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsTissValidation, false);
    assert.equal(caps.implementsRules, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createTISSVocabularyPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultTISSVocabularyAdapter({
      store: new DefaultTISSVocabularyStore(),
      ping: async () => ({ ok: true, message: "tiss-vocabulary probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "tiss-vocabulary probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultTISSVocabularyAdapter", () => {
    const defaultPort = createTISSVocabularyPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createTISSVocabularyFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createTISSVocabularyPort({ provider: "mock" });
    const summary = await getTISSVocabularyHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });
});

describe("EPC-20 registerConcept / getConcept / listConcepts", () => {
  it("registerConcept persiste conceito canônico no store", async () => {
    resetTISSConceptIdSequence();
    const port = new MockTISSVocabularyAdapter({
      createId: () => "tiss-concept-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const concept: TISSConcept = {
      id: "tiss-concept-fixed-1",
      conceptCode: "TISS.PATIENT",
      canonicalName: "Patient",
      description: "Pessoa física objeto do cuidado",
      category: "patient",
      status: "active",
      version: "1",
      tags: ["foundation"],
      customAttributes: { channel: "tiss-vocabulary-test" },
      metadataReference: { id: "meta-1", namespace: "enterprise.core" },
      configurationReference: { id: "cfg-1", kind: "tiss-vocabulary" },
    };

    const registered = await port.registerConcept({ concept });
    assert.equal(registered.ok, true);
    assert.equal(registered.conceptId, "tiss-concept-fixed-1");
    assert.equal(registered.concept?.category, "patient");
    assert.equal(registered.concept?.createdAt, "2026-07-31T12:00:00.000Z");
    assert.equal(registered.concept?.updatedAt, "2026-07-31T12:00:00.000Z");

    const got = await port.getConcept({ conceptId: "tiss-concept-fixed-1", category: "patient" });
    assert.equal(got.ok, true);
    assert.equal(got.concept?.id, "tiss-concept-fixed-1");
    assert.equal(got.concept?.canonicalName, "Patient");

    const byCode = await port.getConcept({ conceptCode: "TISS.PATIENT" });
    assert.equal(byCode.ok, true);
    assert.equal(byCode.concept?.id, "tiss-concept-fixed-1");

    const listed = await port.listConcepts({ category: "patient", tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.concepts.length, 1);

    const store = (port as MockTISSVocabularyAdapter).getStore();
    assert.equal(store.storeId, DEFAULT_TISS_VOCABULARY_STORE_ID);
    assert.equal(store.conceptCount(), 1);
  });

  it("getConcept retorna not_found para id inexistente", async () => {
    const port = new DefaultTISSVocabularyAdapter();
    const result = await port.getConcept({ conceptId: "missing" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_found");
  });

  it("listConcepts filtra por category / status / tag", async () => {
    const port = new DefaultTISSVocabularyAdapter({
      now: () => "2026-07-31T15:00:00.000Z",
    });

    await port.registerConcept({
      concept: {
        id: "proc-1",
        conceptCode: "TISS.PROCEDURE",
        canonicalName: "Procedure",
        category: "procedure",
        status: "active",
        tags: ["alpha"],
      },
    });
    await port.registerConcept({
      concept: {
        id: "diag-1",
        conceptCode: "TISS.DIAGNOSIS",
        canonicalName: "Diagnosis",
        category: "diagnosis",
        status: "draft",
        tags: ["beta"],
      },
    });

    const procedures = await port.listConcepts({ category: "procedure" });
    assert.equal(procedures.concepts.length, 1);
    assert.equal(procedures.concepts[0]?.category, "procedure");

    const draft = await port.listConcepts({ status: "draft" });
    assert.equal(draft.concepts.length, 1);
    assert.equal(draft.concepts[0]?.id, "diag-1");

    const tagged = await port.listConcepts({ tag: "alpha" });
    assert.equal(tagged.concepts.length, 1);
    assert.equal(tagged.concepts[0]?.id, "proc-1");
  });

  it("registerConcept gera id quando omitido", async () => {
    resetTISSConceptIdSequence();
    const port = new DefaultTISSVocabularyAdapter({
      createId: createTISSConceptId,
      now: () => "2026-07-31T16:00:00.000Z",
    });

    const result = await port.registerConcept({
      concept: {
        id: "",
        conceptCode: "TISS.CLAIM",
        canonicalName: "Claim",
        category: "claim",
      },
    });
    assert.equal(result.ok, true);
    assert.ok(result.conceptId);
    assert.match(result.conceptId!, /^tiss-concept-claim-\d+$/);
  });
});

describe("EPC-20 canonical concept catalog", () => {
  it("define exatamente 16 categorias semânticas", () => {
    assert.equal(TISS_CONCEPT_CATEGORIES.length, 16);
    const expected = [
      "patient",
      "beneficiary",
      "professional",
      "provider",
      "organization",
      "procedure",
      "diagnosis",
      "authorization",
      "attendance",
      "guide",
      "claim",
      "audit",
      "payment",
      "attachment",
      "observation",
      "relationship",
    ];
    assert.deepEqual([...TISS_CONCEPT_CATEGORIES], expected);
  });

  it("define exatamente 16 conceitos canônicos de fundação", () => {
    assert.equal(TISS_FOUNDATION_CONCEPTS.length, 16);
    const categories = TISS_FOUNDATION_CONCEPTS.map((c) => c.category);
    assert.deepEqual(categories, [...TISS_CONCEPT_CATEGORIES]);
  });

  it("todos os conceitos de fundação possuem campos estruturais obrigatórios", async () => {
    const port = new MockTISSVocabularyAdapter({
      now: () => "2026-07-31T18:00:00.000Z",
    });

    for (const sample of TISS_FOUNDATION_CONCEPTS) {
      const created = await port.registerConcept({
        concept: {
          ...sample,
          metadataReference: { id: `meta-${sample.category}` },
          configurationReference: { id: `cfg-${sample.category}` },
          customAttributes: { foundation: true },
        },
      });
      assert.equal(created.ok, true);
      assert.ok(created.concept?.id);
      assert.ok(created.concept?.conceptCode);
      assert.ok(created.concept?.canonicalName);
      assert.ok(created.concept?.category);
      assert.ok(created.concept?.version);
      assert.ok(created.concept?.status);
      assert.ok(created.concept?.metadataReference);
      assert.ok(created.concept?.configurationReference);
      assert.ok(created.concept?.tags);
      assert.ok(created.concept?.customAttributes);
      assert.ok(created.concept?.createdAt);
      assert.ok(created.concept?.updatedAt);
    }

    const listed = await port.listConcepts();
    assert.equal(listed.concepts.length, 16);
  });

  it("cadeia estrutural de relacionamento documentada sem execução", () => {
    assert.deepEqual(
      [...TISS_RELATIONSHIP_CHAIN_EXAMPLE],
      ["procedure", "authorization", "guide", "audit"],
    );
  });

  it("ConceptRelationship é representação estrutural armazenável", () => {
    resetConceptRelationshipIdSequence();
    const store = new DefaultTISSVocabularyStore();
    const relationship: ConceptRelationship = {
      id: createConceptRelationshipId(),
      sourceCategory: "procedure",
      sourceConceptId: "tiss-concept-procedure",
      targetCategory: "authorization",
      targetConceptId: "tiss-concept-authorization",
      relationshipType: "procedure-authorization",
      version: "1",
      status: "active",
      tags: ["structural"],
      customAttributes: { example: true },
      metadataReference: { id: "meta-rel" },
      configurationReference: { id: "cfg-rel" },
      createdAt: "2026-07-31T18:00:00.000Z",
      updatedAt: "2026-07-31T18:00:00.000Z",
    };

    store.setRelationship(relationship);
    assert.equal(store.relationshipCount(), 1);
    assert.equal(
      store.getRelationship(relationship.id)?.relationshipType,
      "procedure-authorization",
    );
  });
});

describe("EPC-20 isolation guarantees", () => {
  it("capabilities declaram ausência de parser / validação / regras / operadora", () => {
    const defaultCaps = new DefaultTISSVocabularyAdapter().capabilities();
    const mockCaps = new MockTISSVocabularyAdapter().capabilities();

    for (const caps of [defaultCaps, mockCaps]) {
      assert.equal(caps.implementsXmlParser, false);
      assert.equal(caps.implementsTissValidation, false);
      assert.equal(caps.implementsRules, false);
      assert.equal(caps.knowsOperatorOrCooperative, false);
      assert.equal(caps.independentOfXmlLayout, true);
      assert.equal(caps.independentOfXmlVersion, true);
    }
  });

  it("fonte do módulo não embute tokens de layout XML / operadora proibidos", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(here, "../../../src/lib/enterprise/tiss-vocabulary");
    const forbidden = [
      /\bguiaSPSADT\b/,
      /\bmensagemTISS\b/,
      /\bparseXml\b/i,
      /\bDOMParser\b/,
      /\bUnimed\b/i,
      /\bHapvida\b/i,
      /\bBradesco\b/i,
      /\bSulAm[eé]rica\b/i,
    ];

    async function walk(dir: string): Promise<string[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await walk(full)));
        } else if (entry.name.endsWith(".ts")) {
          files.push(full);
        }
      }
      return files;
    }

    const files = await walk(root);
    assert.ok(files.length > 0);

    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      const operational = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(operational),
          false,
          `${path.basename(file)} não deve embutir ${pattern} em código operacional`,
        );
      }
    }
  });
});
