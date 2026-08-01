#!/usr/bin/env node
/**
 * EPC-17 — Contract Rule Binding Foundation
 * Prova Application → ContractRuleBindingPort → Adapter → Store sem tocar produto.
 * NÃO executa regras. NÃO carrega Contratos ou Rule Packs.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BINDING_POLICIES,
  BINDING_STATUSES,
  createBindingId,
  createContractRuleBindingFactory,
  createContractRuleBindingPort,
  DEFAULT_CONTRACT_RULE_BINDING_ADAPTER_ID,
  DefaultContractRuleBindingAdapter,
  DefaultContractRuleBindingStore,
  defineContractReference,
  defineRulePackReference,
  getContractRuleBindingHealthSummary,
  isBindingPolicy,
  isBindingStatus,
  listBindingPolicies,
  listBindingStatuses,
  MockContractRuleBindingAdapter,
  type ContractRuleBinding,
  type ContractRuleBindingPort,
} from "../../../src/lib/enterprise/contract-rule-binding/index.ts";

function sampleBinding(overrides: Partial<ContractRuleBinding> = {}): Omit<
  ContractRuleBinding,
  "bindingId" | "createdAt" | "updatedAt" | "status"
> & {
  bindingId?: string;
  status?: ContractRuleBinding["status"];
} {
  return {
    contractReference: defineContractReference({
      contractId: "contract-acme-1",
      name: "Opaque Contract",
      version: "1",
    }),
    rulePackReference: defineRulePackReference({
      packId: "pack-eligibility-1",
      name: "Opaque Pack",
      version: "1",
    }),
    priority: 10,
    executionOrder: 1,
    effectiveDate: "2026-08-01T00:00:00.000Z",
    expirationDate: "2027-08-01T00:00:00.000Z",
    metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
    configurationReference: { id: "cfg-1", kind: "scope", namespace: "enterprise.core" },
    tags: ["binding", "foundation"],
    customAttributes: { region: "LATAM", note: "opaque" },
    version: "1",
    bindingPolicy: "FIRST_MATCH",
    ...overrides,
  };
}

describe("EPC-17 ContractRuleBindingPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ContractRuleBindingPort = new MockContractRuleBindingAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsBindRulePack, true);
    assert.equal(caps.supportsUnbindRulePack, true);
    assert.equal(caps.supportsGetBinding, true);
    assert.equal(caps.supportsListBindings, true);
    assert.equal(caps.supportsMultipleRulePacksPerContract, true);
    assert.equal(caps.supportsPriority, true);
    assert.equal(caps.supportsExecutionOrder, true);
    assert.equal(caps.supportsEffectiveDates, true);
    assert.equal(caps.supportsVersioning, true);
    assert.equal(caps.supportsBindingPolicy, true);
    assert.equal(caps.supportsFutureRuleEngine, true);
    assert.equal(caps.supportsFutureAiAuditor, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createContractRuleBindingPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultContractRuleBindingStore();
    const port: ContractRuleBindingPort = new DefaultContractRuleBindingAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_CONTRACT_RULE_BINDING_ADAPTER_ID);
    assert.equal(caps.supportsBindRulePack, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultContractRuleBindingAdapter({
      store: new DefaultContractRuleBindingStore(),
      ping: async () => ({ ok: true, message: "binding probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "binding probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultContractRuleBindingAdapter; futuros falham explicitamente", () => {
    const defaultPort = createContractRuleBindingPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(
      () => createContractRuleBindingPort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createContractRuleBindingPort({ provider: "remote" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createContractRuleBindingPort({ provider: "registry" }),
      /ainda não implementado/i,
    );
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createContractRuleBindingFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createContractRuleBindingPort({ provider: "mock" });
    const summary = await getContractRuleBindingHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("bindRulePack/getBinding/listBindings/unbindRulePack funcionam no Mock", async () => {
    const port = new MockContractRuleBindingAdapter({
      createId: () => "bind-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.bindRulePack({
      binding: sampleBinding(),
    });
    assert.equal(created.ok, true);
    assert.equal(created.bindingId, "bind-fixed-1");
    assert.equal(created.code, "created");
    assert.equal(created.binding?.status, "DRAFT");
    assert.equal(created.binding?.contractReference.contractId, "contract-acme-1");
    assert.equal(created.binding?.rulePackReference.packId, "pack-eligibility-1");

    const get = await port.getBinding({ bindingId: "bind-fixed-1" });
    assert.equal(get.ok, true);
    assert.equal(get.binding?.priority, 10);
    assert.equal(get.binding?.executionOrder, 1);
    assert.equal(get.binding?.version, "1");

    const list = await port.listBindings({
      contractId: "contract-acme-1",
      packId: "pack-eligibility-1",
      tag: "foundation",
    });
    assert.equal(list.ok, true);
    assert.equal(list.bindings.length, 1);

    const unbound = await port.unbindRulePack({ bindingId: "bind-fixed-1" });
    assert.equal(unbound.ok, true);
    assert.equal(unbound.code, "unbound");

    const missing = await port.getBinding({ bindingId: "bind-fixed-1" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("bindRulePack no Default gera id, timestamps e permite update", async () => {
    let idSeq = 0;
    let clock = 0;
    const store = new DefaultContractRuleBindingStore();
    const port = new DefaultContractRuleBindingAdapter({
      store,
      createId: () => `bind-gen-${++idSeq}`,
      now: () => `2026-07-31T1${++clock}:00:00.000Z`,
    });

    const first = await port.bindRulePack({
      binding: sampleBinding({ status: "ACTIVE" }),
    });
    assert.equal(first.ok, true);
    assert.equal(first.bindingId, "bind-gen-1");
    assert.equal(first.binding?.status, "ACTIVE");
    assert.equal(first.binding?.createdAt, "2026-07-31T11:00:00.000Z");

    const second = await port.bindRulePack({
      binding: sampleBinding({
        bindingId: "bind-gen-1",
        version: "2",
        status: "ARCHIVED",
        priority: 99,
      }),
    });
    assert.equal(second.ok, true);
    assert.equal(second.message, "binding updated");
    assert.equal(second.code, "updated");
    assert.equal(second.binding?.createdAt, "2026-07-31T11:00:00.000Z");
    assert.equal(second.binding?.updatedAt, "2026-07-31T12:00:00.000Z");
    assert.equal(second.binding?.version, "2");
    assert.equal(second.binding?.status, "ARCHIVED");
    assert.equal(second.binding?.priority, 99);
  });

  it("suporta múltiplos Rule Packs por contrato", async () => {
    const port = new MockContractRuleBindingAdapter();
    await port.bindRulePack({
      binding: sampleBinding({
        bindingId: "b-1",
        rulePackReference: { packId: "pack-A" },
        priority: 1,
        executionOrder: 1,
      }),
    });
    await port.bindRulePack({
      binding: sampleBinding({
        bindingId: "b-2",
        rulePackReference: { packId: "pack-B" },
        priority: 2,
        executionOrder: 2,
      }),
    });

    const list = await port.listBindings({ contractId: "contract-acme-1" });
    assert.equal(list.bindings.length, 2);
    const packs = list.bindings.map((b) => b.rulePackReference.packId).sort();
    assert.deepEqual(packs, ["pack-A", "pack-B"]);
  });

  it("filtros de listagem cobrem contract/pack/status/policy/prefix", async () => {
    const port = new MockContractRuleBindingAdapter();
    await port.bindRulePack({
      binding: sampleBinding({
        bindingId: "a-1",
        status: "ACTIVE",
        bindingPolicy: "ALL_MATCH",
        contractReference: { contractId: "c-1" },
        rulePackReference: { packId: "p-A" },
      }),
    });
    await port.bindRulePack({
      binding: sampleBinding({
        bindingId: "b-2",
        status: "DRAFT",
        bindingPolicy: "HIGHEST_PRIORITY",
        contractReference: { contractId: "c-2" },
        rulePackReference: { packId: "p-B" },
      }),
    });

    const byContract = await port.listBindings({ contractId: "c-1" });
    assert.equal(byContract.bindings.length, 1);

    const byStatus = await port.listBindings({ status: "DRAFT" });
    assert.equal(byStatus.bindings.length, 1);

    const byPrefix = await port.listBindings({ idPrefix: "a-" });
    assert.equal(byPrefix.bindings.length, 1);

    const byPolicy = await port.listBindings({ bindingPolicy: "ALL_MATCH" });
    assert.equal(byPolicy.bindings.length, 1);

    const byPack = await port.listBindings({ packId: "p-B", contractId: "c-2" });
    assert.equal(byPack.bindings.length, 1);
  });
});

describe("EPC-17 modelos canônicos / BindingPolicy", () => {
  it("ContractRuleBinding possui campos canônicos FASE 6", async () => {
    const port = createContractRuleBindingPort({ provider: "mock" });
    const result = await port.bindRulePack({
      binding: sampleBinding({ bindingId: "canon-1" }),
    });
    const b = result.binding!;

    assert.equal(typeof b.bindingId, "string");
    assert.ok(b.contractReference.contractId);
    assert.ok(b.rulePackReference.packId);
    assert.ok(b.status);
    assert.equal(typeof b.priority, "number");
    assert.equal(typeof b.executionOrder, "number");
    assert.ok(b.effectiveDate);
    assert.ok(b.expirationDate);
    assert.ok(b.metadataReference);
    assert.ok(b.configurationReference);
    assert.ok(b.tags);
    assert.ok(b.customAttributes);
    assert.ok(b.version);
    assert.ok(b.bindingPolicy);
    assert.ok(b.createdAt);
    assert.ok(b.updatedAt);

    const asRecord = b as unknown as Record<string, unknown>;
    assert.equal(asRecord.rules, undefined);
    assert.equal(asRecord.expression, undefined);
    assert.equal(asRecord.tiss, undefined);
    assert.equal(asRecord.tissGuide, undefined);
    assert.equal(asRecord.clinicalRule, undefined);
    assert.equal(asRecord.evaluateRule, undefined);
    assert.equal(asRecord.ruleEngine, undefined);
    assert.equal(asRecord.aiAuditor, undefined);
    assert.equal(asRecord.ocrResult, undefined);
    assert.equal(asRecord.workflowId, undefined);
    assert.equal(asRecord.patientId, undefined);
  });

  it("BindingPolicy é enumeração pura — sem lógica", () => {
    assert.deepEqual(
      [...BINDING_POLICIES],
      ["FIRST_MATCH", "ALL_MATCH", "HIGHEST_PRIORITY", "CUSTOM"],
    );

    const listed = listBindingPolicies();
    assert.equal(listed.length, 4);
    for (const policy of listed) {
      assert.equal(isBindingPolicy(policy), true);
    }
    assert.equal(isBindingPolicy("NOT_A_POLICY"), false);
    assert.equal(isBindingPolicy(42), false);
  });

  it("ciclo de vida estrutural — statuses canônicos sem regra operacional", () => {
    assert.deepEqual(
      [...BINDING_STATUSES],
      ["ACTIVE", "INACTIVE", "DRAFT", "DEPRECATED", "ARCHIVED"],
    );

    const listed = listBindingStatuses();
    assert.equal(listed.length, 5);
    for (const status of listed) {
      assert.equal(isBindingStatus(status), true);
    }
    assert.equal(isBindingStatus("RUNNING"), false);
  });

  it("suporta versionamento, prioridade, vigência e executionOrder", async () => {
    const port = new MockContractRuleBindingAdapter();
    for (const status of BINDING_STATUSES) {
      const r = await port.bindRulePack({
        binding: sampleBinding({
          bindingId: `status-${status}`,
          status,
          version: "3",
          priority: 50,
          executionOrder: 7,
          effectiveDate: "2026-01-01T00:00:00.000Z",
          expirationDate: "2026-12-31T23:59:59.000Z",
        }),
      });
      assert.equal(r.ok, true);
      assert.equal(r.binding?.status, status);
      assert.equal(r.binding?.version, "3");
      assert.equal(r.binding?.priority, 50);
      assert.equal(r.binding?.executionOrder, 7);
      assert.ok(r.binding?.effectiveDate);
      assert.ok(r.binding?.expirationDate);
    }
  });

  it("createBindingId gera id; Binding não implementa execução de regras", () => {
    const uuid = createBindingId();
    assert.match(uuid, /^[0-9a-f-]{36}$/i);

    const binding: ContractRuleBinding = {
      bindingId: uuid,
      contractReference: { contractId: "c-1" },
      rulePackReference: { packId: "p-1" },
      status: "DRAFT",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
    };

    const rec = binding as unknown as Record<string, unknown>;
    assert.equal(rec.evaluate, undefined);
    assert.equal(rec.executeRule, undefined);
    assert.equal(rec.loadRulePack, undefined);
    assert.equal(rec.validateContract, undefined);
    assert.equal(rec.startWorkflow, undefined);
    assert.equal(rec.auditWithAi, undefined);
  });

  it("Binding permanece desacoplado de Contrato e Rule Engine", async () => {
    const port = new MockContractRuleBindingAdapter();
    const created = await port.bindRulePack({
      binding: sampleBinding({
        bindingId: "decoupled-1",
        contractReference: { contractId: "opaque-contract-99" },
        rulePackReference: { packId: "opaque-pack-99", name: "Opaque Pack Ref" },
      }),
    });

    assert.equal(created.binding?.contractReference.contractId, "opaque-contract-99");
    assert.equal(created.binding?.rulePackReference.packId, "opaque-pack-99");
    const rec = created.binding as unknown as Record<string, unknown>;
    assert.equal(rec.clauses, undefined);
    assert.equal(rec.packContent, undefined);
    assert.equal(rec.rules, undefined);
    assert.equal(rec.expressionAst, undefined);
    assert.equal(rec.tiss, undefined);
  });
});
