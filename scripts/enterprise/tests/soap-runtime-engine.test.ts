#!/usr/bin/env node
/**
 * C-03 — Enterprise SOAP Runtime Foundation
 * Prova: Application → SOAPRuntimePort → Adapter → Factory → Registry → Store
 *         + prepare / getResponse / listResponses / stats
 *         + Enterprise Runtime + deps estruturais (XMLRuntime/XMLValidationRuntime/
 *           Quality/AutoFill/TISSMapping/Audit/Validation)
 *         + contrato SOAPContext (XMLDocument + XMLValidationResult +
 *           CanonicalGuide + QualityAssessment + ValidationResult + AuditResult
 *           + envelope de observabilidade RULE_04)
 *         + contratos SOAPEnvelope/Header/Body/Fault (somente estruturais)
 *         + ausência de comunicação SOAP / HTTP / WSDL / TLS / certificado /
 *           autenticação / MTOM / operadoras / banco / persistência / APIs
 *         + Regra Permanente nº 5 (TRANSPORT AGNOSTIC)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_SOAP_RUNTIME_PROVIDER_COUNT,
  DEFAULT_SOAP_RUNTIME_ADAPTER_ID,
  DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
  DefaultSOAPRuntimeAdapter,
  EnterpriseSOAPRuntimeAdapter,
  IN_MEMORY_SOAP_RUNTIME_STORE_ID,
  InMemorySOAPRuntimeStore,
  MOCK_SOAP_RUNTIME_ADAPTER_ID,
  MockSOAPRuntimeAdapter,
  SOAP_RUNTIME_IDENTITY,
  SOAPRuntimeFactory,
  SOAPRuntimeProvider,
  SOAPRuntimeRegistry,
  createDefaultSOAPRuntimeRegistry,
  createDisabledSOAPEnvelope,
  createDisabledSOAPFault,
  createSOAPRuntimeFactory,
  createSOAPRuntimePort,
  getSOAPRuntimeFactory,
  getSOAPRuntimeHealthSummary,
  getSOAPRuntimePort,
  resetAllSOAPRuntimeIdSequences,
  type AuditResult,
  type CanonicalGuide,
  type QualityAssessment,
  type SOAPContext,
  type SOAPRuntimePort,
  type ValidationResult,
  type XMLValidationResult,
} from "../../../src/lib/enterprise/soap-runtime/index.ts";
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
    "soapCommunicationImplemented",
    "wsdlImplemented",
    "soapEnvelopeImplemented",
    "soapFaultImplemented",
    "certificateImplemented",
    "tlsImplemented",
    "mtomImplemented",
    "compressionImplemented",
    "retryImplemented",
    "operatorCommunicationImplemented",
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

function sampleXMLValidationResult(
  overrides: Partial<XMLValidationResult> = {},
): XMLValidationResult {
  return {
    kind: "canonical-xml-validation-result",
    ok: true,
    resultId: "xml-val-result-structural",
    request: { kind: "canonical-xml-validation-request" },
    issues: [],
    validationExecuted: false,
    realValidationPerformed: false,
    officialXsdLoaded: false,
    officialAnsValidation: false,
    officialTissValidation: false,
    validationRulesLoaded: false,
    validationEngineReady: true,
    runtimeReady: true,
    xmlValidationImplemented: false,
    xsdValidationImplemented: false,
    namespaceValidationImplemented: false,
    schemaSelectionImplemented: false,
    versionValidationImplemented: false,
    businessValidationImplemented: false,
    operatorValidationImplemented: false,
    xmlRepairImplemented: false,
    automaticCorrectionImplemented: false,
    validationReportImplemented: false,
    status: "validated",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

function sampleSOAPContext(overrides: Partial<SOAPContext> = {}): SOAPContext {
  return {
    kind: "canonical-soap-context",
    contextId: "soap-context-structural",
    canonicalGuide: sampleCanonicalGuide(),
    xmlValidationResult: sampleXMLValidationResult(),
    qualityAssessment: sampleQualityAssessment(),
    validationResult: sampleValidationResult(),
    auditResult: sampleAuditResult(),
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "prepared",
    executionDuration: 0,
    processedItems: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-03" },
    structuralNotes: "C-03 structural only",
    ...overrides,
  };
}

describe("C-03 SOAPRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem comunicação SOAP", async () => {
    const port: SOAPRuntimePort = new MockSOAPRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_SOAP_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepare, true);
    assert.equal(caps.supportsGetResponse, true);
    assert.equal(caps.supportsListResponses, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultSOAPRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseSOAPRuntimeAdapter, DefaultSOAPRuntimeAdapter);
    const port = new DefaultSOAPRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_SOAP_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise SOAP Runtime Foundation vendor-agnostic", () => {
    assert.equal(SOAP_RUNTIME_IDENTITY.name, "Enterprise SOAP Runtime");
    assert.equal(SOAP_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(SOAP_RUNTIME_IDENTITY.version);
    assert.equal(SOAP_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createSOAPRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "SOAP_RUNTIME");
  });

  it("provider default resolve enterprise via getSOAPRuntimePort/Provider", () => {
    const port = createSOAPRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getSOAPRuntimePort().providerId, "enterprise");
    assert.equal(SOAPRuntimeProvider.create().providerId, "enterprise");
    assert.equal(SOAPRuntimeProvider.get().providerId, "enterprise");
    assert.ok(SOAPRuntimeProvider.getFactory() instanceof SOAPRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createSOAPRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getSOAPRuntimeFactory().getRegistry().list().length,
      BUILTIN_SOAP_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultSOAPRuntimeRegistry();
    assert.ok(registry instanceof SOAPRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.soapCommunicationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.wsdlImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tlsImplemented, false);
  });

  it("prepare → getResponse → listResponses → stats (sem comunicação SOAP)", async () => {
    resetAllSOAPRuntimeIdSequences();
    const soapContext = sampleSOAPContext();
    const port = createSOAPRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepare({
      soapContext,
      canonicalGuide: soapContext.canonicalGuide,
      xmlValidationResult: soapContext.xmlValidationResult,
      qualityAssessment: soapContext.qualityAssessment,
      validationResult: soapContext.validationResult,
      auditResult: soapContext.auditResult,
      request: {
        kind: "canonical-soap-request",
        name: "Foundation SOAP Prepare",
        structuralNotes: "C-03 structural only",
        soapCommunicationImplemented: false,
        wsdlImplemented: false,
        soapEnvelopeImplemented: false,
        soapFaultImplemented: false,
        certificateImplemented: false,
        tlsImplemented: false,
        mtomImplemented: false,
        compressionImplemented: false,
        retryImplemented: false,
        operatorCommunicationImplemented: false,
      },
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.response?.responseId);
    assert.equal(prepared.response?.communicationExecuted, false);
    assert.equal(prepared.response?.realCommunicationPerformed, false);
    assert.equal(prepared.response?.wsdlLoaded, false);
    assert.equal(prepared.response?.certificateUsed, false);
    assert.equal(prepared.response?.tlsEstablished, false);
    assert.equal(prepared.response?.runtimeReady, true);
    assert.equal(prepared.response?.status, "prepared");
    assert.equal(prepared.response?.soapContext?.kind, "canonical-soap-context");
    assert.equal(prepared.response?.soapContext?.canonicalGuide?.kind, "canonical-tiss-guide");
    assertStructuralFlagsFalse(prepared.response as unknown as Record<string, unknown>);

    const loaded = await port.getResponse({ responseId: prepared.response!.responseId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.response?.responseId, prepared.response!.responseId);

    const listed = await port.listResponses();
    assert.equal(listed.ok, true);
    assert.ok(listed.responses.length >= 1);
    assert.equal(listed.statistics?.communicationExecutedCount, 0);
    assert.equal(listed.statistics?.soapCommunicationImplementedCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalResponses ?? 0) >= 1);
    assert.equal(stats.statistics?.wsdlImplementedCount, 0);
    assert.equal(stats.statistics?.tlsImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemorySOAPRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_SOAP_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.responseCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.contextCount(), 0);
  });

  it("demo getSOAPRuntimeHealthSummary resume Port sem comunicação funcional", async () => {
    const port = createSOAPRuntimePort({ provider: "enterprise" });
    const summary = await getSOAPRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "SOAP_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.soapCommunicationImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.wsdlImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.soapEnvelopeImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.soapFaultImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.certificateImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.tlsImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.mtomImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.compressionImplemented, false);
    assert.equal(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.retryImplemented, false);
    assert.equal(
      DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES.operatorCommunicationImplemented,
      false,
    );
  });

  it("contratos estruturais (envelope/fault) sem implementação", () => {
    const envelope = createDisabledSOAPEnvelope();
    assert.equal(envelope.soapEnvelopeImplemented, false);
    assert.equal(envelope.soapCommunicationImplemented, false);
    assert.equal(envelope.mtomImplemented, false);
    const fault = createDisabledSOAPFault();
    assert.equal(fault.soapFaultImplemented, false);
    assert.equal(fault.soapCommunicationImplemented, false);
  });

  it("SOAPContext aceita peers estruturais + observabilidade sem processar", () => {
    const ctx = sampleSOAPContext();
    assert.equal(ctx.kind, "canonical-soap-context");
    assert.ok(ctx.canonicalGuide);
    assert.ok(ctx.xmlValidationResult);
    assert.ok(ctx.qualityAssessment);
    assert.ok(ctx.validationResult);
    assert.ok(ctx.auditResult);
    assert.equal(ctx.operationId, "op-structural");
    assert.equal(ctx.correlationId, "corr-structural");
    assert.ok(ctx.startedAt);
    assert.ok(ctx.finishedAt);
    assert.equal(ctx.executionStatus, "prepared");
    assert.equal(ctx.executionDuration, 0);
    assert.equal(ctx.processedItems, 0);
    assert.ok(Array.isArray(ctx.warnings));
    assert.ok(Array.isArray(ctx.errors));
    assert.ok(ctx.traceMetadata);
  });

  it("retry operacional recupera falha transitória (retryImplemented permanece false)", async () => {
    const port = new DefaultSOAPRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.prepare({ name: "retry-test" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
    assert.equal(port.capabilities().retryImplemented, false);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createSOAPRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepare({
      name: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SOAP_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultSOAPRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new SOAPRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe SOAPRuntimePort provider enterprise + health.soapRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getSOAPRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps (sem consumo funcional)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getSOAPRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP lib/WSDL/TLS/certificado/DB", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/soap-runtime");
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
      /createSecureContext\s*\(/,
      /from ["'][^"']*wsdl[^"']*["']/i,
      /require\(["'][^"']*wsdl[^"']*["']\)/i,
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

  it("Enterprise Runtime wiring inclui createSOAPRuntimePort provider enterprise + deps estruturais", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createSOAPRuntimePort"));
    assert.ok(source.includes("soapRuntimeOk"));
    assert.ok(source.includes("getSOAPRuntimePort"));
    assert.ok(source.includes("getXMLRuntimePort"));
    assert.ok(source.includes("getXMLValidationRuntimePort"));
    assert.ok(source.includes("C-03"));
  });

  it("documentação C-03 e Regra Permanente nº 5 existem", () => {
    const docs = [
      "docs/enterprise/C03_ENTERPRISE_SOAP_RUNTIME.md",
      "docs/enterprise/C03_SOAP_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C03_SOAP_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule05 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md"),
      "utf8",
    );
    assert.match(rule05, /TRANSPORT AGNOSTIC/i);
    assert.match(rule05, /não conhecem protocolo de transporte/i);
    assert.match(rule05, /encapsulador de transporte/i);
  });
});
