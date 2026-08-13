#!/usr/bin/env node
/**
 * F3-CAP-10 — Enterprise Audit Runtime Foundation
 * Prova: Application → AuditRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerFinding / getResult / stats
 *         + Enterprise Runtime + deps estruturais (AIOrchestration/Validation/
 *           DocumentExtraction/DocumentClassification/OCR/ICR/Scanner/
 *           WatchFolder/Upload/PQR/Worker/Scheduler/Obs/Scalability)
 *         + contrato AuditContext (DocumentClassificationContext +
 *           DocumentExtractionResult + ValidationResult + AIOrchestrationContext)
 *         + ausência de auditoria real / IA / OpenAI / Azure OpenAI / Gemini /
 *           Claude / ML / regras TISS / regras de operadoras / justificativas /
 *           correções / aprovação/rejeição automáticas / persistência
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUDIT_RUNTIME_IDENTITY,
  AuditRuntimeFactory,
  AuditRuntimeProvider,
  AuditRuntimeRegistry,
  BUILTIN_AUDIT_RUNTIME_PROVIDER_COUNT,
  DEFAULT_AUDIT_RUNTIME_ADAPTER_ID,
  DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  DefaultAuditRuntimeAdapter,
  EnterpriseAuditRuntimeAdapter,
  IN_MEMORY_AUDIT_RUNTIME_STORE_ID,
  InMemoryAuditRuntimeStore,
  MOCK_AUDIT_RUNTIME_ADAPTER_ID,
  MockAuditRuntimeAdapter,
  REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
  REALTISS_AUDIT_RUNTIME_VERSION,
  RealTissAuditRuntimeAdapter,
  createDefaultAuditRuntimeRegistry,
  createDisabledAuditTypeContract,
  createAuditRuntimeFactory,
  createAuditRuntimePort,
  getAuditRuntimeFactory,
  getAuditRuntimeHealthSummary,
  getAuditRuntimePort,
  resetAllAuditRuntimeIdSequences,
  type AIOrchestrationContext,
  type AuditContext,
  type AuditRuntimePort,
  type DocumentClassificationContext,
  type DocumentExtractionResult,
  type TechnicalAudit,
  type ValidationResult,
} from "../../../src/lib/enterprise/audit-runtime/index.ts";
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
    "auditEngineImplemented",
    "businessRulesImplemented",
    "tissAuditImplemented",
    "operatorAuditImplemented",
    "automaticAuditImplemented",
    "auditSuggestionsImplemented",
    "auditJustificationImplemented",
    "auditScoreImplemented",
    "complianceImplemented",
    "automaticCorrectionImplemented",
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
    recommendedPipeline: "structural-audit",
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

function sampleAIOrchestrationContext(
  overrides: Partial<AIOrchestrationContext> = {},
): AIOrchestrationContext {
  return {
    kind: "canonical-ai-orchestration-context",
    classificationContext: sampleClassificationContext(),
    extractionResult: sampleExtractionResult(),
    validationResult: sampleValidationResult(),
    structuralNotes: "F3-CAP-10 structural peer context",
    ...overrides,
  };
}

function sampleAuditContext(overrides: Partial<AuditContext> = {}): AuditContext {
  const technical: TechnicalAudit = {
    ...createDisabledAuditTypeContract("technical", "Technical Audit"),
    auditType: "technical",
    structuralRole: "technical-audit",
  };
  return {
    kind: "canonical-audit-context",
    classificationContext: sampleClassificationContext(),
    extractionResult: sampleExtractionResult(),
    validationResult: sampleValidationResult(),
    aiOrchestrationContext: sampleAIOrchestrationContext(),
    auditTypes: [technical],
    structuralNotes: "F3-CAP-10 structural only",
    ...overrides,
  };
}

describe("F3-CAP-10 AuditRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem auditoria real", async () => {
    const port: AuditRuntimePort = new MockAuditRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_AUDIT_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultAuditRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseAuditRuntimeAdapter, DefaultAuditRuntimeAdapter);
    const port = new DefaultAuditRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_AUDIT_RUNTIME_ADAPTER_ID);
  });

  it("RealTissAuditRuntimeAdapter respeita o Port, providerId real-tiss e delega ao Default", async () => {
    const port: AuditRuntimePort = new RealTissAuditRuntimeAdapter({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_AUDIT_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_AUDIT_RUNTIME_VERSION);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("identity declara Enterprise Audit Runtime Foundation vendor-agnostic", () => {
    assert.equal(AUDIT_RUNTIME_IDENTITY.name, "Enterprise Audit Runtime");
    assert.equal(AUDIT_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(AUDIT_RUNTIME_IDENTITY.version);
    assert.equal(AUDIT_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createAuditRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "AUDIT_RUNTIME");
  });

  it("provider default resolve enterprise via getAuditRuntimePort/Provider", () => {
    const port = createAuditRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getAuditRuntimePort().providerId, "enterprise");
    assert.equal(AuditRuntimeProvider.create().providerId, "enterprise");
    assert.equal(AuditRuntimeProvider.get().providerId, "enterprise");
    assert.ok(AuditRuntimeProvider.getFactory() instanceof AuditRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createAuditRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(
      getAuditRuntimeFactory().getRegistry().list().length,
      BUILTIN_AUDIT_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultAuditRuntimeRegistry();
    assert.ok(registry instanceof AuditRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_AUDIT_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.auditEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tissAuditImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCorrectionImplemented, false);
    assert.equal(registry.get("real-tiss")?.vendor, "real-tiss");
    assert.equal(registry.get("real-tiss")?.adapterId, REALTISS_AUDIT_RUNTIME_ADAPTER_ID);
    assert.equal(registry.get("real-tiss")?.version, REALTISS_AUDIT_RUNTIME_VERSION);
  });

  it("openJob → submitRequest → registerFinding → getResult → closeJob → stats (sem auditoria real)", async () => {
    resetAllAuditRuntimeIdSequences();
    const classificationContext = sampleClassificationContext();
    const extractionResult = sampleExtractionResult();
    const validationResult = sampleValidationResult();
    const aiOrchestrationContext = sampleAIOrchestrationContext({
      classificationContext,
      extractionResult,
      validationResult,
    });
    const auditContext = sampleAuditContext({
      classificationContext,
      extractionResult,
      validationResult,
      aiOrchestrationContext,
    });
    const port = createAuditRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-f3-cap-10",
      auditContext,
      classificationContext,
      extractionResult,
      validationResult,
      aiOrchestrationContext,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.auditContext?.kind, "canonical-audit-context");
    assert.equal(
      opened.job?.auditContext?.classificationContext?.documentCategory,
      "medical-guide",
    );
    assert.equal(
      opened.job?.auditContext?.extractionResult?.kind,
      "canonical-document-extraction-result",
    );
    assert.equal(opened.job?.auditContext?.validationResult?.kind, "canonical-validation-result");
    assert.equal(
      opened.job?.auditContext?.aiOrchestrationContext?.kind,
      "canonical-ai-orchestration-context",
    );
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      findingId: "finding-f3-cap-10",
      auditContext,
      classificationContext,
      extractionResult,
      validationResult,
      aiOrchestrationContext,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    assert.equal(submitted.request?.classificationContext?.templateId, "tpl-estrutural-001");
    const requestId = submitted.request!.requestId;

    const registered = await port.registerFinding({
      jobId,
      requestId,
      findingId: "finding-f3-cap-10",
      auditType: "technical",
      auditContext,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.finding?.status, "registered");
    assert.equal(registered.finding?.auditType, "technical");
    assert.equal(registered.finding?.auditEngineImplemented, false);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.auditEngineImplemented, false);
    assert.equal(result.result?.automaticAuditImplemented, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-audit-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalFindings ?? 0) >= 1);
    assert.equal(stats.statistics?.auditEngineImplementedCount, 0);
    assert.equal(stats.statistics?.tissAuditImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCorrectionImplementedCount, 0);
  });

  it("contrato AuditContext recebe Classification + Extraction + Validation + AIOrchestration", () => {
    const ctx = sampleAuditContext();
    assert.equal(ctx.kind, "canonical-audit-context");
    assert.equal(ctx.classificationContext?.kind, "canonical-document-classification-context");
    assert.equal(ctx.extractionResult?.kind, "canonical-document-extraction-result");
    assert.equal(ctx.validationResult?.kind, "canonical-validation-result");
    assert.equal(ctx.aiOrchestrationContext?.kind, "canonical-ai-orchestration-context");
    assert.equal(ctx.auditTypes?.[0]?.auditEngineImplemented, false);
    assert.equal(ctx.auditTypes?.[0]?.tissAuditImplemented, false);
  });

  it("InMemory store persiste jobs/requests/findings/results (F3-CAP-10)", async () => {
    const store = new InMemoryAuditRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_AUDIT_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultAuditRuntimeAdapter({
      provider: "enterprise",
      store,
    });
    await port.openJob({ jobId: "job-store-1" });
    await port.submitRequest({ jobId: "job-store-1", requestId: "req-store-1" });
    await port.registerFinding({ findingId: "finding-store-1", jobId: "job-store-1" });
    assert.equal(store.jobCount(), 1);
    assert.equal(store.requestCount(), 1);
    assert.equal(store.findingCount(), 1);

    const statistics = store.statistics();
    assert.equal(statistics.kind, "canonical-audit-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultAuditRuntimeAdapter({
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
    const port = createAuditRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUDIT_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("demo getAuditRuntimeHealthSummary resume health/capabilities/info", async () => {
    const port = createAuditRuntimePort({ provider: "enterprise" });
    const summary = await getAuditRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "AUDIT_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.auditEngineImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.businessRulesImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.tissAuditImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.operatorAuditImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.automaticAuditImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.auditSuggestionsImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.auditJustificationImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.auditScoreImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.complianceImplemented, false);
    assert.equal(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES.automaticCorrectionImplemented, false);
  });

  it("Enterprise Runtime expõe AuditRuntimePort provider enterprise + health.auditRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAuditRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps (sem consumo funcional)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAuditRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
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

  it("módulo não importa OpenAI/Azure/Gemini/Claude/HTTP/ML/DB funcional", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/audit-runtime");
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
      /from ["']@supabase/i,
      /CREATE TABLE/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createAuditRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createAuditRuntimePort"));
    assert.ok(source.includes('provider: "enterprise"'));
    assert.ok(source.includes("getAIOrchestrationRuntimePort"));
    assert.ok(source.includes("auditRuntimeOk"));
    assert.ok(source.includes("getAuditRuntimePort"));
  });

  it("ECS-01 pastas obrigatórias existem", () => {
    const base = join(repoRoot, "src/lib/enterprise/audit-runtime");
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
