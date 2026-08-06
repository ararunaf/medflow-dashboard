#!/usr/bin/env node
/**
 * C-02 — Enterprise XML Validation Runtime Foundation
 * Prova: Application → XMLValidationRuntimePort → Adapter → Factory → Registry → Store
 *         + validate / getResult / listResults / stats
 *         + Enterprise Runtime + deps estruturais (XMLTISS/Quality/AutoFill/TISSMapping/
 *           Audit/Validation/DocumentExtraction/DocumentClassification/OCR/
 *           AIOrchestration)
 *         + contrato XMLValidationContext (XMLDocument + CanonicalGuide +
 *           CanonicalMappingResult + QualityAssessment + ValidationResult +
 *           AuditResult + AutoFillResult)
 *         + contratos structure/schema/namespace/version/integrity/consistency/
 *           compatibility/report (somente estruturais)
 *         + ausência de validação XML / XSD / parser / correção automática /
 *           SOAP / operadoras / banco / persistência / APIs / IA
 *         + compatibilidade de cadeia TISS (validate API)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultXMLValidationRuntimeAdapter,
  EnterpriseXMLValidationRuntimeAdapter,
  IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID,
  InMemoryXMLValidationRuntimeStore,
  MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID,
  MockXMLValidationRuntimeAdapter,
  XML_VALIDATION_RUNTIME_IDENTITY,
  XMLValidationRuntimeFactory,
  XMLValidationRuntimeProvider,
  XMLValidationRuntimeRegistry,
  createDefaultXMLValidationRuntimeRegistry,
  createDisabledXMLValidationReport,
  createDisabledXMLValidationSchema,
  createDisabledXMLValidationStructure,
  createXMLValidationRuntimeFactory,
  createXMLValidationRuntimePort,
  getXMLValidationRuntimeFactory,
  getXMLValidationRuntimeHealthSummary,
  getXMLValidationRuntimePort,
  resetAllXMLValidationRuntimeIdSequences,
  type AuditResult,
  type AutoFillResult,
  type CanonicalGuide,
  type CanonicalMappingResult,
  type QualityAssessment,
  type ValidationResult,
  type XMLValidationContext,
  type XMLValidationRuntimePort,
} from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createXSDRuntimePort } from "../../../src/lib/enterprise/xsd-runtime/index.ts";
import { createNamespaceRuntimePort } from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createQueueRuntimePort } from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createSchedulerRuntimePort } from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
import { createWorkerRuntimePort } from "../../../src/lib/enterprise/worker-runtime/index.ts";
import { createPersistentQueueRuntimePort } from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
import { createObservabilityRuntimePort } from "../../../src/lib/enterprise/observability-runtime/index.ts";
import { createScalabilityRuntimePort } from "../../../src/lib/enterprise/scalability-runtime/index.ts";
import type { TISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/ports/tiss-runtime-port.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import { createTISSProviderPort } from "../../../src/lib/enterprise/tiss-provider/index.ts";
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

function assertFunctionalFlagsForD05(obj: Record<string, unknown>) {
  assert.equal(
    obj.xsdValidationImplemented,
    true,
    "xsdValidationImplemented deveria ser true (D-02)",
  );
  assert.equal(
    obj.namespaceValidationImplemented,
    true,
    "namespaceValidationImplemented deveria ser true (D-04)",
  );
  assert.equal(
    obj.versionValidationImplemented,
    true,
    "versionValidationImplemented deveria ser true (D-05)",
  );
  const flags = [
    "xmlValidationImplemented",
    "schemaSelectionImplemented",
    "businessValidationImplemented",
    "operatorValidationImplemented",
    "xmlRepairImplemented",
    "automaticCorrectionImplemented",
    "validationReportImplemented",
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

function sampleXMLValidationContext(
  overrides: Partial<XMLValidationContext> = {},
): XMLValidationContext {
  return {
    kind: "canonical-xml-validation-context",
    canonicalGuide: sampleCanonicalGuide(),
    mappingResult: sampleMappingResult(),
    autoFillResult: sampleAutoFillResult(),
    qualityAssessment: sampleQualityAssessment(),
    validationResult: sampleValidationResult(),
    auditResult: sampleAuditResult(),
    structuralNotes: "C-02 structural only",
    ...overrides,
  };
}

describe("C-02 XMLValidationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem validação XML", async () => {
    const port: XMLValidationRuntimePort = new MockXMLValidationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.validationEngineReady, true);
    assertFunctionalFlagsForD05(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsValidate, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsListResults, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertFunctionalFlagsForD05(caps as unknown as Record<string, unknown>);
  });

  it("DefaultXMLValidationRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseXMLValidationRuntimeAdapter, DefaultXMLValidationRuntimeAdapter);
    const port = new DefaultXMLValidationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise XML Validation Runtime Foundation vendor-agnostic", () => {
    assert.equal(XML_VALIDATION_RUNTIME_IDENTITY.name, "Enterprise XML Validation Runtime");
    assert.equal(XML_VALIDATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(XML_VALIDATION_RUNTIME_IDENTITY.version);
    assert.equal(XML_VALIDATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createXMLValidationRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "XML_VALIDATION_RUNTIME");
  });

  it("provider default resolve enterprise via getXMLValidationRuntimePort/Provider", () => {
    const port = createXMLValidationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getXMLValidationRuntimePort().providerId, "enterprise");
    assert.equal(XMLValidationRuntimeProvider.create().providerId, "enterprise");
    assert.equal(XMLValidationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(XMLValidationRuntimeProvider.getFactory() instanceof XMLValidationRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createXMLValidationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getXMLValidationRuntimeFactory().getRegistry().list().length,
      BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultXMLValidationRuntimeRegistry();
    assert.ok(registry instanceof XMLValidationRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.xmlValidationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.xsdValidationImplemented, true);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCorrectionImplemented, false);
  });

  it("validate → getResult → listResults → stats (sem validação XML)", async () => {
    resetAllXMLValidationRuntimeIdSequences();
    const xmlContext = sampleXMLValidationContext();
    const port = createXMLValidationRuntimePort({ provider: "enterprise" });

    const validated = await port.validate({
      documentId: "doc-c02-01",
      xmlContext,
      canonicalGuide: xmlContext.canonicalGuide,
      mappingResult: xmlContext.mappingResult,
      autoFillResult: xmlContext.autoFillResult,
      qualityAssessment: xmlContext.qualityAssessment,
      validationResult: xmlContext.validationResult,
      auditResult: xmlContext.auditResult,
      request: {
        kind: "canonical-xml-validation-request",
        name: "Foundation Validation",
        structuralNotes: "C-02 structural only",
      },
    });
    assert.equal(validated.ok, true);
    assert.ok(validated.result?.resultId);
    assert.equal(validated.result?.validationExecuted, false);
    assert.equal(validated.result?.realValidationPerformed, false);
    assert.equal(validated.result?.officialXsdLoaded, false);
    assert.equal(validated.result?.officialAnsValidation, false);
    assert.equal(validated.result?.officialTissValidation, false);
    assert.equal(validated.result?.validationRulesLoaded, false);
    assert.equal(validated.result?.validationEngineReady, true);
    assert.equal(validated.result?.runtimeReady, true);
    assert.equal(validated.result?.issues.length, 0);
    assert.equal(validated.result?.status, "validated");
    assert.equal(validated.result?.xmlContext?.kind, "canonical-xml-validation-context");
    assert.equal(validated.result?.xmlContext?.canonicalGuide?.kind, "canonical-tiss-guide");
    assertFunctionalFlagsForD05(validated.result as unknown as Record<string, unknown>);

    const loaded = await port.getResult({ resultId: validated.result!.resultId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, validated.result!.resultId);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.validationExecutedCount, 0);
    assert.equal(listed.statistics?.xmlValidationImplementedCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalResults ?? 0) >= 1);
    assert.equal(stats.statistics?.xsdValidationImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCorrectionImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryXMLValidationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.resultCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.contextCount(), 0);
  });

  it("demo getXMLValidationRuntimeHealthSummary resume Port sem validação funcional", async () => {
    const port = createXMLValidationRuntimePort({ provider: "enterprise" });
    const summary = await getXMLValidationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "XML_VALIDATION_RUNTIME");
    assertFunctionalFlagsForD05(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara xsdValidationImplemented (D-02), namespaceValidationImplemented (D-04) e versionValidationImplemented (D-05) ativas, demais false", () => {
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.xmlValidationImplemented,
      false,
    );
    assert.equal(DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.xsdValidationImplemented, true);
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.namespaceValidationImplemented,
      true,
    );
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.schemaSelectionImplemented,
      false,
    );
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.versionValidationImplemented,
      true,
    );
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.businessValidationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.operatorValidationImplemented,
      false,
    );
    assert.equal(DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.xmlRepairImplemented, false);
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.automaticCorrectionImplemented,
      false,
    );
    assert.equal(
      DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES.validationReportImplemented,
      false,
    );
  });

  it("contratos estruturais (structure/schema/report) sem implementação", () => {
    const structure = createDisabledXMLValidationStructure();
    assert.equal(structure.structureValidationImplemented, false);
    assert.equal(structure.xmlValidationImplemented, false);
    const schema = createDisabledXMLValidationSchema();
    assert.equal(schema.schemaSelectionImplemented, false);
    assert.equal(schema.xsdValidationImplemented, false);
    const report = createDisabledXMLValidationReport();
    assert.equal(report.validationReportImplemented, false);
    assert.equal(report.automaticCorrectionImplemented, false);
    assert.equal(report.xmlRepairImplemented, false);
  });

  it("XMLValidationContext aceita peers estruturais sem processar", () => {
    const ctx = sampleXMLValidationContext();
    assert.equal(ctx.kind, "canonical-xml-validation-context");
    assert.ok(ctx.canonicalGuide);
    assert.ok(ctx.mappingResult);
    assert.ok(ctx.autoFillResult);
    assert.ok(ctx.qualityAssessment);
    assert.ok(ctx.validationResult);
    assert.ok(ctx.auditResult);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultXMLValidationRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.validate({ documentId: "doc-retry" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createXMLValidationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.validate({
      documentId: "doc-abort",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XML_VALIDATION_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultXMLValidationRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new XMLValidationRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe XMLValidationRuntimePort provider enterprise + health.xmlValidationRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getXMLValidationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
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
    const port = runtime.getXMLValidationRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlTissRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/Gemini/Claude/HTTP/ML/DB/parser (exceto D-02 xsd-validation)", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/xml-validation-runtime");
    const files = collectTsFiles(moduleRoot).filter((f) => !f.includes("xsd-validation"));
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
      /libxml/i,
      /xmllint/i,
      /fast-xml-parser/i,
      /xml2js/i,
      /validateXML\s*\(/i,
      /repairXML\s*\(/i,
      /parseXML\s*\(/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} contém padrão proibido: ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createXMLValidationRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createXMLValidationRuntimePort"));
    assert.ok(source.includes("xmlValidationRuntimeOk"));
    assert.ok(source.includes("getXMLValidationRuntimePort"));
    assert.ok(source.includes("getXMLTISSRuntimePort"));
    assert.ok(source.includes("getQualityRuntimePort"));
    assert.ok(source.includes("C-02"));
  });
});

describe("C-02 cadeia Enterprise / TISS compatibility", () => {
  it("Enterprise Runtime expõe XML Validation Runtime + cadeia XML", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXMLValidationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSchemaRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSerializerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLValidationRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS → XML → Generation → Serializer → Schema → Validation", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const tissProvider = createTISSProviderPort({ provider: "enterprise" });
    const catalog = createTISSCatalogPort({ provider: "enterprise" });
    const rulePackEngine = createRulePackEnginePort({
      provider: "enterprise",
      enterpriseDeps: { getTISSCatalogPort: () => catalog },
    });
    const xmlGenerationRuntime = createXMLGenerationRuntimePort({ provider: "enterprise" });
    const xmlSerializerRuntime = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const xmlSchemaRuntime = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const xmlValidationRuntime = createXMLValidationRuntimePort({ provider: "enterprise" });
    const xsdRuntime = createXSDRuntimePort({ provider: "enterprise" });
    const namespaceRuntime = createNamespaceRuntimePort({ provider: "enterprise" });
    const queueRuntime = createQueueRuntimePort({ provider: "enterprise" });
    const workerRuntime = createWorkerRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntime,
      },
    });
    const schedulerRuntime = createSchedulerRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntime,
        getWorkerRuntimePort: () => workerRuntime,
      },
    });
    const persistentQueueRuntime = createPersistentQueueRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntime,
        getWorkerRuntimePort: () => workerRuntime,
        getSchedulerRuntimePort: () => schedulerRuntime,
      },
    });
    const xmlRuntime = createXMLRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getTISSCatalogPort: () => catalog,
        getRulePackEnginePort: () => rulePackEngine,
        getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
      },
    });
    const tissRuntime = createTISSRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getTISSProviderPort: () => tissProvider,
        getTISSCatalogPort: () => catalog,
        getRulePackEnginePort: () => rulePackEngine,
        getXMLRuntimePort: () => xmlRuntime,
        getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
        getXMLSerializerRuntimePort: () => xmlSerializerRuntime,
        getXMLSchemaRuntimePort: () => xmlSchemaRuntime,
        getXMLValidationRuntimePort: () => xmlValidationRuntime,
        getXSDRuntimePort: () => xsdRuntime,
        getNamespaceRuntimePort: () => namespaceRuntime,
        getQueueRuntimePort: () => queueRuntime,
        getWorkerRuntimePort: () => workerRuntime,
        getSchedulerRuntimePort: () => schedulerRuntime,
        getPersistentQueueRuntimePort: () => persistentQueueRuntime,
        getObservabilityRuntimePort: () =>
          createObservabilityRuntimePort({
            provider: "mock",
            enterpriseDeps: {
              getQueueRuntimePort: () => queueRuntime,
              getWorkerRuntimePort: () => workerRuntime,
              getSchedulerRuntimePort: () => schedulerRuntime,
              getPersistentQueueRuntimePort: () => persistentQueueRuntime,
              getTISSRuntimePort: () =>
                ({
                  providerId: "mock",
                  health: async () => ({ ok: true, provider: "mock" }),
                  capabilities: () => ({
                    provider: "mock",
                    adapterId: "stub",
                    supportsProcess: true,
                    supportsGetSession: true,
                    supportsListSessions: true,
                    supportsHealth: true,
                    supportsCapabilities: true,
                    usesEnterpriseRuntimePorts: true,
                    usesCanonicalExecutionOrchestrator: true,
                    usesTISSProviderPort: true,
                    usesTISSCatalogPort: true,
                    usesRulePackEnginePort: true,
                    usesXMLRuntimePort: true,
                    usesXMLGenerationRuntimePort: true,
                    usesXMLSerializerRuntimePort: true,
                    usesXMLSchemaRuntimePort: true,
                    usesXMLValidationRuntimePort: true,
                    usesXSDRuntimePort: true,
                    usesNamespaceRuntimePort: true,
                    usesQueueRuntimePort: true,
                    usesWorkerRuntimePort: true,
                    usesSchedulerRuntimePort: true,
                    usesPersistentQueueRuntimePort: true,
                    usesObservabilityRuntimePort: true,
                    implementsRealXml: false,
                    implementsOperatorDispatch: false,
                  }),
                  process: async () => ({ ok: true }),
                  getSession: async () => ({ ok: false }),
                  listSessions: async () => ({ ok: true, sessions: [] }),
                }) as TISSRuntimePort,
            },
          }),
        getScalabilityRuntimePort: () => createScalabilityRuntimePort({ provider: "mock" }),
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-c02",
        correlationId: "corr-c02",
      },
    });

    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.equal(result.realTissExecuted, false);

    const session = await tissRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.processedViaXMLValidationRuntimePort, true);
    assert.ok(session.session?.xmlValidationResultId);

    const valResult = await xmlValidationRuntime.getResult({
      resultId: session.session!.xmlValidationResultId!,
    });
    assert.equal(valResult.ok, true);
    assert.equal(valResult.result?.validationExecuted, false);
    assert.equal(valResult.result?.realValidationPerformed, false);
    assert.equal(valResult.result?.officialXsdLoaded, false);
    assert.equal(valResult.result?.validationEngineReady, true);
  });

  it("TISS Runtime consome exclusivamente XMLValidationRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(adapterSource, /getXMLValidationRuntimePort/);
    assert.match(adapterSource, /canonical-xml-validation-request/);
    assert.equal(/new DefaultXMLValidationAdapter/.test(adapterSource), false);
    assert.equal(/new DefaultXMLValidationRuntimeAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryXMLValidationRuntimeStore/.test(adapterSource), false);
  });
});
