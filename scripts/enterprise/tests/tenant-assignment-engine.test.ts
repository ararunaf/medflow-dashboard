#!/usr/bin/env node
/**
 * EPC-10B — Tenant Assignment Objects
 * Prova Application → TenantAssignmentPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ASSIGNMENT_STATUSES,
  createAssignmentUuid,
  createTenantAssignmentFactory,
  createTenantAssignmentPort,
  DEFAULT_TENANT_ASSIGNMENT_ADAPTER_ID,
  DefaultTenantAssignmentAdapter,
  DefaultTenantAssignmentStore,
  getTenantAssignmentHealthSummary,
  isAssignmentStatus,
  isTenantAssignmentKind,
  listAssignmentStatuses,
  listTenantAssignmentKinds,
  MockTenantAssignmentAdapter,
  TENANT_ASSIGNMENT_KINDS,
  type TenantAssignment,
  type TenantAssignmentKind,
  type TenantAssignmentPort,
} from "../../../src/lib/enterprise/tenant-assignment/index.ts";

function sampleAssignment(
  kind: TenantAssignmentKind,
  overrides: Partial<TenantAssignment> = {},
): Omit<TenantAssignment, "assignmentId" | "createdAt" | "updatedAt" | "status"> & {
  assignmentId?: string;
  status?: TenantAssignment["status"];
} {
  return {
    assignmentKind: kind,
    tenantReference: { tenantId: "tenant-acme-1", code: "ACME" },
    targetReference: { id: `target-${kind.toLowerCase()}`, name: `Target ${kind}`, version: "1" },
    version: "1",
    priority: 10,
    metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
    tags: ["assignment", "foundation"],
    customAttributes: { region: "LATAM", note: "opaque" },
    activationDate: "2026-08-01T00:00:00.000Z",
    expirationDate: "2027-08-01T00:00:00.000Z",
    ...overrides,
    assignmentKind: kind,
  } as Omit<TenantAssignment, "assignmentId" | "createdAt" | "updatedAt" | "status"> & {
    assignmentId?: string;
    status?: TenantAssignment["status"];
  };
}

describe("EPC-10B TenantAssignmentPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TenantAssignmentPort = new MockTenantAssignmentAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateAssignment, true);
    assert.equal(caps.supportsGetAssignment, true);
    assert.equal(caps.supportsListAssignments, true);
    assert.equal(caps.supportsAssignmentKinds, true);
    assert.equal(caps.supportsLifecycleStatus, true);
    assert.equal(caps.supportsVersioning, true);
    assert.equal(caps.supportsMetadataReference, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createTenantAssignmentPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultTenantAssignmentStore();
    const port: TenantAssignmentPort = new DefaultTenantAssignmentAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_TENANT_ASSIGNMENT_ADAPTER_ID);
    assert.equal(caps.supportsCreateAssignment, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultTenantAssignmentAdapter({
      store: new DefaultTenantAssignmentStore(),
      ping: async () => ({ ok: true, message: "assignment probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "assignment probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultTenantAssignmentAdapter; futuros falham explicitamente", () => {
    const defaultPort = createTenantAssignmentPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(
      () => createTenantAssignmentPort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createTenantAssignmentPort({ provider: "remote" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createTenantAssignmentPort({ provider: "registry" }),
      /ainda não implementado/i,
    );
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createTenantAssignmentFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createTenantAssignmentPort({ provider: "mock" });
    const summary = await getTenantAssignmentHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("createAssignment/getAssignment/listAssignments funcionam no Mock", async () => {
    const port = new MockTenantAssignmentAdapter({
      createId: () => "assign-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.createAssignment({
      assignment: sampleAssignment("RULE_PACK"),
    });
    assert.equal(created.ok, true);
    assert.equal(created.assignmentId, "assign-fixed-1");
    assert.equal(created.assignment?.assignmentKind, "RULE_PACK");
    assert.equal(created.assignment?.status, "DRAFT");
    assert.equal(created.assignment?.tenantReference.tenantId, "tenant-acme-1");
    assert.equal(created.assignment?.targetReference.id, "target-rule_pack");

    const get = await port.getAssignment({ assignmentId: "assign-fixed-1" });
    assert.equal(get.ok, true);
    assert.equal(get.assignment?.priority, 10);
    assert.equal(get.assignment?.version, "1");

    const list = await port.listAssignments({
      assignmentKind: "RULE_PACK",
      tenantId: "tenant-acme-1",
      tag: "foundation",
    });
    assert.equal(list.ok, true);
    assert.equal(list.assignments.length, 1);

    const missing = await port.getAssignment({ assignmentId: "nope" });
    assert.equal(missing.ok, false);
  });

  it("createAssignment no Default gera id, timestamps e permite update", async () => {
    let idSeq = 0;
    let clock = 0;
    const store = new DefaultTenantAssignmentStore();
    const port = new DefaultTenantAssignmentAdapter({
      store,
      createId: () => `assign-gen-${++idSeq}`,
      now: () => `2026-07-31T1${++clock}:00:00.000Z`,
    });

    const first = await port.createAssignment({
      assignment: sampleAssignment("STORAGE", { status: "ACTIVE" }),
    });
    assert.equal(first.ok, true);
    assert.equal(first.assignmentId, "assign-gen-1");
    assert.equal(first.assignment?.status, "ACTIVE");
    assert.equal(first.assignment?.createdAt, "2026-07-31T11:00:00.000Z");

    const second = await port.createAssignment({
      assignment: sampleAssignment("STORAGE", {
        assignmentId: "assign-gen-1",
        version: "2",
        status: "ARCHIVED",
      }),
    });
    assert.equal(second.ok, true);
    assert.equal(second.message, "assignment updated");
    assert.equal(second.assignment?.createdAt, "2026-07-31T11:00:00.000Z");
    assert.equal(second.assignment?.updatedAt, "2026-07-31T12:00:00.000Z");
    assert.equal(second.assignment?.version, "2");
    assert.equal(second.assignment?.status, "ARCHIVED");
  });

  it("filtros de listagem cobrem kind/tenant/status/targetId", async () => {
    const port = new MockTenantAssignmentAdapter();
    await port.createAssignment({
      assignment: sampleAssignment("CONFIGURATION", {
        assignmentId: "a-1",
        status: "ACTIVE",
        tenantReference: { tenantId: "t-1" },
        targetReference: { id: "cfg-A" },
      }),
    });
    await port.createAssignment({
      assignment: sampleAssignment("AI_PROVIDER", {
        assignmentId: "b-2",
        status: "DRAFT",
        tenantReference: { tenantId: "t-2" },
        targetReference: { id: "ai-B" },
      }),
    });

    const byKind = await port.listAssignments({ assignmentKind: "CONFIGURATION" });
    assert.equal(byKind.assignments.length, 1);

    const byStatus = await port.listAssignments({ status: "DRAFT" });
    assert.equal(byStatus.assignments.length, 1);

    const byPrefix = await port.listAssignments({ idPrefix: "a-" });
    assert.equal(byPrefix.assignments.length, 1);

    const byTarget = await port.listAssignments({ targetId: "cfg-A", tenantId: "t-1" });
    assert.equal(byTarget.assignments.length, 1);
  });
});

describe("EPC-10B modelos canônicos / ciclo de vida", () => {
  it("cinco Assignment Objects canônicos existem e compartilham campos FASE 7", async () => {
    const port = createTenantAssignmentPort({ provider: "mock" });

    for (const kind of TENANT_ASSIGNMENT_KINDS) {
      const result = await port.createAssignment({
        assignment: sampleAssignment(kind, { assignmentId: `canon-${kind}` }),
      });
      const a = result.assignment!;

      assert.equal(a.assignmentKind, kind);
      assert.equal(typeof a.assignmentId, "string");
      assert.ok(a.tenantReference.tenantId);
      assert.ok(a.targetReference);
      assert.ok(a.status);
      assert.ok(a.version);
      assert.ok(a.createdAt);
      assert.ok(a.updatedAt);
      assert.equal(typeof a.priority, "number");
      assert.ok(a.metadataReference);
      assert.ok(a.tags);
      assert.ok(a.customAttributes);
      assert.ok(a.activationDate);
      assert.ok(a.expirationDate);

      const asRecord = a as unknown as Record<string, unknown>;
      assert.equal(asRecord.userId, undefined);
      assert.equal(asRecord.roleId, undefined);
      assert.equal(asRecord.permission, undefined);
      assert.equal(asRecord.contractId, undefined);
      assert.equal(asRecord.operatorId, undefined);
      assert.equal(asRecord.clinicalRule, undefined);
      assert.equal(asRecord.tissGuide, undefined);
      assert.equal(asRecord.patientId, undefined);
      assert.equal(asRecord.ruleBody, undefined);
      assert.equal(asRecord.blob, undefined);
      assert.equal(asRecord.configValue, undefined);
      assert.equal(asRecord.prompt, undefined);
      assert.equal(asRecord.documentContent, undefined);
    }
  });

  it("AssignmentKind é enumeração pura — todos os kinds canônicos", () => {
    assert.deepEqual(
      [...TENANT_ASSIGNMENT_KINDS],
      ["RULE_PACK", "STORAGE", "CONFIGURATION", "AI_PROVIDER", "DOCUMENT"],
    );

    const listed = listTenantAssignmentKinds();
    assert.equal(listed.length, 5);
    for (const kind of listed) {
      assert.equal(isTenantAssignmentKind(kind), true);
    }
    assert.equal(isTenantAssignmentKind("NOT_A_KIND"), false);
    assert.equal(isTenantAssignmentKind(42), false);
  });

  it("ciclo de vida estrutural — statuses canônicos sem regra operacional", () => {
    assert.deepEqual(
      [...ASSIGNMENT_STATUSES],
      ["ACTIVE", "INACTIVE", "DRAFT", "DEPRECATED", "ARCHIVED"],
    );

    const listed = listAssignmentStatuses();
    assert.equal(listed.length, 5);
    for (const status of listed) {
      assert.equal(isAssignmentStatus(status), true);
    }
    assert.equal(isAssignmentStatus("RUNNING"), false);
  });

  it("suporta versionamento e lifecycle em todos os kinds", async () => {
    const port = new MockTenantAssignmentAdapter();
    for (const kind of TENANT_ASSIGNMENT_KINDS) {
      for (const status of ASSIGNMENT_STATUSES) {
        const r = await port.createAssignment({
          assignment: sampleAssignment(kind, {
            assignmentId: `${kind}-${status}`,
            status,
            version: "3",
          }),
        });
        assert.equal(r.ok, true);
        assert.equal(r.assignment?.status, status);
        assert.equal(r.assignment?.version, "3");
      }
    }
  });

  it("createAssignmentUuid gera id; Assignment não implementa ligação operacional", () => {
    const uuid = createAssignmentUuid();
    assert.match(uuid, /^[0-9a-f-]{36}$/i);

    const assignment: TenantAssignment = {
      assignmentId: uuid,
      assignmentKind: "DOCUMENT",
      tenantReference: { tenantId: "t-1" },
      targetReference: { id: "doc-1" },
      status: "DRAFT",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
    };

    const rec = assignment as unknown as Record<string, unknown>;
    assert.equal(rec.loadRulePack, undefined);
    assert.equal(rec.invokeAi, undefined);
    assert.equal(rec.uploadFile, undefined);
    assert.equal(rec.resolveConfiguration, undefined);
    assert.equal(rec.openDocument, undefined);
    assert.equal(rec.startWorkflow, undefined);
    assert.equal(rec.evaluateRule, undefined);
  });

  it("assignments permanecem desacoplados dos componentes de destino", async () => {
    const port = new MockTenantAssignmentAdapter();
    const created = await port.createAssignment({
      assignment: sampleAssignment("RULE_PACK", {
        assignmentId: "decoupled-1",
        targetReference: { id: "pack-opaque-99", name: "Opaque Pack Ref" },
      }),
    });

    // Apenas referência opaca — sem conteúdo de Rule Pack, sem regras, sem TISS.
    assert.equal(created.assignment?.targetReference.id, "pack-opaque-99");
    const rec = created.assignment as unknown as Record<string, unknown>;
    assert.equal(rec.rules, undefined);
    assert.equal(rec.packContent, undefined);
    assert.equal(rec.expression, undefined);
    assert.equal(rec.tiss, undefined);
  });
});
