#!/usr/bin/env node
/**
 * EPC-02 — Storage Ports Foundation
 * Prova Application → StoragePort → Adapter sem tocar módulos de produção.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createStoragePort,
  getStorageHealthSummary,
  MockStorageAdapter,
  SUPABASE_STORAGE_ADAPTER_ID,
  SupabaseStorageAdapter,
  type StorageDocumentContext,
  type StoragePort,
} from "../../../src/lib/enterprise/storage/index.ts";

describe("EPC-02 StoragePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: StoragePort = new MockStorageAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsPut, true);
    assert.equal(caps.supportsSignedUrl, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createStoragePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Supabase adapter não vaza tipos de vendor no Port e usa runtime injetado", async () => {
    const port: StoragePort = new SupabaseStorageAdapter({
      isConfigured: () => true,
    });

    assert.equal(port.providerId, "supabase");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, SUPABASE_STORAGE_ADAPTER_ID);
    assert.equal(caps.supportsPut, true);
    assert.equal(caps.supportsGet, true);
    assert.equal(caps.supportsDelete, true);
    assert.equal(caps.supportsSignedUrl, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "supabase");
    assert.match(health.message ?? "", /configurado/i);
  });

  it("Supabase adapter reporta unhealthy quando config ausente", async () => {
    const port = new SupabaseStorageAdapter({
      isConfigured: () => false,
    });
    const health = await port.health();
    assert.equal(health.ok, false);
    assert.match(health.message ?? "", /ausente/i);
  });

  it("Supabase adapter usa ping opcional sem alterar contrato", async () => {
    const port = new SupabaseStorageAdapter({
      isConfigured: () => true,
      ping: async () => ({ ok: true, message: "storage probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "storage probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("Supabase ops não bound retornam ok:false sem I/O (fundação)", async () => {
    const port = new SupabaseStorageAdapter({ isConfigured: () => true });
    const put = await port.put({ key: "a/b.pdf", body: "x" });
    assert.equal(put.ok, false);
    assert.match(put.message ?? "", /não vinculado/i);

    const get = await port.get({ key: "a/b.pdf" });
    assert.equal(get.ok, false);

    const del = await port.delete({ key: "a/b.pdf" });
    assert.equal(del.ok, false);

    const url = await port.signedUrl({ key: "a/b.pdf" });
    assert.equal(url.ok, false);
  });

  it("Supabase ops usam delegates do runtime sem vazar SDK", async () => {
    const port = new SupabaseStorageAdapter({
      isConfigured: () => true,
      put: async (input) => ({ ok: true, key: input.key, etag: "e1" }),
      get: async (input) => ({
        ok: true,
        key: input.key,
        body: new TextEncoder().encode("ok"),
        contentType: "text/plain",
      }),
      delete: async (input) => ({ ok: true, key: input.key }),
      signedUrl: async (input) => ({
        ok: true,
        key: input.key,
        url: `https://example.test/${input.key}`,
      }),
    });

    const put = await port.put({ key: "doc.bin", body: new Uint8Array([1, 2]) });
    assert.equal(put.ok, true);
    assert.equal(put.etag, "e1");

    const get = await port.get({ key: "doc.bin" });
    assert.equal(get.ok, true);
    assert.equal(get.contentType, "text/plain");

    const del = await port.delete({ key: "doc.bin" });
    assert.equal(del.ok, true);

    const signed = await port.signedUrl({ key: "doc.bin", expiresInSeconds: 30 });
    assert.equal(signed.ok, true);
    assert.match(signed.url ?? "", /example\.test/);
  });

  it("provider default resolve supabase; futuros provedores falham explicitamente", () => {
    const defaultPort = createStoragePort();
    assert.equal(defaultPort.providerId, "supabase");

    assert.throws(() => createStoragePort({ provider: "azure-blob" }), /ainda não implementado/i);
    assert.throws(() => createStoragePort({ provider: "s3" }), /ainda não implementado/i);
    assert.throws(() => createStoragePort({ provider: "gcs" }), /ainda não implementado/i);
    assert.throws(() => createStoragePort({ provider: "nas" }), /ainda não implementado/i);
    assert.throws(() => createStoragePort({ provider: "local" }), /ainda não implementado/i);
    assert.throws(() => createStoragePort({ provider: "sharepoint" }), /ainda não implementado/i);
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createStoragePort({ provider: "mock" });
    const summary = await getStorageHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("Mock put/get/delete/signedUrl funciona em memória", async () => {
    const port = new MockStorageAdapter();
    const put = await port.put({
      key: "tenant/docs/1.pdf",
      body: "hello",
      contentType: "application/pdf",
    });
    assert.equal(put.ok, true);

    const get = await port.get({ key: "tenant/docs/1.pdf" });
    assert.equal(get.ok, true);
    assert.equal(new TextDecoder().decode(get.body), "hello");
    assert.equal(get.contentType, "application/pdf");

    const signed = await port.signedUrl({ key: "tenant/docs/1.pdf", expiresInSeconds: 10 });
    assert.equal(signed.ok, true);
    assert.match(signed.url ?? "", /^mock:\/\//);

    const del = await port.delete({ key: "tenant/docs/1.pdf" });
    assert.equal(del.ok, true);
    const missing = await port.get({ key: "tenant/docs/1.pdf" });
    assert.equal(missing.ok, false);
  });

  it("Port aceita StorageDocumentContext opcional sem quebrar assinatura (prep EPC-08)", async () => {
    const port = new MockStorageAdapter();
    const document: StorageDocumentContext = {
      documentId: "doc-1",
      tenantId: "tenant-1",
      metadata: { source: "unit-test" },
      version: 1,
      hash: "abc",
      tags: ["guia"],
      origin: "capture",
      correlationId: "corr-1",
    };

    const put = await port.put({
      key: "k",
      body: "x",
      document,
    });
    assert.equal(put.ok, true);

    const get = await port.get({ key: "k", document });
    assert.equal(get.ok, true);

    const signed = await port.signedUrl({ key: "k", document, expiresInSeconds: 5 });
    assert.equal(signed.ok, true);

    const del = await port.delete({ key: "k", document });
    assert.equal(del.ok, true);
  });

  it("Port interface não expõe superfície Supabase / buckets", () => {
    const port: StoragePort = new MockStorageAdapter();
    const keys = Object.keys(port).sort();
    assert.ok(!keys.includes("from"));
    assert.ok(!keys.includes("supabase"));
    assert.ok(!keys.includes("bucket"));
    assert.ok(!keys.includes("storage"));
    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.put, "function");
    assert.equal(typeof port.get, "function");
    assert.equal(typeof port.delete, "function");
    assert.equal(typeof port.signedUrl, "function");
    assert.equal(typeof port.providerId, "string");
  });
});
