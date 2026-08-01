#!/usr/bin/env node
/**
 * EPC-10A — Tenant Foundation
 * Prova Application → TenantPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createTenantFactory,
  createTenantPort,
  createTenantUuid,
  DEFAULT_TENANT_ADAPTER_ID,
  DefaultTenantAdapter,
  DefaultTenantStore,
  getTenantHealthSummary,
  isOrganizationType,
  listOrganizationTypes,
  MockTenantAdapter,
  ORGANIZATION_TYPES,
  type OrganizationType,
  type Tenant,
  type TenantPort,
} from "../../../src/lib/enterprise/tenant/index.ts";

function sampleTenant(overrides: Partial<Tenant> = {}): Omit<
  Tenant,
  "tenantId" | "createdAt" | "updatedAt" | "status"
> & {
  tenantId?: string;
  status?: Tenant["status"];
} {
  return {
    organizationName: "Acme Health Org",
    organizationType: "COMPANY",
    version: "1",
    displayName: "Acme",
    code: "ACME",
    externalId: "ext-acme-1",
    metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
    configurationReference: { id: "cfg-1", scope: "tenant", namespace: "enterprise.core" },
    tags: ["foundation", "generic"],
    customAttributes: { region: "LATAM", tier: 1 },
    capabilities: ["multi-unit", "reporting"],
    ...overrides,
  };
}

describe("EPC-10A TenantPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TenantPort = new MockTenantAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateTenant, true);
    assert.equal(caps.supportsGetTenant, true);
    assert.equal(caps.supportsListTenants, true);
    assert.equal(caps.supportsMetadataReference, true);
    assert.equal(caps.supportsConfigurationReference, true);
    assert.equal(caps.supportsOrganizationTypes, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createTenantPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultTenantStore();
    const port: TenantPort = new DefaultTenantAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_TENANT_ADAPTER_ID);
    assert.equal(caps.supportsCreateTenant, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultTenantAdapter({
      store: new DefaultTenantStore(),
      ping: async () => ({ ok: true, message: "tenant probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "tenant probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultTenantAdapter; futuros falham explicitamente", () => {
    const defaultPort = createTenantPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createTenantPort({ provider: "database" }), /ainda não implementado/i);
    assert.throws(() => createTenantPort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(() => createTenantPort({ provider: "registry" }), /ainda não implementado/i);
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createTenantFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createTenantPort({ provider: "mock" });
    const summary = await getTenantHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("createTenant/getTenant/listTenants funcionam no Mock", async () => {
    const port = new MockTenantAdapter({
      createId: () => "tenant-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.createTenant({ tenant: sampleTenant() });
    assert.equal(created.ok, true);
    assert.equal(created.tenantId, "tenant-fixed-1");
    assert.equal(created.tenant?.organizationName, "Acme Health Org");
    assert.equal(created.tenant?.organizationType, "COMPANY");
    assert.equal(created.tenant?.status, "draft");
    assert.equal(created.tenant?.code, "ACME");

    const get = await port.getTenant({ tenantId: "tenant-fixed-1" });
    assert.equal(get.ok, true);
    assert.equal(get.tenant?.displayName, "Acme");
    assert.equal(get.tenant?.externalId, "ext-acme-1");

    const list = await port.listTenants({
      organizationType: "COMPANY",
      tag: "foundation",
      code: "ACME",
    });
    assert.equal(list.ok, true);
    assert.equal(list.tenants.length, 1);

    const missing = await port.getTenant({ tenantId: "nope" });
    assert.equal(missing.ok, false);
  });

  it("createTenant no Default gera id, timestamps e permite update", async () => {
    let idSeq = 0;
    let clock = 0;
    const store = new DefaultTenantStore();
    const port = new DefaultTenantAdapter({
      store,
      createId: () => `tenant-gen-${++idSeq}`,
      now: () => `2026-07-31T1${++clock}:00:00.000Z`,
    });

    const first = await port.createTenant({
      tenant: sampleTenant({ organizationType: "HOSPITAL", status: "active" }),
    });
    assert.equal(first.ok, true);
    assert.equal(first.tenantId, "tenant-gen-1");
    assert.equal(first.tenant?.status, "active");
    assert.equal(first.tenant?.createdAt, "2026-07-31T11:00:00.000Z");

    const second = await port.createTenant({
      tenant: sampleTenant({
        tenantId: "tenant-gen-1",
        organizationType: "HOSPITAL",
        version: "2",
        status: "archived",
      }),
    });
    assert.equal(second.ok, true);
    assert.equal(second.message, "tenant updated");
    assert.equal(second.tenant?.createdAt, "2026-07-31T11:00:00.000Z");
    assert.equal(second.tenant?.updatedAt, "2026-07-31T12:00:00.000Z");
    assert.equal(second.tenant?.version, "2");
    assert.equal(second.tenant?.status, "archived");
  });

  it("filtros de listagem cobrem type/status/code/externalId", async () => {
    const port = new MockTenantAdapter();
    await port.createTenant({
      tenant: sampleTenant({
        tenantId: "a-1",
        organizationType: "CLINIC",
        status: "active",
        code: "CLI-A",
        externalId: "E1",
      }),
    });
    await port.createTenant({
      tenant: sampleTenant({
        tenantId: "b-2",
        organizationType: "LABORATORY",
        status: "draft",
        code: "LAB-B",
      }),
    });

    const byType = await port.listTenants({ organizationType: "CLINIC" });
    assert.equal(byType.tenants.length, 1);

    const byStatus = await port.listTenants({ status: "draft" });
    assert.equal(byStatus.tenants.length, 1);

    const byPrefix = await port.listTenants({ idPrefix: "a-" });
    assert.equal(byPrefix.tenants.length, 1);

    const byExt = await port.listTenants({ externalId: "E1", code: "CLI-A" });
    assert.equal(byExt.tenants.length, 1);
  });
});

describe("EPC-10A modelo canônico / OrganizationType", () => {
  it("modelo canônico aceita apenas campos genéricos (sem usuários/RBAC/domínio)", async () => {
    const port = createTenantPort({ provider: "mock" });
    const result = await port.createTenant({
      tenant: sampleTenant({ tenantId: "canon-1" }),
    });
    const tenant = result.tenant!;

    assert.equal(tenant.tenantId, "canon-1");
    assert.equal(typeof tenant.organizationName, "string");
    assert.equal(tenant.organizationType, "COMPANY");
    assert.ok(tenant.createdAt);
    assert.ok(tenant.updatedAt);
    assert.ok(tenant.status);
    assert.ok(tenant.version);
    assert.ok(tenant.displayName);
    assert.ok(tenant.code);
    assert.ok(tenant.externalId);
    assert.ok(tenant.metadataReference);
    assert.ok(tenant.configurationReference);
    assert.ok(tenant.tags);
    assert.ok(tenant.customAttributes);
    assert.ok(tenant.capabilities);

    const asRecord = tenant as unknown as Record<string, unknown>;
    assert.equal(asRecord.userId, undefined);
    assert.equal(asRecord.roleId, undefined);
    assert.equal(asRecord.permission, undefined);
    assert.equal(asRecord.contractId, undefined);
    assert.equal(asRecord.operatorId, undefined);
    assert.equal(asRecord.rulePackId, undefined);
    assert.equal(asRecord.tissGuide, undefined);
    assert.equal(asRecord.patientId, undefined);
    assert.equal(asRecord.clinicalNotes, undefined);
  });

  it("OrganizationType é enumeração pura — todos os tipos canônicos", () => {
    assert.deepEqual(
      [...ORGANIZATION_TYPES],
      [
        "COOPERATIVE",
        "HOSPITAL",
        "CLINIC",
        "LABORATORY",
        "INSURANCE",
        "HEALTH_NETWORK",
        "COMPANY",
        "OTHER",
      ],
    );

    const listed = listOrganizationTypes();
    assert.equal(listed.length, 8);
    for (const type of listed) {
      assert.equal(isOrganizationType(type), true);
    }
    assert.equal(isOrganizationType("NOT_A_TYPE"), false);
    assert.equal(isOrganizationType(42), false);
  });

  it("Tenant representa qualquer OrganizationType sem lógica de domínio", async () => {
    const port = new MockTenantAdapter();
    for (const organizationType of ORGANIZATION_TYPES) {
      const r = await port.createTenant({
        tenant: {
          organizationName: `Org ${organizationType}`,
          organizationType,
          tenantId: `id-${organizationType}`,
        },
      });
      assert.equal(r.ok, true);
      assert.equal(r.tenant?.organizationType, organizationType);
    }
  });

  it("createTenantUuid gera id estável; Tenant não conhece associações EPC-10B", () => {
    const uuid = createTenantUuid();
    assert.match(uuid, /^[0-9a-f-]{36}$/i);

    const tenant: Tenant = {
      tenantId: uuid,
      organizationName: "Generic Org",
      organizationType: "OTHER" satisfies OrganizationType,
      status: "draft",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
    };

    const rec = tenant as unknown as Record<string, unknown>;
    assert.equal(rec.rulePackAssignments, undefined);
    assert.equal(rec.storageAssignments, undefined);
    assert.equal(rec.aiProviderAssignments, undefined);
    assert.equal(rec.workflowAssignments, undefined);
    assert.equal(rec.documentIdentityAssignments, undefined);
    assert.equal(rec.userAssignments, undefined);
  });
});
