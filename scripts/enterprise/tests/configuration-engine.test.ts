#!/usr/bin/env node
/**
 * EPC-03 — Configuration Engine Foundation
 * Prova Application → ConfigurationPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONFIGURATION_HIERARCHY,
  CONFIGURATION_RESOLUTION_ORDER,
  createConfigurationPort,
  DEFAULT_CONFIGURATION_ADAPTER_ID,
  DefaultConfigurationAdapter,
  DefaultConfigurationStore,
  getConfigurationHealthSummary,
  getFeatureFlagState,
  getOfficialConfigurationHierarchy,
  getConfigurationResolutionOrder,
  MockConfigurationAdapter,
  setFeatureFlagState,
  type ConfigurationPort,
  type ConfigurationValue,
} from "../../../src/lib/enterprise/configuration/index.ts";

describe("EPC-03 ConfigurationPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ConfigurationPort = new MockConfigurationAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsGet, true);
    assert.equal(caps.supportsSet, true);
    assert.equal(caps.supportsHierarchicalResolution, true);
    assert.equal(caps.supportsFeatureFlags, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createConfigurationPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultConfigurationStore();
    const port: ConfigurationPort = new DefaultConfigurationAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_CONFIGURATION_ADAPTER_ID);
    assert.equal(caps.supportsList, true);
    assert.equal(caps.supportsRemove, true);
    assert.equal(caps.supportsExists, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultConfigurationAdapter({
      store: new DefaultConfigurationStore(),
      ping: async () => ({ ok: true, message: "config probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "config probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultConfigurationAdapter; futuros falham explicitamente", () => {
    const defaultPort = createConfigurationPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createConfigurationPort({ provider: "env" }), /ainda não implementado/i);
    assert.throws(() => createConfigurationPort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(
      () => createConfigurationPort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(() => createConfigurationPort({ provider: "redis" }), /ainda não implementado/i);
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createConfigurationPort({ provider: "mock" });
    const summary = await getConfigurationHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("get/set/exists/remove/list funcionam no Mock", async () => {
    const port = new MockConfigurationAdapter();
    const value: ConfigurationValue = { kind: "string", value: "alpha" };

    const set = await port.set({ key: "ui.theme", value, scope: { layer: "platform" } });
    assert.equal(set.ok, true);

    const exists = await port.exists({ key: "ui.theme", scope: { layer: "platform" } });
    assert.equal(exists.exists, true);

    const get = await port.get({ key: "ui.theme", scope: { layer: "platform" } });
    assert.equal(get.ok, true);
    assert.equal(get.entry?.value.kind, "string");
    if (get.entry?.value.kind === "string") {
      assert.equal(get.entry.value.value, "alpha");
    }

    const list = await port.list({ prefix: "ui." });
    assert.equal(list.ok, true);
    assert.equal(list.entries.length >= 1, true);

    const removed = await port.remove({ key: "ui.theme", scope: { layer: "platform" } });
    assert.equal(removed.removed, true);
    const missing = await port.get({ key: "ui.theme", scope: { layer: "platform" } });
    assert.equal(missing.ok, false);
  });

  it("Default adapter get/set/list com store injetado", async () => {
    const store = new DefaultConfigurationStore();
    const port = new DefaultConfigurationAdapter({ store });

    await port.set({
      key: "limits.max",
      value: { kind: "number", value: 42 },
      scope: { layer: "tenant", id: "t1" },
    });

    const get = await port.get({
      key: "limits.max",
      scope: { layer: "tenant", id: "t1" },
    });
    assert.equal(get.ok, true);
    assert.equal(get.entry?.value.kind, "number");

    const list = await port.list({ scope: { layer: "tenant", id: "t1" } });
    assert.equal(list.ok, true);
    assert.equal(
      list.entries.some((e) => e.key === "limits.max"),
      true,
    );
  });

  it("aceita tipagem Boolean/Number/String/Enum/JSON/Collections", async () => {
    const port = new MockConfigurationAdapter();
    const samples: ConfigurationValue[] = [
      { kind: "boolean", value: true },
      { kind: "number", value: 3.14 },
      { kind: "string", value: "ok" },
      { kind: "enum", value: "A", enumName: "Letter" },
      { kind: "json", value: { nested: true } },
      { kind: "collection", value: [1, "x", false] },
    ];

    for (const [i, value] of samples.entries()) {
      const key = `typed.${i}`;
      const set = await port.set({ key, value });
      assert.equal(set.ok, true);
      const get = await port.get({ key });
      assert.equal(get.ok, true);
      assert.equal(get.entry?.value.kind, value.kind);
    }
  });

  it("hierarquia oficial e ordem de resolução estão preparadas", () => {
    assert.deepEqual([...getOfficialConfigurationHierarchy()], [...CONFIGURATION_HIERARCHY]);
    assert.deepEqual(
      [...CONFIGURATION_HIERARCHY],
      ["application", "platform", "environment", "tenant", "module", "feature", "user"],
    );
    assert.deepEqual([...getConfigurationResolutionOrder()], [...CONFIGURATION_RESOLUTION_ORDER]);
    assert.deepEqual(
      [...CONFIGURATION_RESOLUTION_ORDER],
      ["user", "module", "tenant", "platform", "default"],
    );
  });

  it("resolução hierárquica mínima: User → Module → Tenant → Platform → Default", async () => {
    const port = new MockConfigurationAdapter();
    const key = "feature.x.enabled";

    await port.set({
      key,
      value: { kind: "boolean", value: false },
      scope: { layer: "application" },
    });
    await port.set({
      key,
      value: { kind: "boolean", value: true },
      scope: { layer: "tenant", id: "tenant-a" },
    });

    const fromTenant = await port.get({
      key,
      resolveHierarchy: true,
      resolutionContext: { tenantId: "tenant-a" },
    });
    assert.equal(fromTenant.ok, true);
    assert.equal(fromTenant.entry?.value.kind, "boolean");
    if (fromTenant.entry?.value.kind === "boolean") {
      assert.equal(fromTenant.entry.value.value, true);
    }
    assert.equal(fromTenant.entry?.resolvedFrom, "tenant");

    const fromDefault = await port.get({
      key,
      resolveHierarchy: true,
      resolutionContext: { tenantId: "other" },
    });
    assert.equal(fromDefault.ok, true);
    if (fromDefault.entry?.value.kind === "boolean") {
      assert.equal(fromDefault.entry.value.value, false);
    }
    assert.equal(fromDefault.entry?.resolvedFrom, "default");
  });

  it("Feature Flags infraestrutura existe e NÃO exige uso em produto", async () => {
    const port = new MockConfigurationAdapter();
    const set = await setFeatureFlagState(port, "enterprise.config.demo", true);
    assert.equal(set.ok, true);

    const state = await getFeatureFlagState(port, {
      key: "enterprise.config.demo",
      defaultEnabled: false,
    });
    assert.equal(state.enabled, true);
    assert.equal(state.resolvedFrom, "feature");

    const fallback = await getFeatureFlagState(port, {
      key: "missing.flag",
      defaultEnabled: true,
    });
    assert.equal(fallback.enabled, true);
    assert.equal(fallback.resolvedFrom, "definition-default");
  });

  it("readLegacy do runtime Default é consultado sem alterar Settings", async () => {
    const store = new DefaultConfigurationStore();
    const port = new DefaultConfigurationAdapter({
      store,
      readLegacy: (storageKey) => {
        if (storageKey === "application/legacy.mode") {
          return {
            key: "legacy.mode",
            value: { kind: "string", value: "compat" },
            scope: { layer: "application" },
          };
        }
        return undefined;
      },
    });

    const get = await port.get({ key: "legacy.mode" });
    assert.equal(get.ok, true);
    if (get.entry?.value.kind === "string") {
      assert.equal(get.entry.value.value, "compat");
    }
  });

  it("Port interface não expõe superfície de domínio (cooperativa/OCR/IA)", () => {
    const port: ConfigurationPort = new MockConfigurationAdapter();
    const keys = Object.keys(port).sort();
    assert.ok(!keys.includes("cooperativa"));
    assert.ok(!keys.includes("operadora"));
    assert.ok(!keys.includes("ocr"));
    assert.ok(!keys.includes("supabase"));
    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.get, "function");
    assert.equal(typeof port.set, "function");
    assert.equal(typeof port.exists, "function");
    assert.equal(typeof port.remove, "function");
    assert.equal(typeof port.list, "function");
    assert.equal(typeof port.providerId, "string");
  });
});
