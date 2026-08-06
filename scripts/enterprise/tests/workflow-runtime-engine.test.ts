#!/usr/bin/env node
/**
 * C-10 — Enterprise Corporate Workflow Runtime Foundation
 * Prova: Application → WorkflowRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareWorkflowExecution / getWorkflowExecution / listWorkflowExecutions /
 *           stats
 *         + Enterprise Runtime + deps estruturais (Reconciliation/Return/
 *           Authorization/Operator/Protocol/Batch/SOAP/XML/XMLValidation/Audit)
 *         + contrato WorkflowManifest + WorkflowExecution + WorkflowExecutionResult +
 *           WorkflowStateMachine + WorkflowContext + RULE_18
 *         + ausência de workflow funcional / BPM / decisão automática / execução de
 *           runtime / validação XML / reconciliação / autorização / SOAP / operadoras /
 *           processamento de lotes / IA / banco / APIs / filas
 *         + Regra Permanente nº 18 (WORKFLOW IS PURE ORCHESTRATION)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_WORKFLOW_RUNTIME_PROVIDER_COUNT,
  DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID,
  DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  DefaultWorkflowRuntimeAdapter,
  EnterpriseWorkflowRuntimeAdapter,
  IN_MEMORY_WORKFLOW_RUNTIME_STORE_ID,
  InMemoryWorkflowRuntimeStore,
  MOCK_WORKFLOW_RUNTIME_ADAPTER_ID,
  MockWorkflowRuntimeAdapter,
  WORKFLOW_CANONICAL_STATES,
  WORKFLOW_RUNTIME_IDENTITY,
  WorkflowRuntimeFactory,
  WorkflowRuntimeProvider,
  WorkflowRuntimeRegistry,
  createDefaultWorkflowRuntimeRegistry,
  createEmptyWorkflowExecution,
  createEmptyWorkflowExecutionResult,
  createEmptyWorkflowManifest,
  createEmptyWorkflowStateMachine,
  createWorkflowRuntimeFactory,
  createWorkflowRuntimePort,
  getWorkflowRuntimeFactory,
  getWorkflowRuntimeHealthSummary,
  getWorkflowRuntimePort,
  resetAllWorkflowRuntimeIdSequences,
  type WorkflowContext,
  type WorkflowExecution,
  type WorkflowExecutionResult,
  type WorkflowManifest,
  type WorkflowRuntimePort,
  type WorkflowStateMachine,
} from "../../../src/lib/enterprise/workflow-runtime/index.ts";
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
    "workflowImplemented",
    "workflowExecutionImplemented",
    "automaticDecisionImplemented",
    "runtimeExecutionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleStateMachine(overrides: Partial<WorkflowStateMachine> = {}): WorkflowStateMachine {
  return createEmptyWorkflowStateMachine(overrides);
}

function sampleManifest(overrides: Partial<WorkflowManifest> = {}): WorkflowManifest {
  return createEmptyWorkflowManifest({
    transactionId: "tx-structural",
    correlationId: "corr-structural",
    state: "CREATED",
    owner: "enterprise-foundation",
    tags: ["c-10", "structural"],
    ...overrides,
  });
}

function sampleExecution(overrides: Partial<WorkflowExecution> = {}): WorkflowExecution {
  return createEmptyWorkflowExecution({
    transactionId: "tx-structural",
    correlationId: "corr-structural",
    state: "CREATED",
    ...overrides,
  });
}

function sampleResult(overrides: Partial<WorkflowExecutionResult> = {}): WorkflowExecutionResult {
  return createEmptyWorkflowExecutionResult({
    transactionId: "tx-structural",
    status: "CREATED",
    recommendations: [],
    auditReference: "audit-structural",
    ...overrides,
  });
}

function sampleWorkflowContext(overrides: Partial<WorkflowContext> = {}): WorkflowContext {
  const manifest = sampleManifest({ workflowExecutionId: "workflow-execution-structural" });
  return {
    kind: "canonical-workflow-context",
    contextId: "workflow-context-structural",
    workflowExecutionId: manifest.workflowExecutionId,
    transactionId: manifest.transactionId,
    manifest,
    state: manifest.state,
    stateMachine: manifest.stateMachine,
    result: sampleResult(),
    operationId: "op-structural",
    correlationId: "corr-structural",
    executionStartedAt: "2026-08-05T00:00:00.000Z",
    executionFinishedAt: "2026-08-05T00:00:00.000Z",
    executionStatus: "CREATED",
    executionDuration: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-10" },
    structuralNotes: "C-10 structural only",
    ...overrides,
  };
}

describe("C-10 WorkflowRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem workflow funcional", async () => {
    const port: WorkflowRuntimePort = new MockWorkflowRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_WORKFLOW_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareWorkflowExecution, true);
    assert.equal(caps.supportsGetWorkflowExecution, true);
    assert.equal(caps.supportsListWorkflowExecutions, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.supportsCanonicalWorkflowManifest, true);
    assert.equal(caps.supportsCanonicalWorkflowExecutionResult, true);
    assert.equal(caps.supportsWorkflowStateMachine, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultWorkflowRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseWorkflowRuntimeAdapter, DefaultWorkflowRuntimeAdapter);
    const port = new DefaultWorkflowRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID);
  });

  it("identidade vendor-agnostic Foundation", () => {
    assert.equal(WORKFLOW_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(WORKFLOW_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.match(WORKFLOW_RUNTIME_IDENTITY.name, /Workflow Runtime/i);
  });

  it("Provider default resolve enterprise via create/get/Provider", () => {
    const a = createWorkflowRuntimePort();
    const b = getWorkflowRuntimePort();
    const c = WorkflowRuntimeProvider.create();
    assert.equal(a.providerId, "enterprise");
    assert.equal(b.providerId, "enterprise");
    assert.equal(c.providerId, "enterprise");
    assert.equal(WorkflowRuntimeProvider.get().providerId, "enterprise");
    assert.ok(getWorkflowRuntimeFactory());
  });

  it("Factory resolve mock/test/default/enterprise", () => {
    const factory = createWorkflowRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
  });

  it("Registry registra exatamente 4 providers", () => {
    const registry = createDefaultWorkflowRuntimeRegistry();
    assert.equal(registry.snapshot().count, BUILTIN_WORKFLOW_RUNTIME_PROVIDER_COUNT);
    assert.equal(BUILTIN_WORKFLOW_RUNTIME_PROVIDER_COUNT, 4);
    for (const id of ["mock", "test", "default", "enterprise"] as const) {
      assert.equal(registry.has(id), true);
    }
    assert.ok(new WorkflowRuntimeRegistry());
  });

  it("prepareWorkflowExecution / getWorkflowExecution / listWorkflowExecutions / stats são estruturais", async () => {
    resetAllWorkflowRuntimeIdSequences();
    const port = createWorkflowRuntimePort({ provider: "enterprise" });
    const prepared = await port.prepareWorkflowExecution({
      manifest: sampleManifest(),
      execution: sampleExecution(),
      result: sampleResult(),
      workflowContext: sampleWorkflowContext(),
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.executed, false);
    assert.equal(prepared.workflowImplemented, false);
    assert.equal(prepared.workflowExecutionImplemented, false);
    assert.equal(prepared.automaticDecisionImplemented, false);
    assert.equal(prepared.runtimeExecutionImplemented, false);
    assert.ok(prepared.manifest);
    assert.equal(prepared.manifest?.state, "CREATED");
    assert.ok(prepared.manifest?.transactionId);
    assert.ok(prepared.manifest?.workflowExecutionId);
    assert.ok(prepared.execution);
    assert.equal(prepared.execution?.kind, "canonical-workflow-execution");
    assert.ok(prepared.result);
    assert.equal(prepared.result?.kind, "canonical-workflow-execution-result");
    assert.ok(prepared.workflowContext);
    assertStructuralFlagsFalse(prepared.manifest as unknown as Record<string, unknown>);
    assertStructuralFlagsFalse(prepared.execution as unknown as Record<string, unknown>);
    assertStructuralFlagsFalse(prepared.result as unknown as Record<string, unknown>);

    const got = await port.getWorkflowExecution({
      workflowExecutionId: prepared.manifest?.workflowExecutionId,
    });
    assert.equal(got.ok, true);
    assert.equal(got.execution?.workflowExecutionId, prepared.manifest?.workflowExecutionId);

    const listed = await port.listWorkflowExecutions({ state: "CREATED" });
    assert.equal(listed.ok, true);
    assert.ok(listed.manifests.length >= 1);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok(stats.statistics);
    assert.equal(stats.statistics?.workflowImplementedCount, 0);
    assert.equal(stats.statistics?.workflowExecutionImplementedCount, 0);
    assert.equal(stats.statistics?.automaticDecisionImplementedCount, 0);
    assert.equal(stats.statistics?.runtimeExecutionImplementedCount, 0);
  });

  it("workflowExecutionId é gerado e único a cada prepareWorkflowExecution", async () => {
    resetAllWorkflowRuntimeIdSequences();
    const port = createWorkflowRuntimePort({ provider: "enterprise" });
    const first = await port.prepareWorkflowExecution({ transactionId: "tx-unique-1" });
    const second = await port.prepareWorkflowExecution({ transactionId: "tx-unique-2" });
    assert.ok(first.manifest?.workflowExecutionId);
    assert.ok(second.manifest?.workflowExecutionId);
    assert.notEqual(first.manifest?.workflowExecutionId, second.manifest?.workflowExecutionId);
  });

  it("InMemoryWorkflowRuntimeStore é in-process", () => {
    const store = new InMemoryWorkflowRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_WORKFLOW_RUNTIME_STORE_ID);
    store.setManifest(sampleManifest({ workflowId: "w1" }));
    assert.equal(store.manifestCount(), 1);
    assert.equal(store.health().ok, true);
  });

  it("demo health summary via Port", async () => {
    const port = createWorkflowRuntimePort({ provider: "mock" });
    const summary = await getWorkflowRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.supportsPrepareWorkflowExecution, true);
  });

  it("contratos canônicos WorkflowManifest / WorkflowExecution / WorkflowExecutionResult / WorkflowStateMachine", () => {
    const sm = sampleStateMachine();
    assert.equal(sm.kind, "canonical-workflow-state-machine");
    assert.equal(sm.transitionsImplemented, false);
    assert.equal(sm.stateMachineImplemented, false);
    assert.deepEqual([...sm.states], [...WORKFLOW_CANONICAL_STATES]);

    const manifest = sampleManifest();
    assert.equal(manifest.kind, "canonical-workflow-manifest");
    assert.ok(manifest.transactionId);
    assert.ok(manifest.state);
    assert.ok(manifest.metadata);
    assert.ok(manifest.executionPolicy);
    assert.ok(manifest.stateMachine);
    assertStructuralFlagsFalse(manifest as unknown as Record<string, unknown>);

    const execution = sampleExecution();
    assert.equal(execution.kind, "canonical-workflow-execution");
    assert.ok(execution.transactionId);
    assertStructuralFlagsFalse(execution as unknown as Record<string, unknown>);

    const result = sampleResult();
    assert.equal(result.kind, "canonical-workflow-execution-result");
    assert.ok(result.transactionId);
    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.auditReference);
    assert.ok(result.metadata);
    assert.equal(result.executed, false);
    assertStructuralFlagsFalse(result as unknown as Record<string, unknown>);
  });

  it("estados canônicos oficiais (sem transições)", () => {
    const expected = [
      "CREATED",
      "READY",
      "WAITING",
      "RUNNING",
      "PAUSED",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ];
    assert.deepEqual([...WORKFLOW_CANONICAL_STATES], expected);
  });

  it("WorkflowContext prevê envelope RULE_04", () => {
    const ctx = sampleWorkflowContext();
    assert.equal(ctx.kind, "canonical-workflow-context");
    assert.ok(ctx.manifest);
    assert.ok(ctx.stateMachine ?? ctx.manifest?.stateMachine);
    assert.equal(ctx.transactionId, "tx-structural");
    assert.ok(ctx.workflowExecutionId);
    assert.equal(ctx.correlationId, "corr-structural");
    assert.equal(ctx.operationId, "op-structural");
    assert.ok(ctx.executionStartedAt);
    assert.ok(ctx.executionFinishedAt);
    assert.ok(ctx.executionDuration !== undefined);
    assert.equal(ctx.executionStatus, "CREATED");
    assert.ok(Array.isArray(ctx.warnings));
    assert.ok(Array.isArray(ctx.errors));
    assert.ok(ctx.traceMetadata);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createWorkflowRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareWorkflowExecution({
      transactionId: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKFLOW_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultWorkflowRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new WorkflowRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe WorkflowRuntimePort + health.workflowRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getWorkflowRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.workflowRuntimeOk, true);
    assert.equal(health.reconciliationRuntimeOk, true);
    assert.equal(health.returnRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getWorkflowRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.reconciliationRuntimeOk, true);
    assert.equal(health.returnRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/XML lib/DB e não orquestra funcionalmente", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/workflow-runtime");
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

  it("Enterprise Runtime wiring inclui createWorkflowRuntimePort + workflowRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createWorkflowRuntimePort"));
    assert.ok(source.includes("workflowRuntimeOk"));
    assert.ok(source.includes("getWorkflowRuntimePort"));
    assert.ok(source.includes("C-10"));
  });

  it("documentação C-10 e Regra Permanente nº 18 existem", () => {
    const docs = [
      "docs/enterprise/C10_ENTERPRISE_WORKFLOW_RUNTIME.md",
      "docs/enterprise/C10_WORKFLOW_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C10_WORKFLOW_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule18 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md"),
      "utf8",
    );
    assert.match(rule18, /WORKFLOW IS PURE ORCHESTRATION/i);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES.workflowImplemented, false);
    assert.equal(DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES.workflowExecutionImplemented, false);
    assert.equal(DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES.automaticDecisionImplemented, false);
    assert.equal(DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES.runtimeExecutionImplemented, false);
  });
});
