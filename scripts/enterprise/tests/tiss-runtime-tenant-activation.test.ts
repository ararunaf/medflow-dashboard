#!/usr/bin/env node
/**
 * S3-02 — Tenant Real Activation.
 *
 * Prova:
 *   RealTissTenantRuntimeAdapter registrado como provider "real-tiss"
 *     → TenantRuntimeFactory / TenantRuntimeRegistry
 *     → createTenantRuntimePort({ provider: "real-tiss" })
 *     → getEnterpriseRuntime() inalterado
 *     → Queue / Worker / Scheduler inalterados
 *
 * Sem novo Port / Runtime / Pipeline / Queue / Worker / Scheduler / Retry / DLQ / Observability.
 * Sem identidade real, criptografia, assinatura digital, cadeia de custódia, Key Vault, HSM, SIEM, OpenTelemetry, LGPD, autenticação ou autorização.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

import {
  REALTISS_TENANT_RUNTIME_ADAPTER_ID,
  createTenantRuntimePort,
  createTenantRuntimeFactory,
  createDefaultTenantRuntimeRegistry,
  getTenantRuntimeFactory,
} from "../../../src/lib/enterprise/tenant-runtime/index.ts";
import { getEnterpriseRuntime } from "../../../src/lib/enterprise/runtime/index.ts";

describe("S3-02 Tenant Real Activation — real-tiss sem alterar Enterprise Runtime", () => {
  it("factory + registry resolvem provider real-tiss", () => {
    const port = createTenantRuntimePort({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_TENANT_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
  });

  it("TenantRuntimePort mantém shape canônico com 9 métodos", () => {
    const port = createTenantRuntimePort({ provider: "real-tiss" });
    assert.equal(typeof port.openJob, "function");
    assert.equal(typeof port.closeJob, "function");
    assert.equal(typeof port.submitRequest, "function");
    assert.equal(typeof port.registerFinding, "function");
    assert.equal(typeof port.getResult, "function");
    assert.equal(typeof port.stats, "function");
    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.providerInfo, "function");
    const caps = port.capabilities();
    assert.equal(caps.tenantEngineImplemented, false);
    assert.equal(caps.tissTenantImplemented, false);
    assert.equal(caps.automaticCorrectionImplemented, false);
    assert.equal(caps.runtimeReady, true);
  });

  it("factory e registry resolvem todos os 5 providers", () => {
    const factory = createTenantRuntimeFactory();
    const registry = createDefaultTenantRuntimeRegistry();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(getTenantRuntimeFactory().getRegistry().has("real-tiss"), true);
  });

  it("getEnterpriseRuntime continua singleton e inalterado", () => {
    assert.equal(typeof getEnterpriseRuntime, "function");
    const r1 = getEnterpriseRuntime();
    const r2 = getEnterpriseRuntime();
    assert.equal(r1, r2);
    // Enterprise Runtime NÃO foi modificado nesta sprint.
    // Métodos canônicos preservados.
    assert.equal(typeof r1.getQueueRuntimePort, "function");
    assert.equal(typeof r1.getWorkerRuntimePort, "function");
    assert.equal(typeof r1.getSchedulerRuntimePort, "function");
    assert.equal(typeof r1.getObservabilityRuntimePort, "function");
  });

  it("Queue / Worker / Scheduler permanecem inalterados", async () => {
    const runtime = getEnterpriseRuntime();
    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();
    assert.ok(queue.providerId);
    assert.ok(worker.providerId);
    assert.ok(scheduler.providerId);
    const queueHealth = await queue.health();
    const workerHealth = await worker.health();
    const schedulerHealth = await scheduler.health();
    assert.equal(queueHealth.ok, true);
    assert.equal(workerHealth.ok, true);
    assert.equal(schedulerHealth.ok, true);
  });

  it("RealTissTenantRuntimeAdapter delega ao Default sem executar identidade real", async () => {
    const port = createTenantRuntimePort({ provider: "real-tiss" });
    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.tenantEngineImplemented, false);
    assert.equal(opened.result?.tissTenantImplemented, false);
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
  });
});
