#!/usr/bin/env node
/**
 * F3-CAP-11 — Enterprise TISS Mapping Runtime Foundation
 * Prova: Application → TISSMappingRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareMapping / getResult / stats
 *         + Enterprise Runtime + deps estruturais (AIOrchestration/Audit/
 *           Validation/DocumentExtraction/DocumentClassification/OCR/ICR/
 *           Scanner/WatchFolder/Upload)
 *         + contrato TISSMappingContext (DocumentClassificationContext +
 *           DocumentExtractionResult + ValidationResult + AuditResult +
 *           AIOrchestrationContext)
 *         + Modelo Canônico (guias / operadoras / versões — só contratos)
 *         + ausência de mapeamento funcional / operadoras / XML /
 *           preenchimento automático / IA / banco / persistência / APIs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_TISS_MAPPING_RUNTIME_PROVIDER_COUNT,
  DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID,
  DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  DefaultTISSMappingRuntimeAdapter,
  EnterpriseTISSMappingRuntimeAdapter,
  IN_MEMORY_TISS_MAPPING_RUNTIME_STORE_ID,
  InMemoryTISSMappingRuntimeStore,
  MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID,
  MockTISSMappingRuntimeAdapter,
  TISS_MAPPING_RUNTIME_IDENTITY,
  TISSMappingRuntimeFactory,
  TISSMappingRuntimeProvider,
  TISSMappingRuntimeRegistry,
  createDefaultTISSMappingRuntimeRegistry,
  createDisabledCanonicalGuide,
  createDisabledCanonicalOperator,
  createDisabledTISSVersionContract,
  createTISSMappingRuntimeFactory,
  createTISSMappingRuntimePort,
  getTISSMappingRuntimeFactory,
  getTISSMappingRuntimeHealthSummary,
  getTISSMappingRuntimePort,
  resetAllTISSMappingRuntimeIdSequences,
  type AIOrchestrationContext,
  type AuditResult,
  type CanonicalGuideSPADT,
  type CanonicalOperator,
  type DocumentClassificationContext,
  type DocumentExtractionResult,
  type TISSMappingContext,
  type TISSMappingRuntimePort,
  type ValidationResult,
} from "../../../src/lib/enterprise/tiss-mapping-runtime/index.ts";
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
    "mappingEngineImplemented",
    "operatorMappingImplemented",
    "templateMappingImplemented",
    "canonicalModelImplemented",
    "guideTransformationImplemented",
    "fieldNormalizationImplemented",
    "tissVersionMappingImplemented",
    "layoutMappingImplemented",
    "xmlMappingImplemented",
    "autoFillPreparationImplemented",
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
    recommendedPipeline: "structural-tiss-mapping",
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
    structuralNotes: "F3-CAP-11 structural peer context",
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

function sampleTISSMappingContext(overrides: Partial<TISSMappingContext> = {}): TISSMappingContext {
  const operator: CanonicalOperator = createDisabledCanonicalOperator("unimed", "Unimed");
  const guide: CanonicalGuideSPADT = {
    ...createDisabledCanonicalGuide("sp-sadt", "Guia SP/SADT"),
    guideType: "sp-sadt",
    structuralRole: "guia-sp-sadt",
  };
  return {
    kind: "canonical-tiss-mapping-context",
    classificationContext: sampleClassificationContext(),
    extractionResult: sampleExtractionResult(),
    validationResult: sampleValidationResult(),
    auditResult: sampleAuditResult(),
    aiOrchestrationContext: sampleAIOrchestrationContext(),
    guideType: guide.guideType,
    tissVersion: "TISS_4_01",
    operator,
    structuralNotes: "F3-CAP-11 structural only",
    ...overrides,
  };
}

describe("F3-CAP-11 TISSMappingRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem mapeamento funcional", async () => {
    const port: TISSMappingRuntimePort = new MockTISSMappingRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareMapping, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultTISSMappingRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseTISSMappingRuntimeAdapter, DefaultTISSMappingRuntimeAdapter);
    const port = new DefaultTISSMappingRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise TISS Mapping Runtime Foundation vendor-agnostic", () => {
    assert.equal(TISS_MAPPING_RUNTIME_IDENTITY.name, "Enterprise TISS Mapping Runtime");
    assert.equal(TISS_MAPPING_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(TISS_MAPPING_RUNTIME_IDENTITY.version);
    assert.equal(TISS_MAPPING_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createTISSMappingRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "TISS_MAPPING_RUNTIME");
  });

  it("provider default resolve enterprise via getTISSMappingRuntimePort/Provider", () => {
    const port = createTISSMappingRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getTISSMappingRuntimePort().providerId, "enterprise");
    assert.equal(TISSMappingRuntimeProvider.create().providerId, "enterprise");
    assert.equal(TISSMappingRuntimeProvider.get().providerId, "enterprise");
    assert.ok(TISSMappingRuntimeProvider.getFactory() instanceof TISSMappingRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createTISSMappingRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getTISSMappingRuntimeFactory().getRegistry().list().length,
      BUILTIN_TISS_MAPPING_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultTISSMappingRuntimeRegistry();
    assert.ok(registry instanceof TISSMappingRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.mappingEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.operatorMappingImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.xmlMappingImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.autoFillPreparationImplemented, false);
  });

  it("prepareMapping → getResult → stats (sem mapeamento funcional)", async () => {
    resetAllTISSMappingRuntimeIdSequences();
    const classificationContext = sampleClassificationContext();
    const extractionResult = sampleExtractionResult();
    const validationResult = sampleValidationResult();
    const auditResult = sampleAuditResult();
    const aiOrchestrationContext = sampleAIOrchestrationContext({
      classificationContext,
      extractionResult,
      validationResult,
    });
    const mappingContext = sampleTISSMappingContext({
      classificationContext,
      extractionResult,
      validationResult,
      auditResult,
      aiOrchestrationContext,
    });
    const port = createTISSMappingRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareMapping({
      guideType: "sp-sadt",
      tissVersion: "TISS_4_01",
      operator: createDisabledCanonicalOperator("unimed", "Unimed"),
      mappingContext,
      classificationContext,
      extractionResult,
      validationResult,
      auditResult,
      aiOrchestrationContext,
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.mapping?.status, "prepared");
    assert.equal(prepared.result?.runtimeReady, true);
    assert.equal(prepared.mapping?.mappingContext?.kind, "canonical-tiss-mapping-context");
    assert.equal(
      prepared.mapping?.mappingContext?.classificationContext?.documentCategory,
      "medical-guide",
    );
    assert.equal(
      prepared.mapping?.mappingContext?.extractionResult?.kind,
      "canonical-document-extraction-result",
    );
    assert.equal(
      prepared.mapping?.mappingContext?.validationResult?.kind,
      "canonical-validation-result",
    );
    assert.equal(prepared.mapping?.mappingContext?.auditResult?.kind, "canonical-audit-result");
    assert.equal(
      prepared.mapping?.mappingContext?.aiOrchestrationContext?.kind,
      "canonical-ai-orchestration-context",
    );
    assert.equal(prepared.mapping?.guide?.guideType, "sp-sadt");
    assertStructuralFlagsFalse(prepared.result as unknown as Record<string, unknown>);
    const mappingId = prepared.mapping!.mappingId;

    const result = await port.getResult({ mappingId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.mappingEngineImplemented, false);
    assert.equal(result.result?.xmlMappingImplemented, false);
    assert.equal(result.result?.autoFillPreparationImplemented, false);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.totalMappings, 1);
    assert.equal(stats.statistics?.preparedMappings, 1);
    assert.equal(stats.statistics?.mappingEngineImplementedCount, 0);
    assert.equal(stats.statistics?.xmlMappingImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryTISSMappingRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_TISS_MAPPING_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.mappingCount(), 0);
    assert.equal(store.resultCount(), 0);
  });

  it("demo getTISSMappingRuntimeHealthSummary resume Port sem mapeamento", async () => {
    const port = createTISSMappingRuntimePort({ provider: "enterprise" });
    const summary = await getTISSMappingRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "TISS_MAPPING_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.mappingEngineImplemented, false);
    assert.equal(
      DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.operatorMappingImplemented,
      false,
    );
    assert.equal(
      DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.templateMappingImplemented,
      false,
    );
    assert.equal(DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.canonicalModelImplemented, false);
    assert.equal(
      DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.guideTransformationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.fieldNormalizationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.tissVersionMappingImplemented,
      false,
    );
    assert.equal(DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.layoutMappingImplemented, false);
    assert.equal(DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.xmlMappingImplemented, false);
    assert.equal(
      DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES.autoFillPreparationImplemented,
      false,
    );
  });

  it("Modelo Canônico — contratos de guias / operadoras / versões (sem implementação)", () => {
    const guideTypes = [
      "sp-sadt",
      "consulta",
      "internacao",
      "honorarios",
      "resumo-internacao",
      "odontologica",
      "anexo",
    ] as const;
    for (const guideType of guideTypes) {
      const guide = createDisabledCanonicalGuide(guideType, guideType);
      assert.equal(guide.status, "disabled");
      assert.equal(guide.mappingEngineImplemented, false);
      assert.equal(guide.xmlMappingImplemented, false);
    }

    const operators = [
      "unimed",
      "hapvida",
      "bradesco-saude",
      "sulamerica",
      "amil",
      "cassi",
      "geap",
      "ipm",
      "operadora-generica",
    ] as const;
    for (const operatorKind of operators) {
      const operator = createDisabledCanonicalOperator(operatorKind, operatorKind);
      assert.equal(operator.status, "disabled");
      assert.equal(operator.operatorMappingImplemented, false);
    }

    for (const version of ["TISS_4_00", "TISS_4_01", "FutureVersion"] as const) {
      const contract = createDisabledTISSVersionContract(version, version);
      assert.equal(contract.status, "disabled");
      assert.equal(contract.tissVersionMappingImplemented, false);
    }
  });

  it("TISSMappingContext aceita peers estruturais sem processar", () => {
    const ctx = sampleTISSMappingContext();
    assert.equal(ctx.kind, "canonical-tiss-mapping-context");
    assert.ok(ctx.classificationContext);
    assert.ok(ctx.extractionResult);
    assert.ok(ctx.validationResult);
    assert.ok(ctx.auditResult);
    assert.ok(ctx.aiOrchestrationContext);
  });

  it("Enterprise Runtime expõe TISSMappingRuntimePort provider enterprise + health.tissMappingRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getTISSMappingRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps (sem consumo funcional)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getTISSMappingRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.intelligentCaptureRuntimeOk, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.watchFolderRuntimeOk, true);
    assert.equal(health.uploadRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/Gemini/Claude/HTTP/ML/DB/XML funcional", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/tiss-mapping-runtime");
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
      /gerarGuia/i,
      /mapearOperadora/i,
      /preencherGuia/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} contém padrão proibido: ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createTISSMappingRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createTISSMappingRuntimePort"));
    assert.ok(source.includes("tissMappingRuntimeOk"));
    assert.ok(source.includes("getTISSMappingRuntimePort"));
    assert.ok(source.includes("getAuditRuntimePort"));
    assert.ok(source.includes("F3-CAP-11"));
  });
});
