#!/usr/bin/env node
/**
 * C-01 — Enterprise XML TISS Runtime Foundation
 * Prova: Application → XMLTISSRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareXMLDocument / getResult / stats
 *         + Enterprise Runtime + deps estruturais (Quality/AutoFill/TISSMapping/
 *           Audit/Validation/DocumentExtraction/DocumentClassification/OCR/
 *           AIOrchestration/IntelligentCapture/Scanner/WatchFolder/Upload)
 *         + contrato XMLTISSContext (CanonicalGuide + CanonicalMappingResult +
 *           AutoFillResult + QualityAssessment + ValidationResult + AuditResult +
 *           AIOrchestrationContext)
 *         + contratos de guias / versões / namespaces / schemas (somente estruturais)
 *         + ausência de geração XML / serialização / parser / XSD / SOAP /
 *           operadoras / banco / persistência / APIs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_TISS_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
  DefaultXMLTISSRuntimeAdapter,
  EnterpriseXMLTISSRuntimeAdapter,
  IN_MEMORY_XML_TISS_RUNTIME_STORE_ID,
  InMemoryXMLTISSRuntimeStore,
  MOCK_XML_TISS_RUNTIME_ADAPTER_ID,
  MockXMLTISSRuntimeAdapter,
  STRUCTURAL_XML_TISS_GUIDE_TYPES,
  XML_TISS_RUNTIME_IDENTITY,
  XMLTISSRuntimeFactory,
  XMLTISSRuntimeProvider,
  XMLTISSRuntimeRegistry,
  createDefaultXMLTISSRuntimeRegistry,
  createDisabledXMLGuide,
  createDisabledXMLTISSVersion,
  createXMLTISSRuntimeFactory,
  createXMLTISSRuntimePort,
  getXMLTISSRuntimeFactory,
  getXMLTISSRuntimeHealthSummary,
  getXMLTISSRuntimePort,
  resetAllXMLTISSRuntimeIdSequences,
  type AIOrchestrationContext,
  type AuditResult,
  type AutoFillResult,
  type CanonicalGuide,
  type CanonicalMappingResult,
  type QualityAssessment,
  type ValidationResult,
  type XMLTISSContext,
  type XMLTISSRuntimePort,
} from "../../../src/lib/enterprise/xml-tiss-runtime/index.ts";
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
    "xmlGenerationImplemented",
    "xmlSerializationImplemented",
    "xmlParsingImplemented",
    "xmlValidationImplemented",
    "xmlSigningImplemented",
    "xmlCompressionImplemented",
    "batchXmlGenerationImplemented",
    "soapIntegrationImplemented",
    "operatorIntegrationImplemented",
    "schemaValidationImplemented",
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
    status: "processed",
    canonicalModelImplemented: false,
    guideTransformationImplemented: false,
    mappingEngineImplemented: false,
    operatorMappingImplemented: false,
    templateMappingImplemented: false,
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

function sampleQualityAssessment(overrides: Partial<QualityAssessment> = {}): QualityAssessment {
  return {
    kind: "canonical-quality-assessment",
    assessmentId: "quality-assessment-structural",
    status: "prepared",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    qualityEngineImplemented: false,
    qualityScoreImplemented: false,
    ocrQualityImplemented: false,
    classificationQualityImplemented: false,
    extractionQualityImplemented: false,
    validationQualityImplemented: false,
    mappingQualityImplemented: false,
    autoFillQualityImplemented: false,
    auditQualityImplemented: false,
    approvalDecisionImplemented: false,
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
    structuralNotes: "C-01 structural peer context",
    ...overrides,
  };
}

function sampleXMLTISSContext(overrides: Partial<XMLTISSContext> = {}): XMLTISSContext {
  return {
    kind: "canonical-xml-tiss-context",
    canonicalGuide: sampleCanonicalGuide(),
    mappingResult: sampleMappingResult(),
    autoFillResult: sampleAutoFillResult(),
    qualityAssessment: sampleQualityAssessment(),
    validationResult: sampleValidationResult(),
    auditResult: sampleAuditResult(),
    aiOrchestrationContext: sampleAIOrchestrationContext(),
    structuralNotes: "C-01 structural only",
    ...overrides,
  };
}

describe("C-01 XMLTISSRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem geração de XML", async () => {
    const port: XMLTISSRuntimePort = new MockXMLTISSRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_TISS_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareXMLDocument, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultXMLTISSRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseXMLTISSRuntimeAdapter, DefaultXMLTISSRuntimeAdapter);
    const port = new DefaultXMLTISSRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise XML TISS Runtime Foundation vendor-agnostic", () => {
    assert.equal(XML_TISS_RUNTIME_IDENTITY.name, "Enterprise XML TISS Runtime");
    assert.equal(XML_TISS_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(XML_TISS_RUNTIME_IDENTITY.version);
    assert.equal(XML_TISS_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createXMLTISSRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "XML_TISS_RUNTIME");
  });

  it("provider default resolve enterprise via getXMLTISSRuntimePort/Provider", () => {
    const port = createXMLTISSRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getXMLTISSRuntimePort().providerId, "enterprise");
    assert.equal(XMLTISSRuntimeProvider.create().providerId, "enterprise");
    assert.equal(XMLTISSRuntimeProvider.get().providerId, "enterprise");
    assert.ok(XMLTISSRuntimeProvider.getFactory() instanceof XMLTISSRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createXMLTISSRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getXMLTISSRuntimeFactory().getRegistry().list().length,
      BUILTIN_XML_TISS_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultXMLTISSRuntimeRegistry();
    assert.ok(registry instanceof XMLTISSRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_XML_TISS_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.xmlGenerationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.xmlSerializationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.soapIntegrationImplemented, false);
  });

  it("prepareXMLDocument → getResult → stats (sem geração de XML)", async () => {
    resetAllXMLTISSRuntimeIdSequences();
    const xmlContext = sampleXMLTISSContext();
    const port = createXMLTISSRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareXMLDocument({
      xmlContext,
      canonicalGuide: xmlContext.canonicalGuide,
      mappingResult: xmlContext.mappingResult,
      autoFillResult: xmlContext.autoFillResult,
      qualityAssessment: xmlContext.qualityAssessment,
      validationResult: xmlContext.validationResult,
      auditResult: xmlContext.auditResult,
      aiOrchestrationContext: xmlContext.aiOrchestrationContext,
      tissVersion: createDisabledXMLTISSVersion("3.05.00"),
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.document?.status, "prepared");
    assert.equal(prepared.result?.runtimeReady, true);
    assert.equal(prepared.document?.xmlContext?.kind, "canonical-xml-tiss-context");
    assert.equal(prepared.document?.xmlContext?.canonicalGuide?.kind, "canonical-tiss-guide");
    assert.equal(
      prepared.document?.xmlContext?.mappingResult?.kind,
      "canonical-tiss-mapping-result",
    );
    assert.equal(prepared.document?.xmlContext?.autoFillResult?.kind, "canonical-auto-fill-result");
    assert.equal(
      prepared.document?.xmlContext?.qualityAssessment?.kind,
      "canonical-quality-assessment",
    );
    assert.equal(
      prepared.document?.xmlContext?.validationResult?.kind,
      "canonical-validation-result",
    );
    assert.equal(prepared.document?.xmlContext?.auditResult?.kind, "canonical-audit-result");
    assert.equal(
      prepared.document?.xmlContext?.aiOrchestrationContext?.kind,
      "canonical-ai-orchestration-context",
    );
    assertStructuralFlagsFalse(prepared.result as unknown as Record<string, unknown>);
    const documentId = prepared.document!.documentId;

    const result = await port.getResult({ documentId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.xmlGenerationImplemented, false);
    assert.equal(result.result?.xmlSerializationImplemented, false);
    assert.equal(result.result?.xmlParsingImplemented, false);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.totalDocuments, 1);
    assert.equal(stats.statistics?.preparedDocuments, 1);
    assert.equal(stats.statistics?.xmlGenerationImplementedCount, 0);
    assert.equal(stats.statistics?.xmlSerializationImplementedCount, 0);
    assert.equal(stats.statistics?.soapIntegrationImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryXMLTISSRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_TISS_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.documentCount(), 0);
    assert.equal(store.resultCount(), 0);
  });

  it("demo getXMLTISSRuntimeHealthSummary resume Port sem XML funcional", async () => {
    const port = createXMLTISSRuntimePort({ provider: "enterprise" });
    const summary = await getXMLTISSRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "XML_TISS_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.xmlGenerationImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.xmlSerializationImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.xmlParsingImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.xmlValidationImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.xmlSigningImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.xmlCompressionImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.batchXmlGenerationImplemented, false);
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.soapIntegrationImplemented, false);
    assert.equal(
      DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.operatorIntegrationImplemented,
      false,
    );
    assert.equal(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES.schemaValidationImplemented, false);
  });

  it("contratos de guias / versões (sem implementação)", () => {
    for (const guideType of STRUCTURAL_XML_TISS_GUIDE_TYPES) {
      const guide = createDisabledXMLGuide(guideType);
      assert.equal(guide.status, "disabled");
      assert.equal(guide.xmlGenerationImplemented, false);
      assert.equal(guide.xmlSerializationImplemented, false);
      assert.equal(guide.xmlParsingImplemented, false);
      assert.equal(guide.schemaValidationImplemented, false);
    }
    const version = createDisabledXMLTISSVersion();
    assert.equal(version.versionIdentificationImplemented, false);
    assert.equal(version.namespaceResolutionImplemented, false);
    assert.equal(version.schemaBindingImplemented, false);
    assert.equal(version.futureCompatibilityReady, true);
  });

  it("XMLTISSContext aceita peers estruturais sem processar", () => {
    const ctx = sampleXMLTISSContext();
    assert.equal(ctx.kind, "canonical-xml-tiss-context");
    assert.ok(ctx.canonicalGuide);
    assert.ok(ctx.mappingResult);
    assert.ok(ctx.autoFillResult);
    assert.ok(ctx.qualityAssessment);
    assert.ok(ctx.validationResult);
    assert.ok(ctx.auditResult);
    assert.ok(ctx.aiOrchestrationContext);
  });

  it("Enterprise Runtime expõe XMLTISSRuntimePort provider enterprise + health.xmlTissRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getXMLTISSRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlTissRuntimeOk, true);
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
    const port = runtime.getXMLTISSRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.qualityRuntimeOk, true);
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

  it("módulo não importa OpenAI/Azure/Gemini/Claude/HTTP/ML/DB/XML funcional/SOAP/XSD", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/xml-tiss-runtime");
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
      /from ["']soap/i,
      /require\(["']soap/i,
      /\.xsd["']/,
      /generateXML\s*\(/i,
      /serializeXML\s*\(/i,
      /parseXML\s*\(/i,
      /signXML\s*\(/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} contém padrão proibido: ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createXMLTISSRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createXMLTISSRuntimePort"));
    assert.ok(source.includes("xmlTissRuntimeOk"));
    assert.ok(source.includes("getXMLTISSRuntimePort"));
    assert.ok(source.includes("getQualityRuntimePort"));
    assert.ok(source.includes("getAutoFillRuntimePort"));
    assert.ok(source.includes("C-01"));
  });
});
