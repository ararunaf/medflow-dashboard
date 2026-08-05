#!/usr/bin/env node
/**
 * C-09 — Enterprise Reconciliation Runtime Foundation
 * Prova: Application → ReconciliationRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareReconciliation / getReconciliation / listReconciliations /
 *           correlateReconciliation / stats
 *         + Enterprise Runtime + deps estruturais (Return/Protocol/Batch/
 *           Authorization/Operator/Audit)
 *         + contrato ReconciliationManifest + CanonicalReconciliationResult +
 *           ReconciliationStateMachine + ReconciliationContext + RULE_04
 *         + ausência de reconciliação funcional / matching automático /
 *           resolução de conflitos / comparação / XML / SOAP / banco / APIs / filas
 *         + Regra Permanente nº 16 (RECONCILIATION IS DETERMINISTIC)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_RECONCILIATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID,
  DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultReconciliationRuntimeAdapter,
  EnterpriseReconciliationRuntimeAdapter,
  IN_MEMORY_RECONCILIATION_RUNTIME_STORE_ID,
  InMemoryReconciliationRuntimeStore,
  MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID,
  MockReconciliationRuntimeAdapter,
  RECONCILIATION_CANONICAL_STATES,
  RECONCILIATION_RUNTIME_IDENTITY,
  ReconciliationRuntimeFactory,
  ReconciliationRuntimeProvider,
  ReconciliationRuntimeRegistry,
  createDefaultReconciliationRuntimeRegistry,
  createEmptyCanonicalReconciliationResult,
  createEmptyReconciliationCorrelation,
  createEmptyReconciliationManifest,
  createEmptyReconciliationStateMachine,
  createReconciliationRuntimeFactory,
  createReconciliationRuntimePort,
  getReconciliationRuntimeFactory,
  getReconciliationRuntimeHealthSummary,
  getReconciliationRuntimePort,
  resetAllReconciliationRuntimeIdSequences,
  type CanonicalReconciliationResult,
  type ReconciliationContext,
  type ReconciliationCorrelation,
  type ReconciliationManifest,
  type ReconciliationRuntimePort,
  type ReconciliationStateMachine,
} from "../../../src/lib/enterprise/reconciliation-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

function assertStructuralFlagsFalse(obj: Record<string, unknown>) {
  const flags = [
    "reconciliationImplemented",
    "conflictResolutionImplemented",
    "automaticMatchingImplemented",
    "workflowIntegrationImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleStateMachine(
  overrides: Partial<ReconciliationStateMachine> = {},
): ReconciliationStateMachine {
  return createEmptyReconciliationStateMachine(overrides);
}

function sampleManifest(overrides: Partial<ReconciliationManifest> = {}): ReconciliationManifest {
  return createEmptyReconciliationManifest({
    transactionId: "tx-structural",
    batchId: "batch-structural",
    operatorId: "op-structural",
    protocolId: "protocol-structural",
    correlationId: "corr-structural",
    returnId: "return-structural",
    state: "PENDING",
    owner: "enterprise-foundation",
    tags: ["c-09", "structural"],
    ...overrides,
  });
}

function sampleCorrelation(
  overrides: Partial<ReconciliationCorrelation> = {},
): ReconciliationCorrelation {
  return createEmptyReconciliationCorrelation({
    transactionId: "tx-structural",
    batchId: "batch-structural",
    operatorId: "op-structural",
    returnId: "return-structural",
    documentId: "doc-structural",
    correlationStrategy: "structural",
    correlationConfidence: 0,
    matchedEntities: [],
    ...overrides,
  });
}

function sampleResult(
  overrides: Partial<CanonicalReconciliationResult> = {},
): CanonicalReconciliationResult {
  return createEmptyCanonicalReconciliationResult({
    transactionId: "tx-structural",
    batchId: "batch-structural",
    operatorId: "op-structural",
    matchedDocuments: [],
    unmatchedDocuments: [],
    conflicts: [],
    differences: [],
    pendingItems: [],
    recommendations: [],
    auditReference: "audit-structural",
    ...overrides,
  });
}

function sampleReconciliationContext(
  overrides: Partial<ReconciliationContext> = {},
): ReconciliationContext {
  const manifest = sampleManifest();
  return {
    kind: "canonical-reconciliation-context",
    contextId: "reconciliation-context-structural",
    reconciliationId: manifest.reconciliationId,
    transactionId: manifest.transactionId,
    manifest,
    state: manifest.state,
    stateMachine: manifest.stateMachine,
    result: sampleResult(),
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "PENDING",
    executionDuration: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-09" },
    structuralNotes: "C-09 structural only",
    ...overrides,
  };
}

describe("C-09 ReconciliationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem reconciliação funcional", async () => {
    const port: ReconciliationRuntimePort = new MockReconciliationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareReconciliation, true);
    assert.equal(caps.supportsGetReconciliation, true);
    assert.equal(caps.supportsListReconciliations, true);
    assert.equal(caps.supportsCorrelateReconciliation, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.supportsCanonicalReconciliationManifest, true);
    assert.equal(caps.supportsCanonicalReconciliationResult, true);
    assert.equal(caps.supportsReconciliationCorrelation, true);
    assert.equal(caps.supportsReconciliationStateMachine, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultReconciliationRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseReconciliationRuntimeAdapter, DefaultReconciliationRuntimeAdapter);
    const port = new DefaultReconciliationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID);
  });

  it("identidade vendor-agnostic Foundation", () => {
    assert.equal(RECONCILIATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(RECONCILIATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.match(RECONCILIATION_RUNTIME_IDENTITY.name, /Reconciliation Runtime/i);
  });

  it("Provider default resolve enterprise via create/get/Provider", () => {
    const a = createReconciliationRuntimePort();
    const b = getReconciliationRuntimePort();
    const c = ReconciliationRuntimeProvider.create();
    assert.equal(a.providerId, "enterprise");
    assert.equal(b.providerId, "enterprise");
    assert.equal(c.providerId, "enterprise");
    assert.equal(ReconciliationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(getReconciliationRuntimeFactory());
  });

  it("Factory resolve mock/test/default/enterprise", () => {
    const factory = createReconciliationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
  });

  it("Registry registra exatamente 4 providers", () => {
    const registry = createDefaultReconciliationRuntimeRegistry();
    assert.equal(registry.snapshot().count, BUILTIN_RECONCILIATION_RUNTIME_PROVIDER_COUNT);
    assert.equal(BUILTIN_RECONCILIATION_RUNTIME_PROVIDER_COUNT, 4);
    for (const id of ["mock", "test", "default", "enterprise"] as const) {
      assert.equal(registry.has(id), true);
    }
    assert.ok(new ReconciliationRuntimeRegistry());
  });

  it("prepareReconciliation / getReconciliation / listReconciliations / stats são estruturais", async () => {
    resetAllReconciliationRuntimeIdSequences();
    const port = createReconciliationRuntimePort({ provider: "enterprise" });
    const prepared = await port.prepareReconciliation({
      ...sampleManifest(),
      result: sampleResult(),
      reconciliationContext: sampleReconciliationContext(),
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.reconciled, false);
    assert.equal(prepared.reconciliationImplemented, false);
    assert.equal(prepared.conflictResolutionImplemented, false);
    assert.equal(prepared.automaticMatchingImplemented, false);
    assert.equal(prepared.workflowIntegrationImplemented, false);
    assert.ok(prepared.manifest);
    assert.equal(prepared.manifest?.state, "PENDING");
    assert.ok(prepared.manifest?.transactionId);
    assert.ok(prepared.result);
    assert.equal(prepared.result?.kind, "canonical-reconciliation-result");
    assertStructuralFlagsFalse(prepared.manifest as unknown as Record<string, unknown>);
    assertStructuralFlagsFalse(prepared.result as unknown as Record<string, unknown>);

    const got = await port.getReconciliation({
      reconciliationId: prepared.manifest?.reconciliationId,
    });
    assert.equal(got.ok, true);
    assert.equal(got.manifest?.reconciliationId, prepared.manifest?.reconciliationId);

    const listed = await port.listReconciliations({ state: "PENDING" });
    assert.equal(listed.ok, true);
    assert.ok(listed.manifests.length >= 1);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok(stats.statistics);
    assert.equal(stats.statistics?.reconciliationImplementedCount, 0);
    assert.equal(stats.statistics?.automaticMatchingImplementedCount, 0);
    assert.equal(stats.statistics?.conflictResolutionImplementedCount, 0);
  });

  it("correlateReconciliation permanece não implementado funcionalmente (RULE_16)", async () => {
    const port = createReconciliationRuntimePort({ provider: "enterprise" });
    const result = await port.correlateReconciliation({
      ...sampleCorrelation(),
    });
    assert.equal(result.ok, true);
    assert.equal(result.matched, false);
    assert.equal(result.automaticMatchingImplemented, false);
    assert.equal(result.reconciliationImplemented, false);
    assert.equal(result.conflictResolutionImplemented, false);
    assert.equal(result.code, "RECONCILIATION_RUNTIME_MATCHING_NOT_IMPLEMENTED");
    assert.ok(result.correlation);
    assert.equal(result.correlation?.automaticMatchingImplemented, false);
  });

  it("InMemoryReconciliationRuntimeStore é in-process", () => {
    const store = new InMemoryReconciliationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_RECONCILIATION_RUNTIME_STORE_ID);
    store.setManifest(sampleManifest({ reconciliationId: "r1" }));
    assert.equal(store.manifestCount(), 1);
    assert.equal(store.health().ok, true);
  });

  it("demo health summary via Port", async () => {
    const port = createReconciliationRuntimePort({ provider: "mock" });
    const summary = await getReconciliationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.supportsPrepareReconciliation, true);
  });

  it("contratos canônicos CanonicalReconciliationResult / ReconciliationStateMachine", () => {
    const sm = sampleStateMachine();
    assert.equal(sm.kind, "canonical-reconciliation-state-machine");
    assert.equal(sm.transitionsImplemented, false);
    assert.equal(sm.stateMachineImplemented, false);
    assert.deepEqual([...sm.states], [...RECONCILIATION_CANONICAL_STATES]);

    const manifest = sampleManifest();
    assert.equal(manifest.kind, "canonical-reconciliation-manifest");
    assert.ok(manifest.transactionId);
    assert.ok(manifest.batchId);
    assert.ok(manifest.operatorId);
    assert.ok(manifest.state);
    assert.ok(manifest.metadata);
    assert.ok(manifest.reconciliationPolicy);

    const result = sampleResult();
    assert.equal(result.kind, "canonical-reconciliation-result");
    assert.ok(result.transactionId);
    assert.ok(result.batchId);
    assert.ok(result.operatorId);
    assert.ok(Array.isArray(result.matchedDocuments));
    assert.ok(Array.isArray(result.unmatchedDocuments));
    assert.ok(Array.isArray(result.conflicts));
    assert.ok(Array.isArray(result.differences));
    assert.ok(Array.isArray(result.pendingItems));
    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.auditReference);
    assert.ok(result.metadata);
    assertStructuralFlagsFalse(result as unknown as Record<string, unknown>);

    const correlation = sampleCorrelation();
    assert.equal(correlation.kind, "canonical-reconciliation-correlation");
    assert.ok(correlation.transactionId);
    assert.ok(correlation.batchId);
    assert.ok(correlation.operatorId);
  });

  it("estados canônicos oficiais (sem transições)", () => {
    const expected = [
      "PENDING",
      "CORRELATED",
      "RECONCILING",
      "RECONCILED",
      "PARTIALLY_RECONCILED",
      "CONFLICT",
      "FAILED",
      "CANCELLED",
    ];
    assert.deepEqual([...RECONCILIATION_CANONICAL_STATES], expected);
  });

  it("ReconciliationContext prevê envelope RULE_04", () => {
    const ctx = sampleReconciliationContext();
    assert.equal(ctx.kind, "canonical-reconciliation-context");
    assert.ok(ctx.manifest);
    assert.ok(ctx.stateMachine ?? ctx.manifest?.stateMachine);
    assert.equal(ctx.operationId, "op-structural");
    assert.equal(ctx.correlationId, "corr-structural");
    assert.equal(ctx.transactionId, "tx-structural");
    assert.ok(ctx.startedAt);
    assert.ok(ctx.finishedAt);
    assert.equal(ctx.executionStatus, "PENDING");
    assert.equal(ctx.executionDuration, 0);
    assert.ok(Array.isArray(ctx.warnings));
    assert.ok(Array.isArray(ctx.errors));
    assert.ok(ctx.traceMetadata);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createReconciliationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareReconciliation({
      transactionId: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "RECONCILIATION_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultReconciliationRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new ReconciliationRuntimeFactory({ registry });
    assert.throws(
      () => factory.create({ provider: "unknown" as never }),
      /não está registrado/,
    );
  });

  it("Enterprise Runtime expõe ReconciliationRuntimePort + health.reconciliationRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getReconciliationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.reconciliationRuntimeOk, true);
    assert.equal(health.returnRuntimeOk, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getReconciliationRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.returnRuntimeOk, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/XML lib/DB e não reconcilia", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/reconciliation-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']@azure\/openai/i,
      /from ["']anthropic/i,
      /from ["']soap["']/,
      /require\(["']soap["']\)/,
      /from ["']axios["']/,
      /\bfetch\s*\(/,
      /["']https?:\/\//,
      /new\s+FormData\s*\(/,
      /from ["']pg["']/,
      /from ["']postgres/i,
      /createClient\s*\(/,
      /\bXMLSerializer\b/,
      /\bDOMParser\b/,
      /from ["']libxml/i,
      /from ["']fast-xml-parser/i,
      /from ["']xml2js/i,
      /from ["']node-forge/i,
      /tls\.connect\s*\(/,
      /https\.request\s*\(/,
      /http\.request\s*\(/,
      /BullMQ|bullmq|ioredis|amqplib|kafka/i,
      /Worker\s*\(/,
      /setInterval\s*\(/,
      /\bif\s*\([^)]*operadora/i,
      /\bswitch\s*\([^)]*operadora/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        const codeWithoutBlockComments = source
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        assert.equal(
          pattern.test(codeWithoutBlockComments),
          false,
          `${file} contém padrão proibido: ${pattern}`,
        );
      }
    }
  });

  it("Enterprise Runtime wiring inclui createReconciliationRuntimePort + reconciliationRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createReconciliationRuntimePort"));
    assert.ok(source.includes("reconciliationRuntimeOk"));
    assert.ok(source.includes("getReconciliationRuntimePort"));
    assert.ok(source.includes("getReturnRuntimePort"));
    assert.ok(source.includes("getProtocolRuntimePort"));
    assert.ok(source.includes("getBatchRuntimePort"));
    assert.ok(source.includes("C-09"));
  });

  it("documentação C-09 e Regra Permanente nº 16 existem", () => {
    const docs = [
      "docs/enterprise/C09_ENTERPRISE_RECONCILIATION_RUNTIME.md",
      "docs/enterprise/C09_RECONCILIATION_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C09_RECONCILIATION_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule16 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md"),
      "utf8",
    );
    assert.match(rule16, /RECONCILIATION IS DETERMINISTIC/i);
    assert.match(rule16, /CanonicalReconciliationResult/);
    assert.match(rule16, /ReconciliationStateMachine/);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(
      DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES.reconciliationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES.conflictResolutionImplemented,
      false,
    );
    assert.equal(
      DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES.automaticMatchingImplemented,
      false,
    );
    assert.equal(
      DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES.workflowIntegrationImplemented,
      false,
    );
  });
});
