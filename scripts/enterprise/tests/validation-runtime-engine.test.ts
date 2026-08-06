#!/usr/bin/env node
/**
 * F3-CAP-08 — Enterprise Validation Runtime Foundation
 * Prova: Application → ValidationRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerDocument / getResult / stats
 *         + Enterprise Runtime + deps estruturais (DocumentExtraction/DocumentClassification/
 *           OCR/ICR/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/Obs/Scalability)
 *         + contrato ValidationContext (DocumentClassificationContext + DocumentExtractionResult)
 *         + ausência de validação real / auditoria / IA / ML / LLM / TISS / operadoras /
 *           aprovação automática / rejeição automática / persistência
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_VALIDATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
  DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultValidationRuntimeAdapter,
  VALIDATION_RUNTIME_IDENTITY,
  ValidationRuntimeFactory,
  ValidationRuntimeProvider,
  ValidationRuntimeRegistry,
  EnterpriseValidationRuntimeAdapter,
  IN_MEMORY_VALIDATION_RUNTIME_STORE_ID,
  InMemoryValidationRuntimeStore,
  MOCK_VALIDATION_RUNTIME_ADAPTER_ID,
  MockValidationRuntimeAdapter,
  createDefaultValidationRuntimeRegistry,
  createValidationRuntimeFactory,
  createValidationRuntimePort,
  getValidationRuntimeFactory,
  getValidationRuntimeHealthSummary,
  getValidationRuntimePort,
  resetAllValidationRuntimeIdSequences,
  type DocumentClassificationContext,
  type DocumentExtractionResult,
  type ValidationContext,
  type ValidationRuntimePort,
} from "../../../src/lib/enterprise/validation-runtime/index.ts";
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
    "fieldValidationImplemented",
    "documentValidationImplemented",
    "templateValidationImplemented",
    "operatorValidationImplemented",
    "tissValidationImplemented",
    "confidenceValidationImplemented",
    "qualityValidationImplemented",
    "mandatoryFieldValidationImplemented",
    "crossFieldValidationImplemented",
    "businessRuleValidationImplemented",
    "automaticApprovalImplemented",
    "automaticRejectionImplemented",
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
    recommendedPipeline: "structural-validation",
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

function sampleValidationContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    kind: "canonical-validation-context",
    classificationContext: sampleClassificationContext(),
    extractionResult: sampleExtractionResult(),
    futureRules: {
      kind: "canonical-future-validation-rule-contracts",
      templateMatchesOperatorDeclared: false,
      tissVersionCompatibleDeclared: false,
      documentCompatibleWithTemplateDeclared: false,
      minimumQualityDeclared: false,
      minimumConfidenceDeclared: false,
      mandatoryFieldsDeclared: false,
      crossFieldConsistencyDeclared: false,
      guideOperatorCompatibilityDeclared: false,
      documentConsistencyDeclared: false,
      overallValidationScoreDeclared: false,
    },
    structuralNotes: "F3-CAP-08 structural only",
    ...overrides,
  };
}

describe("F3-CAP-08 ValidationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem validação real", async () => {
    const port: ValidationRuntimePort = new MockValidationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_VALIDATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterDocument, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultValidationRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseValidationRuntimeAdapter, DefaultValidationRuntimeAdapter);
    const port = new DefaultValidationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Validation Runtime Foundation vendor-agnostic", () => {
    assert.equal(VALIDATION_RUNTIME_IDENTITY.name, "Enterprise Validation Runtime");
    assert.equal(VALIDATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(VALIDATION_RUNTIME_IDENTITY.version);
    assert.equal(VALIDATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createValidationRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "VALIDATION_RUNTIME");
  });

  it("provider default resolve enterprise via getValidationRuntimePort/Provider", () => {
    const port = createValidationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getValidationRuntimePort().providerId, "enterprise");
    assert.equal(ValidationRuntimeProvider.create().providerId, "enterprise");
    assert.equal(ValidationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(ValidationRuntimeProvider.getFactory() instanceof ValidationRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createValidationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getValidationRuntimeFactory().getRegistry().list().length,
      BUILTIN_VALIDATION_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultValidationRuntimeRegistry();
    assert.ok(registry instanceof ValidationRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.fieldValidationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tissValidationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticApprovalImplemented, false);
  });

  it("openJob → submitRequest → registerDocument → getResult → closeJob → stats (sem validação real)", async () => {
    resetAllValidationRuntimeIdSequences();
    const classificationContext = sampleClassificationContext();
    const extractionResult = sampleExtractionResult();
    const validationContext = sampleValidationContext({
      classificationContext,
      extractionResult,
    });
    const port = createValidationRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-f3-cap-08",
      validationContext,
      classificationContext,
      extractionResult,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.validationContext?.kind, "canonical-validation-context");
    assert.equal(
      opened.job?.validationContext?.classificationContext?.documentCategory,
      "medical-guide",
    );
    assert.equal(
      opened.job?.validationContext?.extractionResult?.kind,
      "canonical-document-extraction-result",
    );
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      documentId: "doc-f3-cap-08",
      validationContext,
      classificationContext,
      extractionResult,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    assert.equal(submitted.request?.classificationContext?.templateId, "tpl-estrutural-001");
    const requestId = submitted.request!.requestId;

    const registered = await port.registerDocument({
      jobId,
      requestId,
      documentId: "doc-f3-cap-08",
      validationContext,
      classificationContext,
      extractionResult,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.document?.status, "registered");
    assertStructuralFlagsFalse(registered.document as unknown as Record<string, unknown>);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.issues?.length, 0);
    assert.equal(result.result?.warnings?.length, 0);
    assert.equal(result.result?.errors?.length, 0);
    assert.equal(result.result?.summary?.fieldValidationImplemented, false);
    assert.equal(result.result?.summary?.automaticApprovalImplemented, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-validation-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalDocuments ?? 0) >= 1);
    assert.equal(stats.statistics?.fieldValidationImplementedCount, 0);
    assert.equal(stats.statistics?.tissValidationImplementedCount, 0);
    assert.equal(stats.statistics?.automaticApprovalImplementedCount, 0);
  });

  it("contrato ValidationContext recebe DocumentClassificationContext + DocumentExtractionResult", () => {
    const ctx = sampleValidationContext();
    assert.equal(ctx.kind, "canonical-validation-context");
    assert.equal(ctx.classificationContext?.kind, "canonical-document-classification-context");
    assert.equal(ctx.extractionResult?.kind, "canonical-document-extraction-result");
    assert.equal(ctx.futureRules?.templateMatchesOperatorDeclared, false);
    assert.equal(ctx.futureRules?.tissVersionCompatibleDeclared, false);
    assert.equal(ctx.futureRules?.overallValidationScoreDeclared, false);
  });

  it("InMemory store persiste jobs/requests/documents/results (F3-CAP-08)", async () => {
    const store = new InMemoryValidationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_VALIDATION_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultValidationRuntimeAdapter({
      provider: "enterprise",
      store,
    });
    await port.openJob({ jobId: "job-store-1" });
    await port.submitRequest({ jobId: "job-store-1", requestId: "req-store-1" });
    await port.registerDocument({ documentId: "doc-store-1", jobId: "job-store-1" });
    assert.equal(store.jobCount(), 1);
    assert.equal(store.requestCount(), 1);
    assert.equal(store.documentCount(), 1);

    const statistics = store.statistics();
    assert.equal(statistics.kind, "canonical-validation-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultValidationRuntimeAdapter({
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
    const port = createValidationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "VALIDATION_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("demo getValidationRuntimeHealthSummary resume health/capabilities/info", async () => {
    const port = createValidationRuntimePort({ provider: "enterprise" });
    const summary = await getValidationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "VALIDATION_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.fieldValidationImplemented, false);
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.documentValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.templateValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.operatorValidationImplemented,
      false,
    );
    assert.equal(DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.tissValidationImplemented, false);
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.confidenceValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.qualityValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.mandatoryFieldValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.crossFieldValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.businessRuleValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.automaticApprovalImplemented,
      false,
    );
    assert.equal(
      DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.automaticRejectionImplemented,
      false,
    );
  });

  it("Enterprise Runtime expõe ValidationRuntimePort provider enterprise + health.validationRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getValidationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps (sem consumo funcional)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getValidationRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
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

  it("módulo não importa OCR/IA/ML/LLM/validação TISS funcional", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/validation-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']anthropic/i,
      /@tensorflow\//i,
      /@huggingface\//i,
      /langchain/i,
      /\.predict\s*\(/,
      /createEmbedding\s*\(/i,
      /documentintelligence\.azure\.com/i,
      /vision\.googleapis\.com/i,
      /textract\.(amazonaws|aws)/i,
      /tesseract\.js/i,
      /from ["']tesseract/i,
      /fetch\s*\(/,
      /https?:\/\//,
      /from ["']axios["']/,
      /new\s+FormData\s*\(/,
      /fs\.readFile/i,
      /createReadStream\s*\(/,
      /new\s+RegExp\s*\(/,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createValidationRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createValidationRuntimePort"));
    assert.ok(source.includes('provider: "enterprise"'));
    assert.ok(source.includes("getDocumentExtractionRuntimePort"));
    assert.ok(source.includes("validationRuntimeOk"));
    assert.ok(source.includes("getValidationRuntimePort"));
  });

  it("ECS-01 pastas obrigatórias existem", () => {
    const base = join(repoRoot, "src/lib/enterprise/validation-runtime");
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
