#!/usr/bin/env node
/**
 * C-08 — Enterprise Return Runtime Foundation
 * Prova: Application → ReturnRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareReturn / getReturn / listReturns / correlateReturn / stats
 *         + Enterprise Runtime + deps estruturais (Protocol/Batch/Authorization/
 *           Operator/SOAP/XML/XMLValidation/Audit)
 *         + contrato ReturnManifest + ReturnCorrelation + ReturnStateMachine
 *           + ReturnContext + envelope de observabilidade RULE_04
 *         + ausência de processamento de retorno / correlação automática /
 *           reconciliação / parser XML / SOAP / operadoras / banco / APIs / filas
 *         + Regra Permanente nº 14 (CORRELATION BEFORE PROCESSING)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_RETURN_RUNTIME_PROVIDER_COUNT,
  DEFAULT_RETURN_RUNTIME_ADAPTER_ID,
  DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
  DefaultReturnRuntimeAdapter,
  EnterpriseReturnRuntimeAdapter,
  IN_MEMORY_RETURN_RUNTIME_STORE_ID,
  InMemoryReturnRuntimeStore,
  MOCK_RETURN_RUNTIME_ADAPTER_ID,
  MockReturnRuntimeAdapter,
  RETURN_CANONICAL_STATES,
  RETURN_RUNTIME_IDENTITY,
  ReturnRuntimeFactory,
  ReturnRuntimeProvider,
  ReturnRuntimeRegistry,
  createDefaultReturnRuntimeRegistry,
  createEmptyReturnCorrelation,
  createEmptyReturnManifest,
  createEmptyReturnStateMachine,
  createReturnRuntimeFactory,
  createReturnRuntimePort,
  getReturnRuntimeFactory,
  getReturnRuntimeHealthSummary,
  getReturnRuntimePort,
  resetAllReturnRuntimeIdSequences,
  type ReturnContext,
  type ReturnCorrelation,
  type ReturnManifest,
  type ReturnRuntimePort,
  type ReturnStateMachine,
} from "../../../src/lib/enterprise/return-runtime/index.ts";
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
    "returnProcessingImplemented",
    "automaticCorrelationImplemented",
    "statusUpdateImplemented",
    "reconciliationImplemented",
    "workflowIntegrationImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleStateMachine(overrides: Partial<ReturnStateMachine> = {}): ReturnStateMachine {
  return createEmptyReturnStateMachine(overrides);
}

function sampleManifest(overrides: Partial<ReturnManifest> = {}): ReturnManifest {
  return createEmptyReturnManifest({
    transactionId: "tx-structural",
    batchId: "batch-structural",
    operatorId: "op-structural",
    protocolId: "protocol-structural",
    correlationId: "corr-structural",
    origin: "UNKNOWN",
    status: "OPEN",
    state: "RECEIVED",
    payloadReference: "payload-ref-structural",
    owner: "enterprise-foundation",
    tags: ["c-08", "structural"],
    ...overrides,
  });
}

function sampleCorrelation(overrides: Partial<ReturnCorrelation> = {}): ReturnCorrelation {
  return createEmptyReturnCorrelation({
    transactionId: "tx-structural",
    authorizationId: "auth-structural",
    batchId: "batch-structural",
    documentId: "doc-structural",
    operatorId: "op-structural",
    correlationStrategy: "structural",
    correlationConfidence: 0,
    matchedEntities: [],
    ...overrides,
  });
}

function sampleReturnContext(overrides: Partial<ReturnContext> = {}): ReturnContext {
  const manifest = sampleManifest();
  return {
    kind: "canonical-return-context",
    contextId: "return-context-structural",
    returnId: manifest.returnId,
    transactionId: manifest.transactionId,
    manifest,
    state: manifest.state,
    status: manifest.status,
    stateMachine: manifest.stateMachine,
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "RECEIVED",
    processingTime: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-08" },
    structuralNotes: "C-08 structural only",
    ...overrides,
  };
}

describe("C-08 ReturnRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem processamento de retorno", async () => {
    const port: ReturnRuntimePort = new MockReturnRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_RETURN_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareReturn, true);
    assert.equal(caps.supportsGetReturn, true);
    assert.equal(caps.supportsListReturns, true);
    assert.equal(caps.supportsCorrelateReturn, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.supportsCanonicalReturnManifest, true);
    assert.equal(caps.supportsReturnCorrelation, true);
    assert.equal(caps.supportsReturnStateMachine, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultReturnRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseReturnRuntimeAdapter, DefaultReturnRuntimeAdapter);
    const port = new DefaultReturnRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_RETURN_RUNTIME_ADAPTER_ID);
  });

  it("identidade vendor-agnostic Foundation", () => {
    assert.equal(RETURN_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(RETURN_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.match(RETURN_RUNTIME_IDENTITY.name, /Return Runtime/i);
  });

  it("Provider default resolve enterprise via create/get/Provider", () => {
    const a = createReturnRuntimePort();
    const b = getReturnRuntimePort();
    const c = ReturnRuntimeProvider.create();
    assert.equal(a.providerId, "enterprise");
    assert.equal(b.providerId, "enterprise");
    assert.equal(c.providerId, "enterprise");
    assert.equal(ReturnRuntimeProvider.get().providerId, "enterprise");
    assert.ok(getReturnRuntimeFactory());
  });

  it("Factory resolve mock/test/default/enterprise", () => {
    const factory = createReturnRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
  });

  it("Registry registra exatamente 4 providers", () => {
    const registry = createDefaultReturnRuntimeRegistry();
    assert.equal(registry.snapshot().count, BUILTIN_RETURN_RUNTIME_PROVIDER_COUNT);
    assert.equal(BUILTIN_RETURN_RUNTIME_PROVIDER_COUNT, 4);
    for (const id of ["mock", "test", "default", "enterprise"] as const) {
      assert.equal(registry.has(id), true);
    }
    assert.ok(new ReturnRuntimeRegistry());
  });

  it("prepareReturn / getReturn / listReturns / stats são estruturais", async () => {
    resetAllReturnRuntimeIdSequences();
    const port = createReturnRuntimePort({ provider: "enterprise" });
    const prepared = await port.prepareReturn({
      ...sampleManifest(),
      returnContext: sampleReturnContext(),
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.returnProcessed, false);
    assert.equal(prepared.returnProcessingImplemented, false);
    assert.equal(prepared.automaticCorrelationImplemented, false);
    assert.ok(prepared.manifest);
    assert.equal(prepared.manifest?.state, "RECEIVED");
    assert.ok(prepared.manifest?.transactionId);
    assert.ok(prepared.manifest?.processingPolicy);
    assertStructuralFlagsFalse(prepared.manifest as unknown as Record<string, unknown>);

    const got = await port.getReturn({ returnId: prepared.manifest?.returnId });
    assert.equal(got.ok, true);
    assert.equal(got.manifest?.returnId, prepared.manifest?.returnId);

    const listed = await port.listReturns({ state: "RECEIVED" });
    assert.equal(listed.ok, true);
    assert.ok(listed.manifests.length >= 1);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok(stats.statistics);
    assert.equal(stats.statistics?.returnProcessedCount, 0);
    assert.equal(stats.statistics?.automaticCorrelationImplementedCount, 0);
  });

  it("correlateReturn permanece não implementado funcionalmente (RULE_14)", async () => {
    const port = createReturnRuntimePort({ provider: "enterprise" });
    const result = await port.correlateReturn({
      ...sampleCorrelation(),
    });
    assert.equal(result.ok, true);
    assert.equal(result.correlated, false);
    assert.equal(result.automaticCorrelationImplemented, false);
    assert.equal(result.returnProcessingImplemented, false);
    assert.equal(result.code, "RETURN_RUNTIME_CORRELATION_NOT_IMPLEMENTED");
    assert.ok(result.correlation);
    assert.equal(result.correlation?.automaticCorrelationImplemented, false);
  });

  it("InMemoryReturnRuntimeStore é in-process", () => {
    const store = new InMemoryReturnRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_RETURN_RUNTIME_STORE_ID);
    store.setManifest(sampleManifest({ returnId: "r1" }));
    assert.equal(store.manifestCount(), 1);
    assert.equal(store.health().ok, true);
  });

  it("demo health summary via Port", async () => {
    const port = createReturnRuntimePort({ provider: "mock" });
    const summary = await getReturnRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.supportsPrepareReturn, true);
  });

  it("contratos canônicos ReturnManifest / ReturnCorrelation / ReturnStateMachine", () => {
    const sm = sampleStateMachine();
    assert.equal(sm.kind, "canonical-return-state-machine");
    assert.equal(sm.transitionsImplemented, false);
    assert.equal(sm.stateMachineImplemented, false);
    assert.deepEqual([...sm.states], [...RETURN_CANONICAL_STATES]);

    const manifest = sampleManifest();
    assert.equal(manifest.kind, "canonical-return-manifest");
    assert.ok(manifest.transactionId);
    assert.ok(manifest.batchId);
    assert.ok(manifest.operatorId);
    assert.ok(manifest.protocolId);
    assert.ok(manifest.correlationId);
    assert.ok(manifest.origin);
    assert.ok(manifest.status);
    assert.ok(manifest.state);
    assert.ok(manifest.metadata);
    assert.ok(manifest.payloadReference);
    assert.ok(manifest.processingPolicy);

    const correlation = sampleCorrelation();
    assert.equal(correlation.kind, "canonical-return-correlation");
    assert.ok(correlation.transactionId);
    assert.ok(correlation.authorizationId);
    assert.ok(correlation.batchId);
    assert.ok(correlation.documentId);
    assert.ok(correlation.operatorId);
    assert.ok(correlation.correlationStrategy);
    assert.equal(typeof correlation.correlationConfidence, "number");
    assert.ok(Array.isArray(correlation.matchedEntities));
  });

  it("estados canônicos oficiais (sem transições)", () => {
    const expected = [
      "RECEIVED",
      "CORRELATED",
      "VALIDATED",
      "READY_FOR_PROCESSING",
      "PROCESSED",
      "PARTIALLY_PROCESSED",
      "REJECTED",
      "FAILED",
      "TIMEOUT",
      "DUPLICATED",
      "IGNORED",
    ];
    assert.deepEqual([...RETURN_CANONICAL_STATES], expected);
  });

  it("ReturnContext prevê envelope RULE_04", () => {
    const ctx = sampleReturnContext();
    assert.equal(ctx.kind, "canonical-return-context");
    assert.ok(ctx.manifest);
    assert.ok(ctx.stateMachine ?? ctx.manifest?.stateMachine);
    assert.equal(ctx.operationId, "op-structural");
    assert.equal(ctx.correlationId, "corr-structural");
    assert.equal(ctx.transactionId, "tx-structural");
    assert.ok(ctx.startedAt);
    assert.ok(ctx.finishedAt);
    assert.equal(ctx.executionStatus, "RECEIVED");
    assert.equal(ctx.processingTime, 0);
    assert.ok(Array.isArray(ctx.warnings));
    assert.ok(Array.isArray(ctx.errors));
    assert.ok(ctx.traceMetadata);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createReturnRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareReturn({
      transactionId: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "RETURN_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultReturnRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new ReturnRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe ReturnRuntimePort + health.returnRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getReturnRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.returnRuntimeOk, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getReturnRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/XML lib/DB e não processa retorno", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/return-runtime");
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

  it("Enterprise Runtime wiring inclui createReturnRuntimePort + returnRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createReturnRuntimePort"));
    assert.ok(source.includes("returnRuntimeOk"));
    assert.ok(source.includes("getReturnRuntimePort"));
    assert.ok(source.includes("getProtocolRuntimePort"));
    assert.ok(source.includes("getBatchRuntimePort"));
    assert.ok(source.includes("C-08"));
  });

  it("documentação C-08 e Regra Permanente nº 14 existem", () => {
    const docs = [
      "docs/enterprise/C08_ENTERPRISE_RETURN_RUNTIME.md",
      "docs/enterprise/C08_RETURN_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C08_RETURN_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule14 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md"),
      "utf8",
    );
    assert.match(rule14, /CORRELATION BEFORE PROCESSING/i);
    assert.match(rule14, /ReturnManifest/);
    assert.match(rule14, /ReturnCorrelation/);
    assert.match(rule14, /ReturnStateMachine/);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.returnProcessingImplemented, false);
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.automaticCorrelationImplemented, false);
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.statusUpdateImplemented, false);
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.reconciliationImplemented, false);
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.workflowIntegrationImplemented, false);
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.xmlParserImplemented, false);
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.soapImplemented, false);
    assert.equal(
      DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.operatorCommunicationImplemented,
      false,
    );
    assert.equal(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES.knowsOperatorOrCooperative, false);
  });
});
