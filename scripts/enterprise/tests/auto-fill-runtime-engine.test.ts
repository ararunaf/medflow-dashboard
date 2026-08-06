#!/usr/bin/env node
/**
 * F3-CAP-12 — Enterprise Auto-Fill Runtime Foundation
 * Prova: Application → AutoFillRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareAutoFill / getResult / stats
 *         + Enterprise Runtime + deps estruturais (TISSMapping/Audit/
 *           Validation/DocumentExtraction/DocumentClassification/OCR/
 *           AIOrchestration/IntelligentCapture/Scanner/WatchFolder/Upload)
 *         + contrato AutoFillContext (CanonicalGuide + CanonicalMappingResult +
 *           ValidationResult + AuditResult + AIOrchestrationContext)
 *         + contratos de guias / operadoras (somente estruturais)
 *         + ausência de preenchimento automático / XML / escrita em guias /
 *           integração com operadoras / IA / banco / persistência / APIs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTO_FILL_RUNTIME_IDENTITY,
  BUILTIN_AUTO_FILL_RUNTIME_PROVIDER_COUNT,
  DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  DefaultAutoFillRuntimeAdapter,
  EnterpriseAutoFillRuntimeAdapter,
  IN_MEMORY_AUTO_FILL_RUNTIME_STORE_ID,
  InMemoryAutoFillRuntimeStore,
  MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID,
  MockAutoFillRuntimeAdapter,
  AutoFillRuntimeFactory,
  AutoFillRuntimeProvider,
  AutoFillRuntimeRegistry,
  createDefaultAutoFillRuntimeRegistry,
  createDisabledAutoFillGuide,
  createDisabledAutoFillOperator,
  createAutoFillRuntimeFactory,
  createAutoFillRuntimePort,
  getAutoFillRuntimeFactory,
  getAutoFillRuntimeHealthSummary,
  getAutoFillRuntimePort,
  resetAllAutoFillRuntimeIdSequences,
  type AIOrchestrationContext,
  type AuditResult,
  type AutoFillContext,
  type AutoFillGuideSPADT,
  type AutoFillRuntimePort,
  type CanonicalGuide,
  type CanonicalMappingResult,
  type ValidationResult,
} from "../../../src/lib/enterprise/auto-fill-runtime/index.ts";
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
    "autoFillEngineImplemented",
    "guideGenerationImplemented",
    "fieldPopulationImplemented",
    "templatePopulationImplemented",
    "operatorPopulationImplemented",
    "xmlPopulationImplemented",
    "validationIntegrationImplemented",
    "auditIntegrationImplemented",
    "qualityIntegrationImplemented",
    "automaticCompletionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleCanonicalGuide(overrides: Partial<CanonicalGuide> = {}): CanonicalGuide {
  return {
    kind: "canonical-tiss-guide",
    guideId: "canonical-guide-structural",
    guideType: "sp-sadt",
    status: "prepared",
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
    structuralNotes: "F3-CAP-12 structural peer context",
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

function sampleAutoFillContext(overrides: Partial<AutoFillContext> = {}): AutoFillContext {
  const guide: AutoFillGuideSPADT = {
    ...createDisabledAutoFillGuide("sp-sadt", "Guia SP/SADT"),
    guideType: "sp-sadt",
    structuralRole: "guia-sp-sadt",
  };
  return {
    kind: "canonical-auto-fill-context",
    canonicalGuide: sampleCanonicalGuide(),
    mappingResult: sampleMappingResult(),
    validationResult: sampleValidationResult(),
    auditResult: sampleAuditResult(),
    aiOrchestrationContext: sampleAIOrchestrationContext(),
    guideType: guide.guideType,
    operator: createDisabledAutoFillOperator("unimed", "Unimed"),
    structuralNotes: "F3-CAP-12 structural only",
    ...overrides,
  };
}

describe("F3-CAP-12 AutoFillRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem preenchimento automático", async () => {
    const port: AutoFillRuntimePort = new MockAutoFillRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareAutoFill, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultAutoFillRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseAutoFillRuntimeAdapter, DefaultAutoFillRuntimeAdapter);
    const port = new DefaultAutoFillRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Auto-Fill Runtime Foundation vendor-agnostic", () => {
    assert.equal(AUTO_FILL_RUNTIME_IDENTITY.name, "Enterprise Auto-Fill Runtime");
    assert.equal(AUTO_FILL_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(AUTO_FILL_RUNTIME_IDENTITY.version);
    assert.equal(AUTO_FILL_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createAutoFillRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "AUTO_FILL_RUNTIME");
  });

  it("provider default resolve enterprise via getAutoFillRuntimePort/Provider", () => {
    const port = createAutoFillRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getAutoFillRuntimePort().providerId, "enterprise");
    assert.equal(AutoFillRuntimeProvider.create().providerId, "enterprise");
    assert.equal(AutoFillRuntimeProvider.get().providerId, "enterprise");
    assert.ok(AutoFillRuntimeProvider.getFactory() instanceof AutoFillRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createAutoFillRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getAutoFillRuntimeFactory().getRegistry().list().length,
      BUILTIN_AUTO_FILL_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultAutoFillRuntimeRegistry();
    assert.ok(registry instanceof AutoFillRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.autoFillEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.guideGenerationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.xmlPopulationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCompletionImplemented, false);
  });

  it("prepareAutoFill → getResult → stats (sem preenchimento automático)", async () => {
    resetAllAutoFillRuntimeIdSequences();
    const canonicalGuide = sampleCanonicalGuide();
    const mappingResult = sampleMappingResult();
    const validationResult = sampleValidationResult();
    const auditResult = sampleAuditResult();
    const aiOrchestrationContext = sampleAIOrchestrationContext();
    const autoFillContext = sampleAutoFillContext({
      canonicalGuide,
      mappingResult,
      validationResult,
      auditResult,
      aiOrchestrationContext,
    });
    const port = createAutoFillRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareAutoFill({
      guideType: "sp-sadt",
      operator: createDisabledAutoFillOperator("unimed", "Unimed"),
      autoFillContext,
      canonicalGuide,
      mappingResult,
      validationResult,
      auditResult,
      aiOrchestrationContext,
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.session?.status, "prepared");
    assert.equal(prepared.result?.runtimeReady, true);
    assert.equal(prepared.session?.autoFillContext?.kind, "canonical-auto-fill-context");
    assert.equal(prepared.session?.autoFillContext?.canonicalGuide?.kind, "canonical-tiss-guide");
    assert.equal(
      prepared.session?.autoFillContext?.mappingResult?.kind,
      "canonical-tiss-mapping-result",
    );
    assert.equal(
      prepared.session?.autoFillContext?.validationResult?.kind,
      "canonical-validation-result",
    );
    assert.equal(prepared.session?.autoFillContext?.auditResult?.kind, "canonical-audit-result");
    assert.equal(
      prepared.session?.autoFillContext?.aiOrchestrationContext?.kind,
      "canonical-ai-orchestration-context",
    );
    assert.equal(prepared.session?.guide?.guideType, "sp-sadt");
    assertStructuralFlagsFalse(prepared.result as unknown as Record<string, unknown>);
    const autoFillId = prepared.session!.autoFillId;

    const result = await port.getResult({ autoFillId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.autoFillEngineImplemented, false);
    assert.equal(result.result?.xmlPopulationImplemented, false);
    assert.equal(result.result?.automaticCompletionImplemented, false);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.totalSessions, 1);
    assert.equal(stats.statistics?.preparedSessions, 1);
    assert.equal(stats.statistics?.autoFillEngineImplementedCount, 0);
    assert.equal(stats.statistics?.xmlPopulationImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryAutoFillRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_AUTO_FILL_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.sessionCount(), 0);
    assert.equal(store.resultCount(), 0);
  });

  it("demo getAutoFillRuntimeHealthSummary resume Port sem preenchimento", async () => {
    const port = createAutoFillRuntimePort({ provider: "enterprise" });
    const summary = await getAutoFillRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "AUTO_FILL_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.autoFillEngineImplemented, false);
    assert.equal(DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.guideGenerationImplemented, false);
    assert.equal(DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.fieldPopulationImplemented, false);
    assert.equal(
      DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.templatePopulationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.operatorPopulationImplemented,
      false,
    );
    assert.equal(DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.xmlPopulationImplemented, false);
    assert.equal(
      DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.validationIntegrationImplemented,
      false,
    );
    assert.equal(DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.auditIntegrationImplemented, false);
    assert.equal(
      DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.qualityIntegrationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES.automaticCompletionImplemented,
      false,
    );
  });

  it("contratos de guias / operadoras (sem implementação)", () => {
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
      const guide = createDisabledAutoFillGuide(guideType, guideType);
      assert.equal(guide.status, "disabled");
      assert.equal(guide.autoFillEngineImplemented, false);
      assert.equal(guide.xmlPopulationImplemented, false);
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
      const operator = createDisabledAutoFillOperator(operatorKind, operatorKind);
      assert.equal(operator.status, "disabled");
      assert.equal(operator.operatorPopulationImplemented, false);
    }
  });

  it("AutoFillContext aceita peers estruturais sem processar", () => {
    const ctx = sampleAutoFillContext();
    assert.equal(ctx.kind, "canonical-auto-fill-context");
    assert.ok(ctx.canonicalGuide);
    assert.ok(ctx.mappingResult);
    assert.ok(ctx.validationResult);
    assert.ok(ctx.auditResult);
    assert.ok(ctx.aiOrchestrationContext);
  });

  it("Enterprise Runtime expõe AutoFillRuntimePort provider enterprise + health.autoFillRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAutoFillRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
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
    const port = runtime.getAutoFillRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
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
    const moduleRoot = join(repoRoot, "src/lib/enterprise/auto-fill-runtime");
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
      /preencherGuia/i,
      /escreverXML/i,
      /populateField\s*\(/i,
      /\bfillGuide\s*\(/i,
      /\bwriteGuide\s*\(/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} contém padrão proibido: ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createAutoFillRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createAutoFillRuntimePort"));
    assert.ok(source.includes("autoFillRuntimeOk"));
    assert.ok(source.includes("getAutoFillRuntimePort"));
    assert.ok(source.includes("getTISSMappingRuntimePort"));
    assert.ok(source.includes("F3-CAP-12"));
  });
});
