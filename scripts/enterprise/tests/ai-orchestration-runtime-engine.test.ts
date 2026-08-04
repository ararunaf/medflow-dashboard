#!/usr/bin/env node
/**
 * F3-CAP-09 — Enterprise AI Orchestration Runtime Foundation
 * Prova: Application → AIOrchestrationRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerTask / getResult / stats
 *         + Enterprise Runtime + deps estruturais (Validation/DocumentExtraction/
 *           DocumentClassification/OCR/ICR/Scanner/WatchFolder/Upload/PQR/Worker/
 *           Scheduler/Obs/Scalability)
 *         + contrato AIOrchestrationContext (DocumentClassificationContext +
 *           DocumentExtractionResult + ValidationResult)
 *         + ausência de IA real / OpenAI / Azure OpenAI / Gemini / Claude /
 *           Ollama / Llama / ML / Prompt Engineering / HTTP / agentes /
 *           workflow / decisão automática / persistência
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AI_ORCHESTRATION_RUNTIME_IDENTITY,
  AIOrchestrationRuntimeFactory,
  AIOrchestrationRuntimeProvider,
  AIOrchestrationRuntimeRegistry,
  BUILTIN_AI_ORCHESTRATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultAIOrchestrationRuntimeAdapter,
  EnterpriseAIOrchestrationRuntimeAdapter,
  IN_MEMORY_AI_ORCHESTRATION_RUNTIME_STORE_ID,
  InMemoryAIOrchestrationRuntimeStore,
  MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
  MockAIOrchestrationRuntimeAdapter,
  createDefaultAIOrchestrationRuntimeRegistry,
  createDisabledFutureAIProviderCatalog,
  createAIOrchestrationRuntimeFactory,
  createAIOrchestrationRuntimePort,
  getAIOrchestrationRuntimeFactory,
  getAIOrchestrationRuntimeHealthSummary,
  getAIOrchestrationRuntimePort,
  resetAllAIOrchestrationRuntimeIdSequences,
  type AIOrchestrationContext,
  type AIOrchestrationRuntimePort,
  type ClassificationAgent,
  type DocumentClassificationContext,
  type DocumentExtractionResult,
  type ValidationResult,
} from "../../../src/lib/enterprise/ai-orchestration-runtime/index.ts";
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
    "llmImplemented",
    "agentExecutionImplemented",
    "providerSelectionImplemented",
    "promptExecutionImplemented",
    "multiAgentImplemented",
    "workflowOrchestrationImplemented",
    "aiSupervisorImplemented",
    "contextManagementImplemented",
    "memoryImplemented",
    "reasoningImplemented",
    "decisionEngineImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleClassificationContext(
  overrides: Partial<DocumentClassificationContext> = {},
): DocumentClassificationContext {
  return {
    kind: "canonical-document-classification-context",
    documentCategory: "medical-guide",
    documentType: "guia-sadt",
    guideType: "sadt",
    operator: "operadora-estrutural",
    operatorCode: "OP-001",
    tissVersion: "4.01.00",
    templateId: "tpl-estrutural-001",
    documentOrientation: "portrait",
    documentLanguage: "pt-BR",
    documentQuality: "unknown",
    recommendedPipeline: "structural-ai-orchestration",
    confidence: { kind: "canonical-extraction-confidence", band: "unknown" },
    documentFamily: "tiss",
    documentSubtype: "sadt",
    processingProfile: "foundation",
    layoutVersion: "1.0",
    captureSource: "upload",
    documentFingerprint: "fp-structural",
    classificationTimestamp: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleExtractionResult(
  overrides: Partial<DocumentExtractionResult> = {},
): DocumentExtractionResult {
  return {
    kind: "canonical-document-extraction-result",
    ok: true,
    resultId: "extraction-result-structural",
    operation: "getResult",
    fields: [],
    tables: [],
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    medicalGuideExtractionImplemented: false,
    tableExtractionImplemented: false,
    templateExtractionImplemented: false,
    automaticMappingImplemented: false,
    confidenceScoreImplemented: false,
    barcodeExtractionImplemented: false,
    qrExtractionImplemented: false,
    pipelineSelectionImplemented: false,
    runtimeReady: true,
    status: "processed",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleValidationResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    kind: "canonical-validation-result",
    ok: true,
    resultId: "validation-result-structural",
    operation: "getResult",
    issues: [],
    warnings: [],
    errors: [],
    fieldValidationImplemented: false,
    documentValidationImplemented: false,
    templateValidationImplemented: false,
    operatorValidationImplemented: false,
    tissValidationImplemented: false,
    confidenceValidationImplemented: false,
    qualityValidationImplemented: false,
    mandatoryFieldValidationImplemented: false,
    crossFieldValidationImplemented: false,
    businessRuleValidationImplemented: false,
    automaticApprovalImplemented: false,
    automaticRejectionImplemented: false,
    runtimeReady: true,
    status: "processed",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleOrchestrationContext(
  overrides: Partial<AIOrchestrationContext> = {},
): AIOrchestrationContext {
  const classificationAgent: ClassificationAgent = {
    kind: "canonical-ai-agent",
    agentId: "agent-classification-structural",
    agentKind: "classification",
    status: "disabled",
    structuralRole: "classification-agent",
    agentExecutionImplemented: false,
    reasoningImplemented: false,
    decisionEngineImplemented: false,
  };
  return {
    kind: "canonical-ai-orchestration-context",
    classificationContext: sampleClassificationContext(),
    extractionResult: sampleExtractionResult(),
    validationResult: sampleValidationResult(),
    agents: [classificationAgent],
    futureProviders: createDisabledFutureAIProviderCatalog(),
    structuralNotes: "F3-CAP-09 structural only",
    ...overrides,
  };
}

describe("F3-CAP-09 AIOrchestrationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem IA real", async () => {
    const port: AIOrchestrationRuntimePort = new MockAIOrchestrationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterTask, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultAIOrchestrationRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseAIOrchestrationRuntimeAdapter, DefaultAIOrchestrationRuntimeAdapter);
    const port = new DefaultAIOrchestrationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise AI Orchestration Runtime Foundation vendor-agnostic", () => {
    assert.equal(AI_ORCHESTRATION_RUNTIME_IDENTITY.name, "Enterprise AI Orchestration Runtime");
    assert.equal(AI_ORCHESTRATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(AI_ORCHESTRATION_RUNTIME_IDENTITY.version);
    assert.equal(AI_ORCHESTRATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createAIOrchestrationRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "AI_ORCHESTRATION_RUNTIME");
  });

  it("provider default resolve enterprise via getAIOrchestrationRuntimePort/Provider", () => {
    const port = createAIOrchestrationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getAIOrchestrationRuntimePort().providerId, "enterprise");
    assert.equal(AIOrchestrationRuntimeProvider.create().providerId, "enterprise");
    assert.equal(AIOrchestrationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(AIOrchestrationRuntimeProvider.getFactory() instanceof AIOrchestrationRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createAIOrchestrationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getAIOrchestrationRuntimeFactory().getRegistry().list().length,
      BUILTIN_AI_ORCHESTRATION_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultAIOrchestrationRuntimeRegistry();
    assert.ok(registry instanceof AIOrchestrationRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.llmImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.agentExecutionImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.decisionEngineImplemented, false);
  });

  it("openJob → submitRequest → registerTask → getResult → closeJob → stats (sem IA real)", async () => {
    resetAllAIOrchestrationRuntimeIdSequences();
    const classificationContext = sampleClassificationContext();
    const extractionResult = sampleExtractionResult();
    const validationResult = sampleValidationResult();
    const orchestrationContext = sampleOrchestrationContext({
      classificationContext,
      extractionResult,
      validationResult,
    });
    const port = createAIOrchestrationRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-f3-cap-09",
      orchestrationContext,
      classificationContext,
      extractionResult,
      validationResult,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.orchestrationContext?.kind, "canonical-ai-orchestration-context");
    assert.equal(
      opened.job?.orchestrationContext?.classificationContext?.documentCategory,
      "medical-guide",
    );
    assert.equal(
      opened.job?.orchestrationContext?.extractionResult?.kind,
      "canonical-document-extraction-result",
    );
    assert.equal(
      opened.job?.orchestrationContext?.validationResult?.kind,
      "canonical-validation-result",
    );
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      taskId: "task-f3-cap-09",
      orchestrationContext,
      classificationContext,
      extractionResult,
      validationResult,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    assert.equal(submitted.request?.classificationContext?.templateId, "tpl-estrutural-001");
    const requestId = submitted.request!.requestId;

    const registered = await port.registerTask({
      jobId,
      requestId,
      taskId: "task-f3-cap-09",
      agentKind: "classification",
      orchestrationContext,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.task?.status, "registered");
    assert.equal(registered.task?.agentKind, "classification");
    assert.equal(registered.task?.agentExecutionImplemented, false);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.llmImplemented, false);
    assert.equal(result.result?.provider?.enabled, false);
    assert.equal(result.result?.provider?.connected, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-ai-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalTasks ?? 0) >= 1);
    assert.equal(stats.statistics?.llmImplementedCount, 0);
    assert.equal(stats.statistics?.agentExecutionImplementedCount, 0);
    assert.equal(stats.statistics?.decisionEngineImplementedCount, 0);
  });

  it("contrato AIOrchestrationContext recebe Classification + Extraction + Validation", () => {
    const ctx = sampleOrchestrationContext();
    assert.equal(ctx.kind, "canonical-ai-orchestration-context");
    assert.equal(ctx.classificationContext?.kind, "canonical-document-classification-context");
    assert.equal(ctx.extractionResult?.kind, "canonical-document-extraction-result");
    assert.equal(ctx.validationResult?.kind, "canonical-validation-result");
    assert.equal(ctx.futureProviders?.openai.enabled, false);
    assert.equal(ctx.futureProviders?.azureOpenAI.enabled, false);
    assert.equal(ctx.futureProviders?.gemini.enabled, false);
    assert.equal(ctx.futureProviders?.claude.enabled, false);
    assert.equal(ctx.futureProviders?.ollama.enabled, false);
    assert.equal(ctx.futureProviders?.llama.enabled, false);
    assert.equal(ctx.futureProviders?.custom.enabled, false);
    assert.equal(ctx.agents?.[0]?.agentExecutionImplemented, false);
  });

  it("InMemory store persiste jobs/requests/tasks/results (F3-CAP-09)", async () => {
    const store = new InMemoryAIOrchestrationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_AI_ORCHESTRATION_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultAIOrchestrationRuntimeAdapter({
      provider: "enterprise",
      store,
    });
    await port.openJob({ jobId: "job-store-1" });
    await port.submitRequest({ jobId: "job-store-1", requestId: "req-store-1" });
    await port.registerTask({ taskId: "task-store-1", jobId: "job-store-1" });
    assert.equal(store.jobCount(), 1);
    assert.equal(store.requestCount(), 1);
    assert.equal(store.taskCount(), 1);

    const statistics = store.statistics();
    assert.equal(statistics.kind, "canonical-ai-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultAIOrchestrationRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.openJob({});
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const port = createAIOrchestrationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AI_ORCHESTRATION_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("demo getAIOrchestrationRuntimeHealthSummary resume health/capabilities/info", async () => {
    const port = createAIOrchestrationRuntimePort({ provider: "enterprise" });
    const summary = await getAIOrchestrationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "AI_ORCHESTRATION_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.llmImplemented, false);
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.agentExecutionImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.providerSelectionImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.promptExecutionImplemented,
      false,
    );
    assert.equal(DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.multiAgentImplemented, false);
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.workflowOrchestrationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.aiSupervisorImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.contextManagementImplemented,
      false,
    );
    assert.equal(DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.memoryImplemented, false);
    assert.equal(DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.reasoningImplemented, false);
    assert.equal(
      DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES.decisionEngineImplemented,
      false,
    );
  });

  it("Enterprise Runtime expõe AIOrchestrationRuntimePort provider enterprise + health.aiOrchestrationRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAIOrchestrationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps (sem consumo funcional)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAIOrchestrationRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.intelligentCaptureRuntimeOk, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.watchFolderRuntimeOk, true);
    assert.equal(health.uploadRuntimeOk, true);
    assert.equal(health.persistentQueueRuntimeOk, true);
    assert.equal(health.workerRuntimeOk, true);
    assert.equal(health.schedulerRuntimeOk, true);
    assert.equal(health.observabilityRuntimeOk, true);
    assert.equal(health.scalabilityRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/Gemini/Claude/Ollama/Llama/HTTP/ML funcional", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/ai-orchestration-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']@azure\/openai/i,
      /from ["']anthropic/i,
      /from ["']@anthropic/i,
      /from ["']@google\/generative-ai/i,
      /from ["']ollama/i,
      /langchain/i,
      /@tensorflow\//i,
      /@huggingface\//i,
      /\.predict\s*\(/,
      /createEmbedding\s*\(/i,
      /fetch\s*\(/,
      /https?:\/\//,
      /from ["']axios["']/,
      /new\s+FormData\s*\(/,
      /fs\.readFile/i,
      /createReadStream\s*\(/,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createAIOrchestrationRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createAIOrchestrationRuntimePort"));
    assert.ok(source.includes('provider: "enterprise"'));
    assert.ok(source.includes("getValidationRuntimePort"));
    assert.ok(source.includes("aiOrchestrationRuntimeOk"));
    assert.ok(source.includes("getAIOrchestrationRuntimePort"));
  });

  it("ECS-01 pastas obrigatórias existem", () => {
    const base = join(repoRoot, "src/lib/enterprise/ai-orchestration-runtime");
    for (const folder of [
      "ports",
      "providers",
      "factory",
      "registry",
      "adapters",
      "store",
      "demo",
    ]) {
      assert.equal(statSync(join(base, folder)).isDirectory(), true);
    }
    assert.equal(statSync(join(base, "index.ts")).isFile(), true);
  });
});
