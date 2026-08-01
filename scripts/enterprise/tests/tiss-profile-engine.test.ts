#!/usr/bin/env node
/**
 * EPC-22 — TISS Profile Foundation
 * Prova Application → TISSProfilePort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TISS_PROFILE_ADAPTER_ID,
  DEFAULT_TISS_PROFILE_STORE_ID,
  DefaultTISSProfileAdapter,
  DefaultTISSProfileStore,
  MockTISSProfileAdapter,
  PROFILE_PIPELINE,
  PROFILE_PREPARED_VERSION_FAMILIES,
  PROFILE_STRUCTURAL_CHAIN,
  PROFILE_VERSION_FAMILIES,
  createProfileConceptId,
  createProfileRelationshipId,
  createTISSProfileFactory,
  createTISSProfileId,
  createTISSProfilePort,
  getTISSProfileHealthSummary,
  resetAllTISSProfileIdSequences,
  type ProfileConcept,
  type ProfileRelationship,
  type ProfileVersion,
  type TISSProfile,
  type TISSProfilePort,
} from "../../../src/lib/enterprise/tiss-profile/index.ts";

describe("EPC-22 TISSProfilePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TISSProfilePort = new MockTISSProfileAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedProfileCount, 0);
    assert.equal(health.storedVersionCount, 0);
    assert.equal(health.storedRelationshipCount, 0);
    assert.equal(health.storedMetadataCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterProfile, true);
    assert.equal(caps.supportsGetProfile, true);
    assert.equal(caps.supportsListProfiles, true);
    assert.equal(caps.supportsStructuralDocumentPattern, true);
    assert.equal(caps.supportsMandatoryOptionalConcepts, true);
    assert.equal(caps.supportsCardinality, true);
    assert.equal(caps.supportsExpectedRelationships, true);
    assert.equal(caps.supportsLogicalOrder, true);
    assert.equal(caps.supportsStructuralNotes, true);
    assert.equal(caps.supportsMultiVersionTiss, true);
    assert.equal(caps.supportsFutureTissMapping, true);
    assert.equal(caps.supportsFutureHealthcareModel, true);
    assert.equal(caps.supportsFutureRuleEngine, true);
    assert.equal(caps.supportsFutureAiAuditor, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.supportsFutureFhir, true);
    assert.equal(caps.supportsFutureDicom, true);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsRules, false);
    assert.equal(caps.implementsRuleEngine, false);
    assert.equal(caps.implementsWorkflow, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsContracts, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.representsDocumentStructureOnly, true);
  });

  it("DefaultTISSProfileAdapter é o default da fundação", async () => {
    const port: TISSProfilePort = new DefaultTISSProfileAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_TISS_PROFILE_ADAPTER_ID);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsRules, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.representsDocumentStructureOnly, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createTISSProfilePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultTISSProfileAdapter({
      store: new DefaultTISSProfileStore(),
      ping: async () => ({ ok: true, message: "tiss-profile probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "tiss-profile probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultTISSProfileAdapter", () => {
    const defaultPort = createTISSProfilePort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createTISSProfileFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createTISSProfilePort({ provider: "mock" });
    const summary = await getTISSProfileHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });
});

describe("EPC-22 registerProfile / getProfile / listProfiles", () => {
  it("registerProfile persiste Profile estrutural com conceitos e cardinalidade", async () => {
    resetAllTISSProfileIdSequences();
    const port = new MockTISSProfileAdapter({
      createId: () => "tiss-profile-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const concepts: ProfileConcept[] = [
      {
        id: "pc-1",
        kind: "profile-concept",
        conceptCode: "TISS.BENEFICIARY",
        conceptName: "Beneficiary",
        requirement: "mandatory",
        cardinality: "1",
        logicalOrder: 1,
        structuralNotes: "Beneficiário esperado no padrão",
      },
      {
        id: "pc-2",
        kind: "profile-concept",
        conceptCode: "TISS.ATTACHMENT",
        conceptName: "Attachment",
        requirement: "optional",
        cardinality: "0..*",
        logicalOrder: 2,
        structuralNotes: "Anexos opcionais",
      },
    ];

    const profile: TISSProfile = {
      id: "tiss-profile-fixed-1",
      kind: "profile",
      name: "ConsultationGuidePattern",
      profileCode: "TISS.PROFILE.CONSULTATION",
      description: "Padrão estrutural reutilizável — não é uma guia específica",
      concepts,
      supportedVersionFamilies: ["tiss-4.x", "tiss-5.x"],
      status: "active",
      version: "1",
      tags: ["foundation", "structural"],
      structuralNotes: "Estrutura documental apenas",
      customAttributes: { channel: "tiss-profile-test" },
    };

    const registered = await port.registerProfile({
      profile,
      relationships: [
        {
          id: "pr-1",
          kind: "profile-relationship",
          sourceConceptCode: "TISS.BENEFICIARY",
          targetConceptCode: "TISS.ATTENDANCE",
          relationshipType: "references",
          expected: true,
          logicalOrder: 1,
          structuralNotes: "Relacionamento esperado",
        },
      ],
      versions: [
        {
          id: "pv-1",
          kind: "profile-version",
          profileId: "tiss-profile-fixed-1",
          versionLabel: "4.01.00",
          versionFamily: "tiss-4.x",
          isActive: true,
        },
      ],
      metadata: {
        id: "pm-1",
        kind: "profile-metadata",
        title: "Consultation structural pattern",
        summary: "Metadados estruturais do Profile",
      },
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.profileId, "tiss-profile-fixed-1");
    assert.equal(registered.profile?.concepts?.length, 2);
    assert.equal(registered.profile?.concepts?.[0]?.requirement, "mandatory");
    assert.equal(registered.profile?.concepts?.[1]?.requirement, "optional");
    assert.equal(registered.profile?.concepts?.[0]?.cardinality, "1");
    assert.equal(registered.profile?.createdAt, "2026-07-31T12:00:00.000Z");

    const got = await port.getProfile({ profileId: "tiss-profile-fixed-1" });
    assert.equal(got.ok, true);
    assert.equal(got.profile?.profileCode, "TISS.PROFILE.CONSULTATION");

    const byCode = await port.getProfile({ profileCode: "TISS.PROFILE.CONSULTATION" });
    assert.equal(byCode.ok, true);
    assert.equal(byCode.profile?.id, "tiss-profile-fixed-1");

    const byName = await port.getProfile({ name: "ConsultationGuidePattern" });
    assert.equal(byName.ok, true);

    const listed = await port.listProfiles({
      tag: "foundation",
      versionFamily: "tiss-4.x",
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.profiles.length, 1);

    const store = (port as MockTISSProfileAdapter).getStore();
    assert.equal(store.storeId, DEFAULT_TISS_PROFILE_STORE_ID);
    assert.equal(store.profileCount(), 1);
    assert.equal(store.versionCount(), 1);
    assert.equal(store.relationshipCount(), 1);
    assert.equal(store.metadataCount(), 1);
  });

  it("getProfile retorna not_found para id inexistente", async () => {
    const port = new DefaultTISSProfileAdapter();
    const result = await port.getProfile({ profileId: "missing" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_found");
  });

  it("listProfiles filtra por status / tag / versionFamily", async () => {
    const port = new DefaultTISSProfileAdapter({
      now: () => "2026-07-31T15:00:00.000Z",
    });

    await port.registerProfile({
      profile: {
        id: "prof-a",
        kind: "profile",
        name: "PatternA",
        profileCode: "TISS.PROFILE.A",
        status: "active",
        tags: ["alpha"],
        supportedVersionFamilies: ["tiss-4.x"],
      },
    });
    await port.registerProfile({
      profile: {
        id: "prof-b",
        kind: "profile",
        name: "PatternB",
        profileCode: "TISS.PROFILE.B",
        status: "draft",
        tags: ["beta"],
        supportedVersionFamilies: ["proprietary"],
      },
    });

    const active = await port.listProfiles({ status: "active" });
    assert.equal(active.profiles.length, 1);
    assert.equal(active.profiles[0]?.id, "prof-a");

    const tagged = await port.listProfiles({ tag: "beta" });
    assert.equal(tagged.profiles.length, 1);
    assert.equal(tagged.profiles[0]?.id, "prof-b");

    const proprietary = await port.listProfiles({ versionFamily: "proprietary" });
    assert.equal(proprietary.profiles.length, 1);
    assert.equal(proprietary.profiles[0]?.id, "prof-b");
  });

  it("registerProfile gera id quando omitido", async () => {
    resetAllTISSProfileIdSequences();
    const port = new DefaultTISSProfileAdapter({
      createId: createTISSProfileId,
      now: () => "2026-07-31T16:00:00.000Z",
    });

    const result = await port.registerProfile({
      profile: {
        id: "",
        kind: "profile",
        name: "AutoIdPattern",
        profileCode: "TISS.PROFILE.AUTO",
      },
    });
    assert.equal(result.ok, true);
    assert.ok(result.profileId);
    assert.match(result.profileId!, /^tiss-profile-\d+$/);
  });

  it("Mock unhealthy bloqueia registerProfile", async () => {
    const port = new MockTISSProfileAdapter({ healthy: false, message: "offline" });
    const result = await port.registerProfile({
      profile: {
        id: "x",
        kind: "profile",
        name: "X",
        profileCode: "TISS.PROFILE.X",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "unhealthy");
  });
});

describe("EPC-22 structural catalog and multi-version prep", () => {
  it("define famílias de versão tiss-4.x, tiss-5.x e proprietary", () => {
    assert.deepEqual([...PROFILE_VERSION_FAMILIES], ["tiss-4.x", "tiss-5.x", "proprietary"]);
    assert.deepEqual(
      [...PROFILE_PREPARED_VERSION_FAMILIES],
      ["tiss-4.x", "tiss-5.x", "proprietary"],
    );
  });

  it("documenta pipeline e cadeia estrutural sem runtime", () => {
    assert.deepEqual(
      [...PROFILE_PIPELINE],
      [
        "origem",
        "tiss-mapping",
        "tiss-vocabulary",
        "tiss-profile",
        "healthcare-model",
        "rule-engine",
        "ai-auditor",
      ],
    );
    assert.deepEqual(
      [...PROFILE_STRUCTURAL_CHAIN],
      ["profile", "profile-concept", "profile-relationship", "profile-version", "profile-metadata"],
    );
  });

  it("identity helpers geram ids determinísticos", () => {
    resetAllTISSProfileIdSequences();
    assert.equal(createTISSProfileId(), "tiss-profile-1");
    assert.equal(createProfileConceptId(), "tiss-profile-concept-1");
    assert.equal(createProfileRelationshipId(), "tiss-profile-rel-1");
  });

  it("ProfileVersion estrutura suporta múltiplas famílias sem implementar versões", async () => {
    const port = new DefaultTISSProfileAdapter({
      now: () => "2026-07-31T17:00:00.000Z",
    });

    const versions: ProfileVersion[] = [
      {
        id: "v4",
        kind: "profile-version",
        profileId: "multi",
        versionLabel: "4.x-placeholder",
        versionFamily: "tiss-4.x",
      },
      {
        id: "v5",
        kind: "profile-version",
        profileId: "multi",
        versionLabel: "5.x-placeholder",
        versionFamily: "tiss-5.x",
      },
      {
        id: "vp",
        kind: "profile-version",
        profileId: "multi",
        versionLabel: "1.0-prop",
        versionFamily: "proprietary",
      },
    ];

    const result = await port.registerProfile({
      profile: {
        id: "multi",
        kind: "profile",
        name: "MultiVersionPattern",
        profileCode: "TISS.PROFILE.MULTI",
        supportedVersionFamilies: ["tiss-4.x", "tiss-5.x", "proprietary"],
      },
      versions,
    });

    assert.equal(result.ok, true);
    assert.equal(result.profile?.versionIds?.length, 3);
    const store = (port as DefaultTISSProfileAdapter).getStore();
    assert.equal(store.versionCount(), 3);
    assert.equal(store.listVersionsByProfile("multi").length, 3);
  });
});

describe("EPC-22 foundation smoke — no product leak", () => {
  it("capabilities explicitam ausência de parser / validação / regras / contratos", () => {
    const port = createTISSProfilePort({ provider: "default" });
    const caps = port.capabilities();
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsRules, false);
    assert.equal(caps.implementsRuleEngine, false);
    assert.equal(caps.implementsContracts, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.representsDocumentStructureOnly, true);
  });

  it("ProfileRelationship é estrutural e esperado sem validação", () => {
    const relationship: ProfileRelationship = {
      id: "rel-1",
      kind: "profile-relationship",
      sourceConceptCode: "TISS.PROCEDURE",
      targetConceptCode: "TISS.AUTHORIZATION",
      relationshipType: "requires",
      expected: true,
      logicalOrder: 1,
      structuralNotes: "Esperado estruturalmente — sem enforce",
    };
    assert.equal(relationship.expected, true);
    assert.equal(relationship.kind, "profile-relationship");
  });
});
