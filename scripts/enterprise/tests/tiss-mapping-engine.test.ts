#!/usr/bin/env node
/**
 * EPC-21 — TISS Mapping Foundation
 * Prova Application → TISSMappingPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TISS_MAPPING_ADAPTER_ID,
  DEFAULT_TISS_MAPPING_STORE_ID,
  DefaultTISSMappingAdapter,
  DefaultTISSMappingStore,
  MAPPING_LAYER_CHAIN,
  MAPPING_PIPELINE,
  MockTISSMappingAdapter,
  createCanonicalMappingId,
  createConceptMappingId,
  createFieldMappingId,
  createMappingDefinitionId,
  createMappingRelationshipId,
  createMappingVersionId,
  createTISSMappingFactory,
  createTISSMappingPort,
  getTISSMappingHealthSummary,
  resetAllTISSMappingIdSequences,
  type CanonicalMapping,
  type ConceptMapping,
  type FieldMapping,
  type MappingDefinition,
  type MappingRelationship,
  type MappingVersion,
  type TISSMappingPort,
} from "../../../src/lib/enterprise/tiss-mapping/index.ts";

describe("EPC-21 TISSMappingPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TISSMappingPort = new MockTISSMappingAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedFieldMappingCount, 0);
    assert.equal(health.storedConceptMappingCount, 0);
    assert.equal(health.storedCanonicalMappingCount, 0);
    assert.equal(health.storedDefinitionCount, 0);
    assert.equal(health.storedVersionCount, 0);
    assert.equal(health.storedRelationshipCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterFieldMapping, true);
    assert.equal(caps.supportsRegisterConceptMapping, true);
    assert.equal(caps.supportsRegisterCanonicalMapping, true);
    assert.equal(caps.supportsGetMapping, true);
    assert.equal(caps.supportsListMappings, true);
    assert.equal(caps.supportsVersioning, true);
    assert.equal(caps.supportsAliases, true);
    assert.equal(caps.supportsFallback, true);
    assert.equal(caps.supportsInheritance, true);
    assert.equal(caps.supportsTransformation, true);
    assert.equal(caps.supportsThreeLayerMapping, true);
    assert.equal(caps.supportsDeclarativeMapping, true);
    assert.equal(caps.supportsMultiSource, true);
    assert.equal(caps.supportsMultiVersionTiss, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.supportsFutureApis, true);
    assert.equal(caps.supportsFutureJson, true);
    assert.equal(caps.supportsFutureCsv, true);
    assert.equal(caps.supportsFutureFhir, true);
    assert.equal(caps.supportsFutureDicom, true);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsRules, false);
    assert.equal(caps.implementsRuleEngine, false);
    assert.equal(caps.implementsWorkflow, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.fieldMappingDecoupledFromHealthcareModel, true);
    assert.equal(caps.conceptMappingUsesVocabularyOnly, true);
    assert.equal(caps.canonicalMappingProducesHealthcareModelOnly, true);
  });

  it("DefaultTISSMappingAdapter é o default da fundação", async () => {
    const port: TISSMappingPort = new DefaultTISSMappingAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_TISS_MAPPING_ADAPTER_ID);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsRules, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createTISSMappingPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultTISSMappingAdapter({
      store: new DefaultTISSMappingStore(),
      ping: async () => ({ ok: true, message: "tiss-mapping probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "tiss-mapping probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultTISSMappingAdapter", () => {
    const defaultPort = createTISSMappingPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createTISSMappingFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createTISSMappingPort({ provider: "mock" });
    const summary = await getTISSMappingHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });
});

describe("EPC-21 three-layer mapping register / get / list", () => {
  it("registerFieldMapping persiste Field Mapping (origem → Vocabulário)", async () => {
    resetAllTISSMappingIdSequences();
    const port = new MockTISSMappingAdapter({
      createFieldId: () => "tiss-field-map-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const mapping: FieldMapping = {
      id: "tiss-field-map-fixed-1",
      kind: "field",
      sourceField: "campo_001",
      sourcePath: "beneficiario/numero",
      sourceKind: "xml-tiss",
      sourceAlias: "beneficiary_number",
      targetConceptCode: "TISS.BENEFICIARY",
      targetConceptId: "tiss-concept-beneficiary",
      targetConceptName: "Beneficiary",
      status: "active",
      version: "1",
      tags: ["foundation"],
      customAttributes: { channel: "tiss-mapping-test" },
      metadataReference: { id: "meta-1", namespace: "enterprise.core" },
      configurationReference: { id: "cfg-1", kind: "tiss-mapping" },
    };

    const registered = await port.registerFieldMapping({ mapping });
    assert.equal(registered.ok, true);
    assert.equal(registered.mappingId, "tiss-field-map-fixed-1");
    assert.equal(registered.mapping?.targetConceptCode, "TISS.BENEFICIARY");
    assert.equal(registered.mapping?.createdAt, "2026-07-31T12:00:00.000Z");

    const got = await port.getMapping({ mappingId: "tiss-field-map-fixed-1", kind: "field" });
    assert.equal(got.ok, true);
    assert.equal(got.mapping?.kind, "field");
    if (got.mapping?.kind === "field") {
      assert.equal(got.mapping.sourceField, "campo_001");
    }

    const listed = await port.listMappings({
      kind: "field",
      targetConceptCode: "TISS.BENEFICIARY",
      tag: "foundation",
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.mappings.length, 1);

    const store = (port as MockTISSMappingAdapter).getStore();
    assert.equal(store.storeId, DEFAULT_TISS_MAPPING_STORE_ID);
    assert.equal(store.fieldMappingCount(), 1);
  });

  it("registerConceptMapping persiste Concept Mapping (Vocabulário → Healthcare Model)", async () => {
    const port = new DefaultTISSMappingAdapter({
      now: () => "2026-07-31T13:00:00.000Z",
    });

    const mapping: ConceptMapping = {
      id: "tiss-concept-map-1",
      kind: "concept",
      sourceConceptCode: "TISS.PROCEDURE",
      sourceConceptId: "tiss-concept-procedure",
      sourceConceptName: "Procedure",
      targetEntityKind: "procedure",
      targetAttribute: "code",
      status: "active",
      version: "1",
      tags: ["vocabulary-bind"],
    };

    const registered = await port.registerConceptMapping({ mapping });
    assert.equal(registered.ok, true);
    assert.equal(registered.mapping?.targetEntityKind, "procedure");

    const listed = await port.listMappings({
      kind: "concept",
      targetEntityKind: "procedure",
    });
    assert.equal(listed.mappings.length, 1);
    assert.equal(listed.mappings[0]?.kind, "concept");
  });

  it("registerCanonicalMapping persiste Canonical Mapping (Healthcare Model blueprint)", async () => {
    const port = new DefaultTISSMappingAdapter({
      now: () => "2026-07-31T14:00:00.000Z",
    });

    const mapping: CanonicalMapping = {
      id: "tiss-canonical-map-1",
      kind: "canonical",
      targetEntityKind: "beneficiary",
      fieldBindings: [{ conceptCode: "TISS.BENEFICIARY", attributePath: "identifiers.cardNumber" }],
      conceptMappingIds: ["tiss-concept-map-beneficiary"],
      assemblyHint: "beneficiary-from-vocabulary",
      status: "active",
      version: "1",
      tags: ["canonical"],
    };

    const registered = await port.registerCanonicalMapping({ mapping });
    assert.equal(registered.ok, true);
    assert.equal(registered.mapping?.targetEntityKind, "beneficiary");
    assert.equal(registered.mapping?.fieldBindings?.length, 1);

    const got = await port.getMapping({ mappingId: "tiss-canonical-map-1", kind: "canonical" });
    assert.equal(got.ok, true);
    assert.equal(got.mapping?.kind, "canonical");
  });

  it("getMapping retorna not_found para id inexistente", async () => {
    const port = new DefaultTISSMappingAdapter();
    const result = await port.getMapping({ mappingId: "missing" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_found");
  });

  it("listMappings filtra por kind / status / tag / sourceKind", async () => {
    const port = new DefaultTISSMappingAdapter({
      now: () => "2026-07-31T15:00:00.000Z",
    });

    await port.registerFieldMapping({
      mapping: {
        id: "field-xml-1",
        kind: "field",
        sourceField: "campo_010",
        sourceKind: "xml-tiss",
        targetConceptCode: "TISS.PROCEDURE",
        status: "active",
        tags: ["alpha"],
      },
    });
    await port.registerFieldMapping({
      mapping: {
        id: "field-json-1",
        kind: "field",
        sourceField: "procedure.code",
        sourceKind: "json",
        targetConceptCode: "TISS.PROCEDURE",
        status: "draft",
        tags: ["beta"],
      },
    });
    await port.registerConceptMapping({
      mapping: {
        id: "concept-1",
        kind: "concept",
        sourceConceptCode: "TISS.PROCEDURE",
        targetEntityKind: "procedure",
        status: "active",
        tags: ["alpha"],
      },
    });

    const fields = await port.listMappings({ kind: "field" });
    assert.equal(fields.mappings.length, 2);

    const xmlFields = await port.listMappings({ kind: "field", sourceKind: "xml-tiss" });
    assert.equal(xmlFields.mappings.length, 1);
    assert.equal(xmlFields.mappings[0]?.id, "field-xml-1");

    const draft = await port.listMappings({ status: "draft" });
    assert.equal(draft.mappings.length, 1);
    assert.equal(draft.mappings[0]?.id, "field-json-1");

    const tagged = await port.listMappings({ tag: "alpha" });
    assert.equal(tagged.mappings.length, 2);
  });

  it("registerFieldMapping gera id quando omitido", async () => {
    resetAllTISSMappingIdSequences();
    const port = new DefaultTISSMappingAdapter({
      createFieldId: createFieldMappingId,
      now: () => "2026-07-31T16:00:00.000Z",
    });

    const result = await port.registerFieldMapping({
      mapping: {
        id: "",
        kind: "field",
        sourceField: "campo_001",
        targetConceptCode: "TISS.BENEFICIARY",
      },
    });
    assert.equal(result.ok, true);
    assert.ok(result.mappingId);
    assert.match(result.mappingId!, /^tiss-field-map-\d+$/);
  });
});

describe("EPC-21 canonical mapping models", () => {
  it("define cadeia de três camadas Field → Concept → Canonical", () => {
    assert.deepEqual([...MAPPING_LAYER_CHAIN], ["field", "concept", "canonical"]);
  });

  it("define pipeline obrigatório Origem → Mapping → Healthcare Model", () => {
    assert.deepEqual(
      [...MAPPING_PIPELINE],
      ["origem", "field-mapping", "concept-mapping", "canonical-mapping", "healthcare-model"],
    );
  });

  it("MappingDefinition / MappingVersion / MappingRelationship são armazenáveis", () => {
    resetAllTISSMappingIdSequences();
    const store = new DefaultTISSMappingStore();

    const definition: MappingDefinition = {
      id: createMappingDefinitionId(),
      kind: "definition",
      name: "tiss-xml-foundation",
      sourceKind: "xml-tiss",
      mappingVersionLabel: "3.05.00",
      fieldMappingIds: ["field-1"],
      conceptMappingIds: ["concept-1"],
      canonicalMappingIds: ["canonical-1"],
      status: "active",
      version: "1",
      tags: ["foundation"],
    };

    const version: MappingVersion = {
      id: createMappingVersionId(),
      kind: "version",
      mappingDefinitionId: definition.id,
      versionLabel: "3.05.00",
      sourceKind: "xml-tiss",
      isActive: true,
      status: "active",
      version: "1",
    };

    const relationship: MappingRelationship = {
      id: createMappingRelationshipId(),
      sourceKind: "field",
      sourceMappingId: "field-1",
      targetKind: "concept",
      targetMappingId: "concept-1",
      relationshipType: "field-to-concept",
      version: "1",
      status: "active",
      tags: ["structural"],
      customAttributes: { example: true },
      metadataReference: { id: "meta-rel" },
      configurationReference: { id: "cfg-rel" },
      createdAt: "2026-07-31T18:00:00.000Z",
      updatedAt: "2026-07-31T18:00:00.000Z",
    };

    store.setDefinition(definition);
    store.setVersion(version);
    store.setRelationship(relationship);

    assert.equal(store.definitionCount(), 1);
    assert.equal(store.getDefinitionByName("tiss-xml-foundation")?.id, definition.id);
    assert.equal(store.versionCount(), 1);
    assert.equal(store.relationshipCount(), 1);
    assert.equal(store.getRelationship(relationship.id)?.relationshipType, "field-to-concept");
  });

  it("ids gerados seguem prefixos estáveis", () => {
    resetAllTISSMappingIdSequences();
    assert.match(createFieldMappingId(), /^tiss-field-map-1$/);
    assert.match(createConceptMappingId(), /^tiss-concept-map-1$/);
    assert.match(createCanonicalMappingId(), /^tiss-canonical-map-1$/);
    assert.match(createMappingDefinitionId(), /^tiss-map-def-1$/);
    assert.match(createMappingVersionId(), /^tiss-map-ver-1$/);
    assert.match(createMappingRelationshipId(), /^tiss-map-rel-1$/);
  });

  it("getMapping por name resolve MappingDefinition", async () => {
    const store = new DefaultTISSMappingStore();
    store.setDefinition({
      id: "def-1",
      kind: "definition",
      name: "json-api-mapping",
      sourceKind: "json",
      status: "active",
    });
    const port = new DefaultTISSMappingAdapter({ store });
    const got = await port.getMapping({ name: "json-api-mapping", kind: "definition" });
    assert.equal(got.ok, true);
    assert.equal(got.mapping?.kind, "definition");
    if (got.mapping?.kind === "definition") {
      assert.equal(got.mapping.name, "json-api-mapping");
    }
  });
});

describe("EPC-21 isolation guarantees", () => {
  it("capabilities declaram ausência de parser / validação / regras / OCR / AI", () => {
    const defaultCaps = new DefaultTISSMappingAdapter().capabilities();
    const mockCaps = new MockTISSMappingAdapter().capabilities();

    for (const caps of [defaultCaps, mockCaps]) {
      assert.equal(caps.implementsXmlParser, false);
      assert.equal(caps.implementsValidation, false);
      assert.equal(caps.implementsRules, false);
      assert.equal(caps.implementsRuleEngine, false);
      assert.equal(caps.implementsWorkflow, false);
      assert.equal(caps.implementsOcr, false);
      assert.equal(caps.implementsAi, false);
      assert.equal(caps.fieldMappingDecoupledFromHealthcareModel, true);
      assert.equal(caps.conceptMappingUsesVocabularyOnly, true);
      assert.equal(caps.canonicalMappingProducesHealthcareModelOnly, true);
      assert.equal(caps.supportsThreeLayerMapping, true);
      assert.equal(caps.supportsDeclarativeMapping, true);
    }
  });

  it("fonte do módulo não embute parsers / validadores / regras proibidos", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(here, "../../../src/lib/enterprise/tiss-mapping");
    const forbidden = [
      /\bparseXml\b/i,
      /\bDOMParser\b/,
      /\bXMLParser\b/,
      /\bevaluateRule\b/i,
      /\bvalidateTiss\b/i,
      /\brunOcr\b/i,
      /\binvokeAi\b/i,
      /\bUnimed\b/i,
      /\bHapvida\b/i,
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

  it("Field Mapping não referencia Healthcare Model entity kinds como destino", async () => {
    const port = new MockTISSMappingAdapter();
    const registered = await port.registerFieldMapping({
      mapping: {
        id: "field-decoupled",
        kind: "field",
        sourceField: "campo_001",
        targetConceptCode: "TISS.BENEFICIARY",
        targetConceptName: "Beneficiary",
      },
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.mapping?.kind, "field");
    assert.ok(!("targetEntityKind" in (registered.mapping ?? {})));
  });
});
