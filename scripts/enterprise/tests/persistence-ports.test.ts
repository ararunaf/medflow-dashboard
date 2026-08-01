#!/usr/bin/env node
/**
 * EPC-01 — Persistence Ports Foundation
 * Prova Application → PersistencePort → Adapter sem tocar módulos de produção.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createPersistencePort,
  getPersistenceHealthSummary,
  MockPersistenceAdapter,
  SUPABASE_PERSISTENCE_ADAPTER_ID,
  SupabasePersistenceAdapter,
  type PersistencePort,
} from "../../../src/lib/enterprise/persistence/index.ts";

describe("EPC-01 PersistencePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: PersistencePort = new MockPersistenceAdapter({ mechanism: "mock" });
    assert.equal(port.mechanismId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.mechanism, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRowLevelSecurity, false);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createPersistencePort({ mechanism: "test" });
    assert.equal(port.mechanismId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Supabase adapter não vaza tipos de vendor no Port e usa runtime injetado", async () => {
    const port: PersistencePort = new SupabasePersistenceAdapter({
      isConfigured: () => true,
    });

    assert.equal(port.mechanismId, "supabase");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, SUPABASE_PERSISTENCE_ADAPTER_ID);
    assert.equal(caps.supportsRowLevelSecurity, true);
    assert.equal(caps.supportsRealtime, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.mechanism, "supabase");
    assert.match(health.message ?? "", /configurado/i);
  });

  it("Supabase adapter reporta unhealthy quando config ausente", async () => {
    const port = new SupabasePersistenceAdapter({
      isConfigured: () => false,
    });
    const health = await port.health();
    assert.equal(health.ok, false);
    assert.match(health.message ?? "", /ausente/i);
  });

  it("Supabase adapter usa ping opcional sem alterar contrato", async () => {
    const port = new SupabasePersistenceAdapter({
      isConfigured: () => true,
      ping: async () => ({ ok: true, message: "probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve supabase; futuros DBs falham explicitamente", () => {
    const defaultPort = createPersistencePort();
    assert.equal(defaultPort.mechanismId, "supabase");

    assert.throws(
      () => createPersistencePort({ mechanism: "postgres" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createPersistencePort({ mechanism: "sqlserver" }),
      /ainda não implementado/i,
    );
    assert.throws(() => createPersistencePort({ mechanism: "oracle" }), /ainda não implementado/i);
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createPersistencePort({ mechanism: "mock" });
    const summary = await getPersistenceHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.mechanism, "mock");
    assert.equal(summary.capabilities.mechanism, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("Port interface não expõe superfície Supabase", () => {
    const port: PersistencePort = new MockPersistenceAdapter();
    const keys = Object.keys(port).sort();
    assert.ok(!keys.includes("from"));
    assert.ok(!keys.includes("supabase"));
    assert.ok(!keys.includes("auth"));
    assert.ok(!keys.includes("storage"));
    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.mechanismId, "string");
  });
});
