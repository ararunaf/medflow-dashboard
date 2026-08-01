#!/usr/bin/env node
/**
 * EPC-04 — Metadata Engine Foundation
 * Prova Application → MetadataPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  METADATA_CONSTRAINT_KINDS,
  METADATA_SCHEMA_STATUSES,
  createMetadataPort,
  createVersionInfo,
  DEFAULT_METADATA_ADAPTER_ID,
  DefaultMetadataAdapter,
  DefaultMetadataStore,
  declaresCompatibilityWith,
  defineConstraint,
  entityDeclaresInheritance,
  getDeclaredInheritanceChain,
  getMetadataHealthSummary,
  getSchemaBaseReference,
  getSchemaStatus,
  getSchemaVersion,
  isKnownConstraintKind,
  MockMetadataAdapter,
  rangeConstraint,
  regexConstraint,
  requiredConstraint,
  schemaDeclaresInheritance,
  uniqueConstraint,
  type MetadataEntity,
  type MetadataPort,
  type MetadataSchema,
  type MetadataTemplate,
} from "../../../src/lib/enterprise/metadata/index.ts";

function sampleSchema(overrides: Partial<MetadataSchema> = {}): MetadataSchema {
  return {
    id: "schema-core",
    name: "CoreSchema",
    namespace: "enterprise.core",
    description: "Generic structural schema",
    versionInfo: createVersionInfo({
      version: "1.0.0",
      status: "active",
      author: "epc-04",
      compatibility: { compatibleWith: ["1.0.0"], notes: "baseline" },
    }),
    tags: ["foundation"],
    category: "infrastructure",
    ...overrides,
  };
}

function sampleEntity(overrides: Partial<MetadataEntity> = {}): MetadataEntity {
  return {
    id: "entity-item",
    name: "Item",
    namespace: "enterprise.core",
    attributes: [
      {
        name: "code",
        kind: "string",
        required: true,
        constraints: [requiredConstraint({ name: "code" }), uniqueConstraint({ name: "code" })],
      },
      {
        name: "amount",
        kind: "number",
        constraints: [rangeConstraint(0, 1000, { name: "amount" })],
      },
    ],
    tags: ["abstract"],
    category: "domain-agnostic",
    ...overrides,
  };
}

function sampleTemplate(overrides: Partial<MetadataTemplate> = {}): MetadataTemplate {
  return {
    id: "tpl-generic",
    name: "GenericTemplate",
    namespace: "enterprise.core",
    description: "Infrastructure template — no clinical content",
    slots: [{ name: "title", kind: "string" }],
    tags: ["template-infra"],
    ...overrides,
  };
}

describe("EPC-04 MetadataPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: MetadataPort = new MockMetadataAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterSchema, true);
    assert.equal(caps.supportsGetSchema, true);
    assert.equal(caps.supportsSchemaInheritance, true);
    assert.equal(caps.supportsSchemaVersioning, true);
    assert.equal(caps.supportsConstraints, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createMetadataPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultMetadataStore();
    const port: MetadataPort = new DefaultMetadataAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_METADATA_ADAPTER_ID);
    assert.equal(caps.supportsListSchemas, true);
    assert.equal(caps.supportsRegisterEntity, true);
    assert.equal(caps.supportsRegisterTemplate, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultMetadataAdapter({
      store: new DefaultMetadataStore(),
      ping: async () => ({ ok: true, message: "metadata probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "metadata probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultMetadataAdapter; futuros falham explicitamente", () => {
    const defaultPort = createMetadataPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createMetadataPort({ provider: "database" }), /ainda não implementado/i);
    assert.throws(() => createMetadataPort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(() => createMetadataPort({ provider: "registry" }), /ainda não implementado/i);
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createMetadataPort({ provider: "mock" });
    const summary = await getMetadataHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("registerSchema/getSchema/listSchemas funcionam no Mock", async () => {
    const port = new MockMetadataAdapter();
    const schema = sampleSchema();

    const reg = await port.registerSchema({ schema });
    assert.equal(reg.ok, true);
    assert.equal(reg.id, "schema-core");

    const get = await port.getSchema({ id: "schema-core" });
    assert.equal(get.ok, true);
    assert.equal(get.schema?.name, "CoreSchema");
    assert.equal(getSchemaVersion(get.schema!), "1.0.0");
    assert.equal(getSchemaStatus(get.schema!), "active");

    const byName = await port.getSchema({
      name: "CoreSchema",
      namespace: "enterprise.core",
      version: "1.0.0",
    });
    assert.equal(byName.ok, true);

    const list = await port.listSchemas({ namespace: "enterprise.core", tag: "foundation" });
    assert.equal(list.ok, true);
    assert.equal(list.schemas.length, 1);
  });

  it("registerEntity/getEntity e anexo a Schema no Default", async () => {
    const store = new DefaultMetadataStore();
    const port = new DefaultMetadataAdapter({ store });

    await port.registerSchema({ schema: sampleSchema() });
    const entity = sampleEntity();
    const reg = await port.registerEntity({ entity, schemaId: "schema-core" });
    assert.equal(reg.ok, true);

    const get = await port.getEntity({ id: "entity-item" });
    assert.equal(get.ok, true);
    assert.equal(get.entity?.name, "Item");
    assert.equal(get.entity?.attributes?.length, 2);

    const schema = await port.getSchema({ id: "schema-core" });
    assert.equal(schema.ok, true);
    assert.equal(
      schema.schema?.entities?.some((r) => r.id === "entity-item"),
      true,
    );
  });

  it("registerTemplate/listTemplates infraestrutura (sem conteúdo clínico)", async () => {
    const port = new MockMetadataAdapter();
    await port.registerSchema({ schema: sampleSchema() });
    const tpl = sampleTemplate({
      schemaRef: { id: "schema-core", kind: "schema" },
    });
    const reg = await port.registerTemplate({ template: tpl });
    assert.equal(reg.ok, true);

    const list = await port.listTemplates({ schemaId: "schema-core", tag: "template-infra" });
    assert.equal(list.ok, true);
    assert.equal(list.templates.length, 1);
    assert.equal(list.templates[0]?.name, "GenericTemplate");
  });

  it("versionamento estrutural: Version/Status/CreatedAt/UpdatedAt/Author/Compatibility", async () => {
    const port = new MockMetadataAdapter();
    const schema = sampleSchema();
    assert.ok(schema.versionInfo.createdAt);
    assert.ok(schema.versionInfo.updatedAt);
    assert.equal(schema.versionInfo.author, "epc-04");
    assert.equal(declaresCompatibilityWith(schema, "1.0.0"), true);

    await port.registerSchema({ schema });
    await port.registerSchema({
      schema: {
        ...schema,
        description: "touched",
        versionInfo: createVersionInfo({
          version: "1.0.0",
          status: "active",
          author: "epc-04",
          createdAt: schema.versionInfo.createdAt,
        }),
      },
    });

    const get = await port.getSchema({ id: "schema-core" });
    assert.equal(get.ok, true);
    assert.equal(get.schema?.versionInfo.createdAt, schema.versionInfo.createdAt);
    assert.ok(get.schema?.versionInfo.updatedAt);
    assert.deepEqual(
      [...METADATA_SCHEMA_STATUSES],
      ["draft", "active", "deprecated", "retired", "experimental"],
    );
  });

  it("herança de esquemas preparada (sem merge complexo)", () => {
    const base = sampleSchema({ id: "schema-base", name: "BaseSchema" });
    const child = sampleSchema({
      id: "schema-child",
      name: "ChildSchema",
      extends: { id: "schema-base", name: "BaseSchema", kind: "schema" },
    });

    assert.equal(schemaDeclaresInheritance(base), false);
    assert.equal(schemaDeclaresInheritance(child), true);
    assert.equal(getSchemaBaseReference(child)?.id, "schema-base");

    const [self, baseRef] = getDeclaredInheritanceChain(child);
    assert.equal(self.id, "schema-child");
    assert.equal(baseRef?.id, "schema-base");

    const entity = sampleEntity({
      extends: { id: "entity-base", name: "BaseItem", kind: "entity" },
    });
    assert.equal(entityDeclaresInheritance(entity), true);
  });

  it("constraints infraestrutura: Required/Unique/Regex/Range/Collection/Reference/Expression", () => {
    assert.deepEqual(
      [...METADATA_CONSTRAINT_KINDS],
      ["required", "unique", "regex", "range", "collection", "reference", "expression"],
    );
    assert.equal(isKnownConstraintKind("regex"), true);
    assert.equal(isKnownConstraintKind("paciente"), false);

    const c = defineConstraint({
      kind: "expression",
      name: "expr",
      params: { expression: "a > 0" },
    });
    assert.equal(c.kind, "expression");

    const rx = regexConstraint("^[A-Z]+$");
    assert.equal(rx.params?.pattern, "^[A-Z]+$");
  });

  it("conceitos nativos existem; nenhum conceito clínico no Port", () => {
    const port: MetadataPort = new MockMetadataAdapter();
    const keys = Object.keys(port).sort();
    assert.ok(!keys.includes("paciente"));
    assert.ok(!keys.includes("profissional"));
    assert.ok(!keys.includes("guia"));
    assert.ok(!keys.includes("contrato"));
    assert.ok(!keys.includes("operadora"));
    assert.ok(!keys.includes("tiss"));
    assert.ok(!keys.includes("ocr"));
    assert.ok(!keys.includes("workflow"));
    assert.ok(!keys.includes("supabase"));

    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.registerSchema, "function");
    assert.equal(typeof port.getSchema, "function");
    assert.equal(typeof port.listSchemas, "function");
    assert.equal(typeof port.registerEntity, "function");
    assert.equal(typeof port.getEntity, "function");
    assert.equal(typeof port.registerTemplate, "function");
    assert.equal(typeof port.listTemplates, "function");
    assert.equal(typeof port.providerId, "string");
  });

  it("Metadata Engine descreve domínio genérico abstrato (não clínico)", async () => {
    const port = createMetadataPort({ provider: "mock" });
    await port.registerSchema({
      schema: sampleSchema({
        id: "ns-alpha",
        name: "AlphaDomain",
        namespace: "platform.alpha",
      }),
    });
    await port.registerEntity({
      entity: {
        id: "ent-node",
        name: "Node",
        namespace: "platform.alpha",
        attributes: [{ name: "label", kind: "string" }],
        relationships: [
          {
            name: "parent",
            from: { id: "ent-node", kind: "entity" },
            to: { id: "ent-node", kind: "entity" },
            cardinality: "N:1",
          },
        ],
      },
      schemaId: "ns-alpha",
    });

    const list = await port.listSchemas({ namespace: "platform.alpha" });
    assert.equal(list.schemas.length, 1);
    const entity = await port.getEntity({ name: "Node", namespace: "platform.alpha" });
    assert.equal(entity.ok, true);
    assert.equal(entity.entity?.relationships?.[0]?.cardinality, "N:1");
  });
});
