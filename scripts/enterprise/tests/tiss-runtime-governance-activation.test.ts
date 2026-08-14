#!/usr/bin/env node
/**
 * S6-02 — Governance Real Activation.
 *
 * Prova:
 *   RealTissGovernanceRuntimeAdapter registrado como provider "real-tiss"
 *     → GovernanceRuntimeFactory / GovernanceRuntimeRegistry
 *     → createGovernanceRuntimePort({ provider: "real-tiss" })
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
  REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID,
  createGovernanceRuntimePort,
  createGovernanceRuntimeFactory,
  createDefaultGovernanceRuntimeRegistry,
  getGovernanceRuntimeFactory,
} from "../../../src/lib/enterprise/governance-runtime/index.ts";
import { getEnterpriseRuntime } from "../../../src/lib/enterprise/runtime/index.ts";

describe("S6-02 Governance Real Activation — real-tiss sem alterar Enterprise Runtime", () => {
  it("factory + registry resolvem provider real-tiss", () => {
    const port = createGovernanceRuntimePort({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
  });

  it("GovernanceRuntimePort mantém shape canônico com 9 métodos", () => {
    const port = createGovernanceRuntimePort({ provider: "real-tiss" });
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
    assert.equal(caps.governanceEngineImplemented, false);
    assert.equal(caps.tissGovernanceImplemented, false);
    assert.equal(caps.automaticCorrectionImplemented, false);
    assert.equal(caps.runtimeReady, true);
  });

  it("factory e registry resolvem todos os 5 providers", () => {
    const factory = createGovernanceRuntimeFactory();
    const registry = createDefaultGovernanceRuntimeRegistry();
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
    assert.equal(getGovernanceRuntimeFactory().getRegistry().has("real-tiss"), true);
  });

  it("getEnterpriseRuntime continua singleton e inalterado", () => {
    assert.equal(typeof getEnterpriseRuntime, "function");
    const r1 = getEnterpriseRuntime();
    const r2 = getEnterpriseRuntime();
    assert.equal(r1, r2);
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

  it("RealTissGovernanceRuntimeAdapter delega ao Default sem executar identidade real", async () => {
    const port = createGovernanceRuntimePort({ provider: "real-tiss" });
    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.governanceEngineImplemented, false);
    assert.equal(opened.result?.tissGovernanceImplemented, false);
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
  });

  it("todas as flags *Implemented das capabilities do real-tiss são false", () => {
    const port = createGovernanceRuntimePort({ provider: "real-tiss" });
    const caps = port.capabilities();
    for (const [key, value] of Object.entries(caps)) {
      if (key.endsWith("Implemented")) {
        assert.equal(value, false, `${key} deveria ser false`);
      }
    }
    assert.equal(caps.engine?.governanceEngineImplemented, false);
    assert.equal(caps.canonical?.governanceEngineImplemented, false);
  });
});
