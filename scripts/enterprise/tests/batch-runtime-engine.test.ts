#!/usr/bin/env node
/**
 * C-06 — Enterprise Batch Runtime Foundation
 * Prova: Application → BatchRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareBatch / getBatch / listBatches / stats
 *         + Enterprise Runtime + deps estruturais (Authorization/Operator/SOAP/
 *           XML/XMLValidation/Quality/Audit)
 *         + contrato BatchManifest + BatchStateMachine + BatchContext
 *           + envelope de observabilidade RULE_04
 *         + ausência de processamento em lote / filas / workers / retry /
 *           scheduler / paralelismo / SOAP/XML funcional / banco / APIs
 *         + Regra Permanente nº 11 (STATE MACHINE FIRST)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_CANONICAL_STATES,
  BATCH_RUNTIME_IDENTITY,
  BUILTIN_BATCH_RUNTIME_PROVIDER_COUNT,
  DEFAULT_BATCH_RUNTIME_ADAPTER_ID,
  DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
  DefaultBatchRuntimeAdapter,
  EnterpriseBatchRuntimeAdapter,
  IN_MEMORY_BATCH_RUNTIME_STORE_ID,
  InMemoryBatchRuntimeStore,
  MOCK_BATCH_RUNTIME_ADAPTER_ID,
  MockBatchRuntimeAdapter,
  REAL_TISS_BATCH_RUNTIME_ADAPTER_ID,
  RealTissBatchRuntimeAdapter,
  BatchRuntimeFactory,
  BatchRuntimeProvider,
  BatchRuntimeRegistry,
  createBatchRuntimeFactory,
  createBatchRuntimePort,
  createDefaultBatchRuntimeRegistry,
  createEmptyBatchManifest,
  createEmptyBatchStateMachine,
  getBatchRuntimeFactory,
  getBatchRuntimeHealthSummary,
  getBatchRuntimePort,
  resetAllBatchRuntimeIdSequences,
  type BatchContext,
  type BatchManifest,
  type BatchRuntimePort,
  type BatchStateMachine,
} from "../../../src/lib/enterprise/batch-runtime/index.ts";
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
    "batchProcessingImplemented",
    "parallelExecutionImplemented",
    "retryImplemented",
    "schedulerImplemented",
    "workerImplemented",
    "queueImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleStateMachine(overrides: Partial<BatchStateMachine> = {}): BatchStateMachine {
  return createEmptyBatchStateMachine(overrides);
}

function sampleManifest(overrides: Partial<BatchManifest> = {}): BatchManifest {
  return createEmptyBatchManifest({
    batchName: "Structural Batch Manifest",
    priority: "normal",
    state: "CREATED",
    owner: "enterprise-foundation",
    tags: ["c-06", "structural"],
    ...overrides,
  });
}

function sampleBatchContext(overrides: Partial<BatchContext> = {}): BatchContext {
  const manifest = sampleManifest();
  return {
    kind: "canonical-batch-context",
    contextId: "batch-context-structural",
    batchId: manifest.batchId,
    manifest,
    state: manifest.state,
    stateMachine: manifest.stateMachine,
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "CREATED",
    executionDuration: 0,
    processedItems: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-06" },
    structuralNotes: "C-06 structural only",
    ...overrides,
  };
}

describe("C-06 BatchRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem processamento em lote", async () => {
    const port: BatchRuntimePort = new MockBatchRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_BATCH_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareBatch, true);
    assert.equal(caps.supportsGetBatch, true);
    assert.equal(caps.supportsListBatches, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.supportsCanonicalBatchManifest, true);
    assert.equal(caps.supportsBatchStateMachine, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultBatchRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseBatchRuntimeAdapter, DefaultBatchRuntimeAdapter);
    const port = new DefaultBatchRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_BATCH_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Batch Runtime Foundation vendor-agnostic", () => {
    assert.equal(BATCH_RUNTIME_IDENTITY.name, "Enterprise Batch Runtime");
    assert.equal(BATCH_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(BATCH_RUNTIME_IDENTITY.version);
    assert.equal(BATCH_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createBatchRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "BATCH_RUNTIME");
  });

  it("provider default resolve enterprise via getBatchRuntimePort/Provider", () => {
    const port = createBatchRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getBatchRuntimePort().providerId, "enterprise");
    assert.equal(BatchRuntimeProvider.create().providerId, "enterprise");
    assert.equal(BatchRuntimeProvider.get().providerId, "enterprise");
    assert.ok(BatchRuntimeProvider.getFactory() instanceof BatchRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createBatchRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.ok(factory.create({ provider: "real-tiss" }) instanceof RealTissBatchRuntimeAdapter);
    assert.equal(
      getBatchRuntimeFactory().getRegistry().list().length,
      BUILTIN_BATCH_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultBatchRuntimeRegistry();
    assert.ok(registry instanceof BatchRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_BATCH_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.batchProcessingImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.queueImplemented, false);
    assert.equal(registry.get("real-tiss")?.status, "ready");
    assert.equal(registry.get("real-tiss")?.adapterId, REAL_TISS_BATCH_RUNTIME_ADAPTER_ID);
  });

  it("prepareBatch → getBatch → listBatches → stats (sem processamento em lote)", async () => {
    resetAllBatchRuntimeIdSequences();
    const batchContext = sampleBatchContext();
    const port = createBatchRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareBatch({
      batchContext,
      manifest: batchContext.manifest,
      batchName: "Foundation Batch Prepare",
      documents: [
        {
          kind: "canonical-batch-document",
          documentId: "doc-1",
          name: "Structural document",
          batchDocumentImplemented: false,
          batchProcessingImplemented: false,
        },
      ],
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.manifest?.batchId);
    assert.equal(prepared.batchProcessed, false);
    assert.equal(prepared.manifest?.runtimeReady, undefined);
    assert.equal(prepared.manifest?.state, "CREATED");
    assert.equal(prepared.manifest?.kind, "canonical-batch-manifest");
    assert.equal(prepared.manifest?.stateMachine?.kind, "canonical-batch-state-machine");
    assert.equal(prepared.batchContext?.kind, "canonical-batch-context");
    assertStructuralFlagsFalse(prepared.manifest as unknown as Record<string, unknown>);

    const loaded = await port.getBatch({ batchId: prepared.manifest!.batchId! });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.manifest?.batchId, prepared.manifest!.batchId);

    const byContext = await port.getBatch({
      contextId: prepared.batchContext!.contextId!,
    });
    assert.equal(byContext.ok, true);
    assert.equal(byContext.batchContext?.kind, "canonical-batch-context");

    const listed = await port.listBatches();
    assert.equal(listed.ok, true);
    assert.ok(listed.manifests.length >= 1);
    assert.ok(listed.contexts.length >= 1);
    assert.equal(listed.statistics?.batchProcessedCount, 0);
    assert.equal(listed.statistics?.batchProcessingImplementedCount, 0);
    assert.equal(listed.statistics?.queueImplementedCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalManifests ?? 0) >= 1);
    assert.equal(stats.statistics?.retryImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryBatchRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_BATCH_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.manifestCount(), 0);
    assert.equal(store.documentCount(), 0);
    assert.equal(store.contextCount(), 0);
  });

  it("demo getBatchRuntimeHealthSummary resume Port sem lógica funcional", async () => {
    const port = createBatchRuntimePort({ provider: "enterprise" });
    const summary = await getBatchRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "BATCH_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("BatchManifest contrato mínimo presente", () => {
    const manifest = sampleManifest({
      batchId: "batch-structural",
      submissionStrategy: "structural",
      requiredCapabilities: {
        kind: "canonical-batch-capabilities",
        supportsPrepareBatch: true,
        supportsGetBatch: true,
        supportsListBatches: true,
        supportsStats: true,
        supportsHealth: true,
        supportsCanonicalBatchManifest: true,
        supportsBatchStateMachine: true,
        runtimeReady: true,
        batchProcessingImplemented: false,
        parallelExecutionImplemented: false,
        retryImplemented: false,
        schedulerImplemented: false,
        workerImplemented: false,
        queueImplemented: false,
        soapFunctionalImplemented: false,
        xmlFunctionalImplemented: false,
        operatorCommunicationImplemented: false,
        knowsOperatorOrCooperative: false,
        knowsContract: false,
        knowsTenant: false,
      },
      dependencies: {
        kind: "canonical-batch-dependencies",
        dependenciesImplemented: false,
        batchProcessingImplemented: false,
      },
    });
    assert.equal(manifest.kind, "canonical-batch-manifest");
    assert.ok(manifest.batchId);
    assert.ok(manifest.batchName);
    assert.ok(Array.isArray(manifest.documents));
    assert.equal(manifest.priority, "normal");
    assert.equal(manifest.state, "CREATED");
    assert.ok(manifest.stateMachine);
    assert.ok(manifest.retryPolicy);
    assert.ok(manifest.metadata);
    assert.ok(manifest.requiredCapabilities);
    assert.ok(manifest.dependencies);
    assertStructuralFlagsFalse({
      batchProcessingImplemented: manifest.batchProcessingImplemented,
      parallelExecutionImplemented: manifest.parallelExecutionImplemented,
      retryImplemented: manifest.retryImplemented,
      schedulerImplemented: manifest.schedulerImplemented,
      workerImplemented: manifest.workerImplemented,
      queueImplemented: manifest.queueImplemented,
    });
  });

  it("BatchStateMachine declara estados canônicos sem transições", () => {
    const sm = sampleStateMachine();
    assert.equal(sm.kind, "canonical-batch-state-machine");
    assert.equal(sm.transitionsImplemented, false);
    assert.equal(sm.stateMachineImplemented, false);
    assert.equal(sm.batchProcessingImplemented, false);
    assert.deepEqual([...sm.states], [...BATCH_CANONICAL_STATES]);
    for (const state of [
      "CREATED",
      "VALIDATED",
      "QUEUED",
      "READY_TO_SEND",
      "SENT",
      "ACKNOWLEDGED",
      "PROCESSING",
      "PARTIALLY_COMPLETED",
      "COMPLETED",
      "FAILED",
      "TIMEOUT",
      "CANCELLED",
    ]) {
      assert.ok(sm.states.includes(state as never), `estado ${state} ausente`);
    }
  });

  it("BatchContext prevê observabilidade RULE_04 sem processar", () => {
    const ctx = sampleBatchContext();
    assert.equal(ctx.kind, "canonical-batch-context");
    assert.ok(ctx.manifest);
    assert.ok(ctx.stateMachine ?? ctx.manifest?.stateMachine);
    assert.equal(ctx.operationId, "op-structural");
    assert.equal(ctx.correlationId, "corr-structural");
    assert.ok(ctx.startedAt);
    assert.ok(ctx.finishedAt);
    assert.equal(ctx.executionStatus, "CREATED");
    assert.equal(ctx.executionDuration, 0);
    assert.equal(ctx.processedItems, 0);
    assert.ok(Array.isArray(ctx.warnings));
    assert.ok(Array.isArray(ctx.errors));
    assert.ok(ctx.traceMetadata);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createBatchRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareBatch({
      batchName: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "BATCH_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultBatchRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new BatchRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe BatchRuntimePort + health.batchRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getBatchRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getBatchRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/XML lib/DB e não processa lote", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/batch-runtime");
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

  it("Enterprise Runtime wiring inclui createBatchRuntimePort + batchRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createBatchRuntimePort"));
    assert.ok(source.includes("batchRuntimeOk"));
    assert.ok(source.includes("getBatchRuntimePort"));
    assert.ok(source.includes("getAuthorizationRuntimePort"));
    assert.ok(source.includes("getOperatorRuntimePort"));
    assert.ok(source.includes("C-06"));
  });

  it("documentação C-06 e Regra Permanente nº 11 existem", () => {
    const docs = [
      "docs/enterprise/C06_ENTERPRISE_BATCH_RUNTIME.md",
      "docs/enterprise/C06_BATCH_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C06_BATCH_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule11 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md"),
      "utf8",
    );
    assert.match(rule11, /STATE MACHINE FIRST/i);
    assert.match(rule11, /BatchStateMachine/);
    assert.match(rule11, /BatchManifest/);
    assert.match(rule11, /transição/i);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.batchProcessingImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.parallelExecutionImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.retryImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.schedulerImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.workerImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.queueImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.soapFunctionalImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.xmlFunctionalImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.operatorCommunicationImplemented, false);
    assert.equal(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES.knowsOperatorOrCooperative, false);
  });
});
