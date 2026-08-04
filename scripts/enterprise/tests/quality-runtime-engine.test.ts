#!/usr/bin/env node
/**
 * F3-CAP-13 — Enterprise Quality Runtime Foundation
 * Prova: Application → QualityRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareQualityAssessment / getResult / stats
 *         + Enterprise Runtime + deps estruturais (AutoFill/TISSMapping/Audit/
 *           Validation/DocumentExtraction/DocumentClassification/OCR/
 *           AIOrchestration/IntelligentCapture/Scanner/WatchFolder/Upload)
 *         + contrato QualityContext (OCRResult + DocumentClassificationResult +
 *           DocumentExtractionResult + ValidationResult + CanonicalMappingResult +
 *           AutoFillResult + AuditResult + AIOrchestrationContext)
 *         + contratos de métricas / score / decisão (somente estruturais)
 *         + ausência de avaliação automática / score funcional / decisão
 *           automática / IA / OCR / auditoria automática / banco / persistência / APIs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_QUALITY_RUNTIME_PROVIDER_COUNT,
  DEFAULT_QUALITY_RUNTIME_ADAPTER_ID,
  DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
  DefaultQualityRuntimeAdapter,
  EnterpriseQualityRuntimeAdapter,
  IN_MEMORY_QUALITY_RUNTIME_STORE_ID,
  InMemoryQualityRuntimeStore,
  MOCK_QUALITY_RUNTIME_ADAPTER_ID,
  MockQualityRuntimeAdapter,
  QUALITY_RUNTIME_IDENTITY,
  QualityRuntimeFactory,
  QualityRuntimeProvider,
  QualityRuntimeRegistry,
  STRUCTURAL_QUALITY_METRIC_KINDS,
  createDefaultQualityRuntimeRegistry,
  createDisabledQualityDecision,
  createDisabledQualityMetric,
  createDisabledQualityScore,
  createQualityRuntimeFactory,
  createQualityRuntimePort,
  getQualityRuntimeFactory,
  getQualityRuntimeHealthSummary,
  getQualityRuntimePort,
  resetAllQualityRuntimeIdSequences,
  type AIOrchestrationContext,
  type AuditResult,
  type AutoFillResult,
  type CanonicalMappingResult,
  type DocumentClassificationResult,
  type DocumentExtractionResult,
  type OCRResult,
  type QualityContext,
  type QualityRuntimePort,
  type ValidationResult,
} from "../../../src/lib/enterprise/quality-runtime/index.ts";
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
    "qualityEngineImplemented",
    "qualityScoreImplemented",
    "ocrQualityImplemented",
    "classificationQualityImplemented",
    "extractionQualityImplemented",
    "validationQualityImplemented",
    "mappingQualityImplemented",
    "autoFillQualityImplemented",
    "auditQualityImplemented",
    "approvalDecisionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleOCRResult(overrides: Partial<OCRResult> = {}): OCRResult {
  return {
    kind: "canonical-ocr-cap-result",
    ok: true,
    resultId: "ocr-result-structural",
    operation: "getResult",
    ocrEngineImplemented: false,
    pdfOcrImplemented: false,
    imageOcrImplemented: false,
    documentRecognitionImplemented: false,
    textExtractionImplemented: false,
    barcodeRecognitionImplemented: false,
    qrRecognitionImplemented: false,
    layoutAnalysisImplemented: false,
    tableRecognitionImplemented: false,
    handwritingRecognitionImplemented: false,
    multiEngineImplemented: false,
    confidenceScoreImplemented: false,
    languageDetectionImplemented: false,
    runtimeReady: true,
    status: "processed",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleClassificationResult(
  overrides: Partial<DocumentClassificationResult> = {},
): DocumentClassificationResult {
  return {
    kind: "canonical-classification-cap-result",
    ok: true,
    resultId: "classification-result-structural",
    operation: "getResult",
    classificationImplemented: false,
    documentRecognitionImplemented: false,
    templateRecognitionImplemented: false,
    medicalGuideRecognitionImplemented: false,
    documentCategoryImplemented: false,
    automaticRoutingImplemented: false,
    confidenceScoreImplemented: false,
    multiClassifierImplemented: false,
    layoutClassificationImplemented: false,
    semanticClassificationImplemented: false,
    runtimeReady: true,
    status: "processed",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
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

function sampleMappingResult(
  overrides: Partial<CanonicalMappingResult> = {},
): CanonicalMappingResult {
  return {
    kind: "canonical-tiss-mapping-result",
    ok: true,
    resultId: "mapping-result-structural",
    operation: "getResult",
    mappingEngineImplemented: false,
    operatorMappingImplemented: false,
    templateMappingImplemented: false,
    canonicalModelImplemented: false,
    guideTransformationImplemented: false,
    fieldNormalizationImplemented: false,
    tissVersionMappingImplemented: false,
    layoutMappingImplemented: false,
    xmlMappingImplemented: false,
    autoFillPreparationImplemented: false,
    runtimeReady: true,
    status: "processed",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleAutoFillResult(overrides: Partial<AutoFillResult> = {}): AutoFillResult {
  return {
    kind: "canonical-auto-fill-result",
    ok: true,
    resultId: "auto-fill-result-structural",
    operation: "getResult",
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
    runtimeReady: true,
    status: "processed",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleAuditResult(overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    kind: "canonical-audit-result",
    ok: true,
    resultId: "audit-result-structural",
    operation: "getResult",
    auditEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuditImplemented: false,
    operatorAuditImplemented: false,
    automaticAuditImplemented: false,
    auditSuggestionsImplemented: false,
    auditJustificationImplemented: false,
    auditScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
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
    structuralNotes: "F3-CAP-13 structural peer context",
    ...overrides,
  };
}

function sampleQualityContext(overrides: Partial<QualityContext> = {}): QualityContext {
  return {
    kind: "canonical-quality-context",
    ocrResult: sampleOCRResult(),
    classificationResult: sampleClassificationResult(),
    extractionResult: sampleExtractionResult(),
    validationResult: sampleValidationResult(),
    mappingResult: sampleMappingResult(),
    autoFillResult: sampleAutoFillResult(),
    auditResult: sampleAuditResult(),
    aiOrchestrationContext: sampleAIOrchestrationContext(),
    structuralNotes: "F3-CAP-13 structural only",
    ...overrides,
  };
}

describe("F3-CAP-13 QualityRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem avaliação automática", async () => {
    const port: QualityRuntimePort = new MockQualityRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_QUALITY_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareQualityAssessment, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultQualityRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseQualityRuntimeAdapter, DefaultQualityRuntimeAdapter);
    const port = new DefaultQualityRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_QUALITY_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Quality Runtime Foundation vendor-agnostic", () => {
    assert.equal(QUALITY_RUNTIME_IDENTITY.name, "Enterprise Quality Runtime");
    assert.equal(QUALITY_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(QUALITY_RUNTIME_IDENTITY.version);
    assert.equal(QUALITY_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createQualityRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "QUALITY_RUNTIME");
  });

  it("provider default resolve enterprise via getQualityRuntimePort/Provider", () => {
    const port = createQualityRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getQualityRuntimePort().providerId, "enterprise");
    assert.equal(QualityRuntimeProvider.create().providerId, "enterprise");
    assert.equal(QualityRuntimeProvider.get().providerId, "enterprise");
    assert.ok(QualityRuntimeProvider.getFactory() instanceof QualityRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createQualityRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getQualityRuntimeFactory().getRegistry().list().length,
      BUILTIN_QUALITY_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultQualityRuntimeRegistry();
    assert.ok(registry instanceof QualityRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.qualityEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.qualityScoreImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.approvalDecisionImplemented, false);
  });

  it("prepareQualityAssessment → getResult → stats (sem avaliação automática)", async () => {
    resetAllQualityRuntimeIdSequences();
    const qualityContext = sampleQualityContext();
    const port = createQualityRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareQualityAssessment({
      qualityContext,
      ocrResult: qualityContext.ocrResult,
      classificationResult: qualityContext.classificationResult,
      extractionResult: qualityContext.extractionResult,
      validationResult: qualityContext.validationResult,
      mappingResult: qualityContext.mappingResult,
      autoFillResult: qualityContext.autoFillResult,
      auditResult: qualityContext.auditResult,
      aiOrchestrationContext: qualityContext.aiOrchestrationContext,
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.assessment?.status, "prepared");
    assert.equal(prepared.result?.runtimeReady, true);
    assert.equal(prepared.assessment?.qualityContext?.kind, "canonical-quality-context");
    assert.equal(prepared.assessment?.qualityContext?.ocrResult?.kind, "canonical-ocr-cap-result");
    assert.equal(
      prepared.assessment?.qualityContext?.classificationResult?.kind,
      "canonical-classification-cap-result",
    );
    assert.equal(
      prepared.assessment?.qualityContext?.extractionResult?.kind,
      "canonical-document-extraction-result",
    );
    assert.equal(
      prepared.assessment?.qualityContext?.validationResult?.kind,
      "canonical-validation-result",
    );
    assert.equal(
      prepared.assessment?.qualityContext?.mappingResult?.kind,
      "canonical-tiss-mapping-result",
    );
    assert.equal(
      prepared.assessment?.qualityContext?.autoFillResult?.kind,
      "canonical-auto-fill-result",
    );
    assert.equal(prepared.assessment?.qualityContext?.auditResult?.kind, "canonical-audit-result");
    assert.equal(
      prepared.assessment?.qualityContext?.aiOrchestrationContext?.kind,
      "canonical-ai-orchestration-context",
    );
    assert.equal(prepared.assessment?.metrics?.length, STRUCTURAL_QUALITY_METRIC_KINDS.length);
    assert.equal(prepared.assessment?.score?.qualityScoreImplemented, false);
    assert.equal(prepared.assessment?.decision?.approvalDecisionImplemented, false);
    assertStructuralFlagsFalse(prepared.result as unknown as Record<string, unknown>);
    const assessmentId = prepared.assessment!.assessmentId;

    const result = await port.getResult({ assessmentId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.qualityEngineImplemented, false);
    assert.equal(result.result?.qualityScoreImplemented, false);
    assert.equal(result.result?.approvalDecisionImplemented, false);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.totalAssessments, 1);
    assert.equal(stats.statistics?.preparedAssessments, 1);
    assert.equal(stats.statistics?.qualityEngineImplementedCount, 0);
    assert.equal(stats.statistics?.qualityScoreImplementedCount, 0);
    assert.equal(stats.statistics?.approvalDecisionImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryQualityRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_QUALITY_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.assessmentCount(), 0);
    assert.equal(store.resultCount(), 0);
  });

  it("demo getQualityRuntimeHealthSummary resume Port sem avaliação", async () => {
    const port = createQualityRuntimePort({ provider: "enterprise" });
    const summary = await getQualityRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "QUALITY_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.qualityEngineImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.qualityScoreImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.ocrQualityImplemented, false);
    assert.equal(
      DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.classificationQualityImplemented,
      false,
    );
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.extractionQualityImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.validationQualityImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.mappingQualityImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.autoFillQualityImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.auditQualityImplemented, false);
    assert.equal(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES.approvalDecisionImplemented, false);
  });

  it("contratos de métricas / score / decisão (sem implementação)", () => {
    for (const metricKind of STRUCTURAL_QUALITY_METRIC_KINDS) {
      const metric = createDisabledQualityMetric(metricKind, metricKind);
      assert.equal(metric.status, "disabled");
      assert.equal(metric.metricValueImplemented, false);
      assert.equal(metric.qualityScoreImplemented, false);
      assert.equal(metric.qualityEngineImplemented, false);
    }
    const score = createDisabledQualityScore();
    assert.equal(score.status, "disabled");
    assert.equal(score.qualityScoreImplemented, false);
    const decision = createDisabledQualityDecision();
    assert.equal(decision.status, "disabled");
    assert.equal(decision.approvalDecisionImplemented, false);
  });

  it("QualityContext aceita peers estruturais sem processar", () => {
    const ctx = sampleQualityContext();
    assert.equal(ctx.kind, "canonical-quality-context");
    assert.ok(ctx.ocrResult);
    assert.ok(ctx.classificationResult);
    assert.ok(ctx.extractionResult);
    assert.ok(ctx.validationResult);
    assert.ok(ctx.mappingResult);
    assert.ok(ctx.autoFillResult);
    assert.ok(ctx.auditResult);
    assert.ok(ctx.aiOrchestrationContext);
  });

  it("Enterprise Runtime expõe QualityRuntimePort provider enterprise + health.qualityRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getQualityRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps (sem consumo funcional)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getQualityRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.intelligentCaptureRuntimeOk, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.watchFolderRuntimeOk, true);
    assert.equal(health.uploadRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/Gemini/Claude/HTTP/ML/DB/XML funcional", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/quality-runtime");
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
      /from ["']pg["']/,
      /from ["']postgres/i,
      /createClient\s*\(/,
      /XMLSerializer/,
      /DOMParser/,
      /computeScore\s*\(/i,
      /evaluateQuality\s*\(/i,
      /autoApprove\s*\(/i,
      /autoReject\s*\(/i,
      /\bapproveDocument\s*\(/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} contém padrão proibido: ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createQualityRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createQualityRuntimePort"));
    assert.ok(source.includes("qualityRuntimeOk"));
    assert.ok(source.includes("getQualityRuntimePort"));
    assert.ok(source.includes("getAutoFillRuntimePort"));
    assert.ok(source.includes("getTISSMappingRuntimePort"));
    assert.ok(source.includes("F3-CAP-13"));
  });
});
