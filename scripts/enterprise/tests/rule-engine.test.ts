#!/usr/bin/env node
/**
 * EPC-06A — Rule Engine Core Foundation
 * Prova Application → RulePort → Adapter → Store → Factory sem tocar produto.
 * NÃO avalia expressões. NÃO executa actions.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RULE_ACTION_CATALOG,
  RULE_ACTION_KINDS,
  RULE_OPERATOR_CATALOG,
  RULE_OPERATORS,
  RULE_PRIORITIES,
  RULE_PRIORITY_CATALOG,
  RULE_STATUSES,
  createRulePort,
  DEFAULT_RULE_ADAPTER_ID,
  DefaultRuleAdapter,
  DefaultRuleStore,
  defineAction,
  getOperator,
  getPriority,
  getRuleHealthSummary,
  isKnownActionKind,
  isKnownOperator,
  isKnownPriority,
  listActionCatalog,
  listOperators,
  listPriorities,
  MockRuleAdapter,
  type RuleDefinition,
  type RulePort,
} from "../../../src/lib/enterprise/rule/index.ts";

function sampleRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: "rule-generic",
    name: "GenericRule",
    namespace: "enterprise.core",
    description: "Domain-agnostic rule definition — no clinical content",
    status: "draft",
    version: "1",
    priority: "medium",
    severity: "info",
    category: "foundation",
    tags: ["foundation"],
    conditions: [
      {
        id: "c1",
        name: "field-equals",
        field: "opaque.path",
        operator: "equals",
        value: "opaque",
      },
    ],
    actions: [defineAction("continue", { name: "continue-generic" })],
    metadataRef: {
      metadataId: "schema-opaque",
      metadataKind: "schema",
      metadataNamespace: "enterprise.core",
    },
    workflowRef: {
      workflowId: "wf-opaque",
      workflowNamespace: "enterprise.core",
    },
    ...overrides,
  };
}

describe("EPC-06A RulePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: RulePort = new MockRuleAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterRule, true);
    assert.equal(caps.supportsGetRule, true);
    assert.equal(caps.supportsListRules, true);
    assert.equal(caps.supportsEnableRule, true);
    assert.equal(caps.supportsDisableRule, true);
    assert.equal(caps.supportsOperatorCatalog, true);
    assert.equal(caps.supportsActionCatalog, true);
    assert.equal(caps.supportsPriorityCatalog, true);
    assert.equal(caps.supportsEvaluation, false);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createRulePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultRuleStore();
    const port: RulePort = new DefaultRuleAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_RULE_ADAPTER_ID);
    assert.equal(caps.supportsListRules, true);
    assert.equal(caps.supportsEvaluation, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultRuleAdapter({
      store: new DefaultRuleStore(),
      ping: async () => ({ ok: true, message: "rule probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "rule probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultRuleAdapter; futuros falham explicitamente", () => {
    const defaultPort = createRulePort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createRulePort({ provider: "database" }), /ainda não implementado/i);
    assert.throws(() => createRulePort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(() => createRulePort({ provider: "persistence" }), /ainda não implementado/i);
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createRulePort({ provider: "mock" });
    const summary = await getRuleHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.supportsEvaluation, false);
  });

  it("registerRule/getRule/listRules funcionam no Mock", async () => {
    const port = new MockRuleAdapter();
    const rule = sampleRule();

    const reg = await port.registerRule({ rule });
    assert.equal(reg.ok, true);
    assert.equal(reg.id, "rule-generic");
    assert.equal(reg.code, "registered");

    const got = await port.getRule({ id: "rule-generic" });
    assert.equal(got.ok, true);
    assert.equal(got.rule?.name, "GenericRule");
    assert.equal(got.rule?.status, "draft");

    const byName = await port.getRule({ name: "GenericRule", namespace: "enterprise.core" });
    assert.equal(byName.ok, true);
    assert.equal(byName.rule?.id, "rule-generic");

    const listed = await port.listRules({ namespace: "enterprise.core", tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.rules.length, 1);
  });

  it("enableRule/disableRule alteram status estrutural sem avaliar", async () => {
    const port = new DefaultRuleAdapter({ store: new DefaultRuleStore() });
    await port.registerRule({ rule: sampleRule() });

    const enabled = await port.enableRule({ id: "rule-generic" });
    assert.equal(enabled.ok, true);
    assert.equal(enabled.rule?.status, "enabled");
    assert.equal(enabled.code, "enabled");

    const disabled = await port.disableRule({ id: "rule-generic" });
    assert.equal(disabled.ok, true);
    assert.equal(disabled.rule?.status, "disabled");
    assert.equal(disabled.code, "disabled");

    const missing = await port.enableRule({ id: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("registerRule atualiza definição existente preservando createdAt", async () => {
    const port = new MockRuleAdapter();
    const first = await port.registerRule({ rule: sampleRule() });
    assert.equal(first.code, "registered");

    const before = await port.getRule({ id: "rule-generic" });
    const createdAt = before.rule?.createdAt;
    assert.ok(createdAt);

    const second = await port.registerRule({
      rule: sampleRule({ description: "updated", version: "2" }),
    });
    assert.equal(second.code, "updated");

    const after = await port.getRule({ id: "rule-generic" });
    assert.equal(after.rule?.description, "updated");
    assert.equal(after.rule?.version, "2");
    assert.equal(after.rule?.createdAt, createdAt);
  });

  it("catálogo de operators está completo e sem evaluator", () => {
    assert.equal(RULE_OPERATORS.length, 12);
    assert.equal(RULE_OPERATOR_CATALOG.length, 12);
    assert.equal(listOperators().length, 12);

    for (const id of RULE_OPERATORS) {
      assert.equal(isKnownOperator(id), true);
      assert.ok(getOperator(id));
    }

    assert.equal(isKnownOperator("clinicalGlosa"), false);
    assert.equal(getOperator("expression")?.deferred, true);
    assert.equal(getOperator("external")?.deferred, true);
    assert.equal(getOperator("regex")?.deferred, true);
  });

  it("catálogo de actions está completo e sem executor", () => {
    assert.equal(RULE_ACTION_KINDS.length, 10);
    assert.equal(RULE_ACTION_CATALOG.length, 10);
    assert.equal(listActionCatalog().length, 10);

    for (const kind of RULE_ACTION_KINDS) {
      assert.equal(isKnownActionKind(kind), true);
    }

    assert.equal(isKnownActionKind("tissReject"), false);
    const action = defineAction("approve", { name: "approve-opaque" });
    assert.equal(action.kind, "approve");
    assert.equal(action.name, "approve-opaque");
  });

  it("catálogo de priorities está completo", () => {
    assert.deepEqual([...RULE_PRIORITIES], ["critical", "high", "medium", "low", "informational"]);
    assert.equal(RULE_PRIORITY_CATALOG.length, 5);
    assert.equal(listPriorities().length, 5);
    assert.equal(isKnownPriority("critical"), true);
    assert.equal(isKnownPriority("clinical"), false);
    assert.equal(getPriority("critical")?.rank, 0);
    assert.equal(getPriority("informational")?.rank, 4);
  });

  it("status nativos não incluem semântica clínica", () => {
    assert.deepEqual([...RULE_STATUSES], ["draft", "enabled", "disabled", "archived"]);
  });

  it("Rule Engine não expõe evaluate/parse/execute no Port", () => {
    const port = createRulePort({ provider: "mock" }) as unknown as Record<string, unknown>;
    assert.equal(typeof port.evaluate, "undefined");
    assert.equal(typeof port.evaluateRule, "undefined");
    assert.equal(typeof port.execute, "undefined");
    assert.equal(typeof port.parse, "undefined");
    assert.equal(typeof port.compile, "undefined");
  });
});
