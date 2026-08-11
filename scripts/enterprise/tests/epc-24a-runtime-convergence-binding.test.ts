/**
 * EPC-24A — Enterprise Runtime Convergence Binding (coordenação).
 *
 * Valida o composition root e o binding Capture → Runtime.
 * Não altera comportamento funcional nem Foundations.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAPTURE_ENTERPRISE_RUNTIME_ENTRY,
  resolveCaptureEnterpriseRuntime,
} from "../../../src/lib/capture/enterprise/resolve-enterprise-runtime";
import { probeCaptureEnterpriseRuntimeBinding } from "../../../src/lib/capture/enterprise/capture-runtime-binding";
import {
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime";

describe("EPC-24A — Enterprise Runtime Convergence Binding", () => {
  it("declara getEnterpriseRuntime como entrypoint oficial do Capture", () => {
    assert.equal(CAPTURE_ENTERPRISE_RUNTIME_ENTRY, "getEnterpriseRuntime");
  });

  it("resolveCaptureEnterpriseRuntime retorna o mesmo singleton de getEnterpriseRuntime", () => {
    resetEnterpriseRuntimeForTests();
    const viaResolver = resolveCaptureEnterpriseRuntime();
    const viaOfficial = getEnterpriseRuntime();
    assert.equal(viaResolver, viaOfficial);
    assert.equal(viaResolver.runtimeId, "default");
  });

  it("probe de binding alcança Orchestrator e Capture Engine via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureEnterpriseRuntimeBinding();
    assert.ok(probe, "probe não deve falhar no Runtime estrutural");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.runtimeId, "default");
    assert.equal(probe.orchestratorOk, true);
    assert.equal(probe.captureEngineOk, true);
  });
});
