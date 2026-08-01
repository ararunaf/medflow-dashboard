#!/usr/bin/env node
/**
 * EPC-19 — Canonical Healthcare Model Foundation
 * Prova Application → HealthcareModelPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HEALTHCARE_MODEL_ADAPTER_ID,
  DEFAULT_HEALTHCARE_MODEL_STORE_ID,
  DefaultHealthcareModelAdapter,
  DefaultHealthcareModelStore,
  HEALTHCARE_ENTITY_KINDS,
  HEALTHCARE_RELATIONSHIP_CHAIN_EXAMPLE,
  MockHealthcareModelAdapter,
  createHealthcareEntityId,
  createHealthcareModelFactory,
  createHealthcareModelPort,
  createHealthcareRelationshipId,
  getHealthcareModelHealthSummary,
  resetHealthcareEntityIdSequence,
  resetHealthcareRelationshipIdSequence,
  type HealthcareEntity,
  type HealthcareModelPort,
  type HealthcarePatient,
  type HealthcareRelationship,
} from "../../../src/lib/enterprise/healthcare-model/index.ts";

describe("EPC-19 HealthcareModelPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: HealthcareModelPort = new MockHealthcareModelAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedEntityCount, 0);
    assert.equal(health.storedRelationshipCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateEntity, true);
    assert.equal(caps.supportsGetEntity, true);
    assert.equal(caps.supportsListEntities, true);
    assert.equal(caps.supportsCanonicalHealthcareModels, true);
    assert.equal(caps.supportsStructuralRelationships, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.supportsFutureDocumentProcessing, true);
    assert.equal(caps.supportsFutureContractFoundation, true);
    assert.equal(caps.supportsFutureRuleEngine, true);
    assert.equal(caps.supportsFutureAiAuditor, true);
    assert.equal(caps.supportsFutureTissIntelligence, true);
    assert.equal(caps.supportsFutureWorkflow, true);
    assert.equal(caps.knowsTiss, false);
    assert.equal(caps.knowsAns, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
  });

  it("DefaultHealthcareModelAdapter é o default da fundação", async () => {
    const port: HealthcareModelPort = new DefaultHealthcareModelAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_HEALTHCARE_MODEL_ADAPTER_ID);
    assert.equal(caps.knowsTiss, false);
    assert.equal(caps.knowsAns, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createHealthcareModelPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultHealthcareModelAdapter({
      store: new DefaultHealthcareModelStore(),
      ping: async () => ({ ok: true, message: "healthcare-model probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "healthcare-model probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultHealthcareModelAdapter", () => {
    const defaultPort = createHealthcareModelPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createHealthcareModelFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createHealthcareModelPort({ provider: "mock" });
    const summary = await getHealthcareModelHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });
});

describe("EPC-19 createEntity / getEntity / listEntities", () => {
  it("createEntity persiste entidade canônica no store", async () => {
    resetHealthcareEntityIdSequence();
    const port = new MockHealthcareModelAdapter({
      createId: () => "hcm-patient-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const patient: HealthcarePatient = {
      kind: "patient",
      id: "hcm-patient-fixed-1",
      displayName: "Universal Patient",
      status: "active",
      version: "1",
      tags: ["foundation"],
      customAttributes: { channel: "healthcare-model-test" },
      metadataReference: { id: "meta-1", namespace: "enterprise.core" },
      configurationReference: { id: "cfg-1", kind: "healthcare-model" },
    };

    const created = await port.createEntity({ entity: patient });
    assert.equal(created.ok, true);
    assert.equal(created.entityId, "hcm-patient-fixed-1");
    assert.equal(created.entity?.kind, "patient");
    assert.equal(created.entity?.createdAt, "2026-07-31T12:00:00.000Z");
    assert.equal(created.entity?.updatedAt, "2026-07-31T12:00:00.000Z");

    const got = await port.getEntity({ entityId: "hcm-patient-fixed-1", kind: "patient" });
    assert.equal(got.ok, true);
    assert.equal(got.entity?.id, "hcm-patient-fixed-1");
    assert.equal((got.entity as HealthcarePatient).displayName, "Universal Patient");

    const listed = await port.listEntities({ kind: "patient", tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.entities.length, 1);

    const store = (port as MockHealthcareModelAdapter).getStore();
    assert.equal(store.storeId, DEFAULT_HEALTHCARE_MODEL_STORE_ID);
    assert.equal(store.entityCount(), 1);
  });

  it("getEntity retorna not_found para id inexistente", async () => {
    const port = new DefaultHealthcareModelAdapter();
    const result = await port.getEntity({ entityId: "missing" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_found");
  });

  it("listEntities filtra por kind / status / tag", async () => {
    const port = new DefaultHealthcareModelAdapter({
      now: () => "2026-07-31T15:00:00.000Z",
    });

    await port.createEntity({
      entity: {
        kind: "procedure",
        id: "proc-1",
        code: "OPAQUE-001",
        status: "active",
        tags: ["alpha"],
      },
    });
    await port.createEntity({
      entity: {
        kind: "diagnosis",
        id: "diag-1",
        code: "OPAQUE-D-001",
        status: "draft",
        tags: ["beta"],
      },
    });

    const procedures = await port.listEntities({ kind: "procedure" });
    assert.equal(procedures.entities.length, 1);
    assert.equal(procedures.entities[0]?.kind, "procedure");

    const draft = await port.listEntities({ status: "draft" });
    assert.equal(draft.entities.length, 1);
    assert.equal(draft.entities[0]?.id, "diag-1");

    const tagged = await port.listEntities({ tag: "alpha" });
    assert.equal(tagged.entities.length, 1);
    assert.equal(tagged.entities[0]?.id, "proc-1");
  });

  it("createEntity gera id quando omitido", async () => {
    resetHealthcareEntityIdSequence();
    const port = new DefaultHealthcareModelAdapter({
      createId: createHealthcareEntityId,
      now: () => "2026-07-31T16:00:00.000Z",
    });

    const result = await port.createEntity({
      entity: {
        kind: "claim",
        id: "",
        claimType: "universal",
      },
    });
    assert.equal(result.ok, true);
    assert.ok(result.entityId);
    assert.match(result.entityId!, /^hcm-claim-\d+$/);
  });
});

describe("EPC-19 canonical models catalog", () => {
  it("define exatamente 16 kinds canônicos universais", () => {
    assert.equal(HEALTHCARE_ENTITY_KINDS.length, 16);
    const expected = [
      "document",
      "organization",
      "professional",
      "patient",
      "beneficiary",
      "procedure",
      "diagnosis",
      "authorization",
      "attendance",
      "episode",
      "claim",
      "audit",
      "payment",
      "attachment",
      "evidence",
      "reference",
    ];
    assert.deepEqual([...HEALTHCARE_ENTITY_KINDS], expected);
  });

  it("todos os modelos canônicos possuem campos estruturais obrigatórios", async () => {
    const port = new MockHealthcareModelAdapter({
      now: () => "2026-07-31T18:00:00.000Z",
    });

    const samples: HealthcareEntity[] = HEALTHCARE_ENTITY_KINDS.map((kind, index) => ({
      kind,
      id: `entity-${kind}-${index}`,
      version: "1",
      status: "active",
      tags: ["universal"],
      customAttributes: { index },
      metadataReference: { id: `meta-${kind}` },
      configurationReference: { id: `cfg-${kind}` },
    })) as HealthcareEntity[];

    for (const sample of samples) {
      const created = await port.createEntity({ entity: sample });
      assert.equal(created.ok, true);
      assert.ok(created.entity?.id);
      assert.ok(created.entity?.version);
      assert.ok(created.entity?.status);
      assert.ok(created.entity?.metadataReference);
      assert.ok(created.entity?.configurationReference);
      assert.ok(created.entity?.tags);
      assert.ok(created.entity?.customAttributes);
      assert.ok(created.entity?.createdAt);
      assert.ok(created.entity?.updatedAt);
    }

    const listed = await port.listEntities();
    assert.equal(listed.entities.length, 16);
  });

  it("cadeia estrutural de relacionamento documentada sem execução", () => {
    assert.deepEqual(
      [...HEALTHCARE_RELATIONSHIP_CHAIN_EXAMPLE],
      ["patient", "attendance", "procedure", "authorization", "audit", "payment"],
    );
  });

  it("HealthcareRelationship é representação estrutural armazenável", () => {
    resetHealthcareRelationshipIdSequence();
    const store = new DefaultHealthcareModelStore();
    const relationship: HealthcareRelationship = {
      id: createHealthcareRelationshipId(),
      sourceKind: "patient",
      sourceId: "patient-1",
      targetKind: "attendance",
      targetId: "attendance-1",
      relationshipType: "patient-attendance",
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
    assert.equal(store.getRelationship(relationship.id)?.relationshipType, "patient-attendance");
  });
});

describe("EPC-19 isolation guarantees", () => {
  it("capabilities declaram ausência total de TISS / ANS / operadora", () => {
    const defaultCaps = new DefaultHealthcareModelAdapter().capabilities();
    const mockCaps = new MockHealthcareModelAdapter().capabilities();

    for (const caps of [defaultCaps, mockCaps]) {
      assert.equal(caps.knowsTiss, false);
      assert.equal(caps.knowsAns, false);
      assert.equal(caps.knowsOperatorOrCooperative, false);
    }
  });

  it("fonte do módulo não embute tokens de mercado proibidos", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(here, "../../../src/lib/enterprise/healthcare-model");
    const forbidden = [
      /\bTISS\b/,
      /\bTUSS\b/,
      /\bCID\b/,
      /\bANS\b/,
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
      // Comentários / docs de exclusão e prep futura são permitidos.
      // Código operacional não pode embutir tokens de mercado.
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
