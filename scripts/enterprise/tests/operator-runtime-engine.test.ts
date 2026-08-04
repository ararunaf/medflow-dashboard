#!/usr/bin/env node
/**
 * C-04 — Enterprise Operator Runtime Foundation
 * Prova: Application → OperatorRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareProfile / getProfile / listProfiles / stats
 *         + Enterprise Runtime + deps estruturais (SOAP/XML/XMLValidation/
 *           Quality/AutoFill/TISSMapping/Audit/Validation)
 *         + contrato OperatorContext + OperatorCapabilityProfile
 *           + envelope de observabilidade RULE_04
 *         + ausência de operadoras reais / lógica condicional por operadora /
 *           autenticação / SOAP/XML/REST funcional / banco / APIs
 *         + Regra Permanente nº 7 (OPERATOR CAPABILITY MODEL)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_OPERATOR_RUNTIME_PROVIDER_COUNT,
  DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID,
  DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  DefaultOperatorRuntimeAdapter,
  EnterpriseOperatorRuntimeAdapter,
  IN_MEMORY_OPERATOR_RUNTIME_STORE_ID,
  InMemoryOperatorRuntimeStore,
  MOCK_OPERATOR_RUNTIME_ADAPTER_ID,
  MockOperatorRuntimeAdapter,
  OPERATOR_RUNTIME_IDENTITY,
  OperatorRuntimeFactory,
  OperatorRuntimeProvider,
  OperatorRuntimeRegistry,
  createDefaultOperatorRuntimeRegistry,
  createEmptyOperatorCapabilityProfile,
  createOperatorRuntimeFactory,
  createOperatorRuntimePort,
  getOperatorRuntimeFactory,
  getOperatorRuntimeHealthSummary,
  getOperatorRuntimePort,
  resetAllOperatorRuntimeIdSequences,
  type OperatorCapabilityProfile,
  type OperatorContext,
  type OperatorRuntimePort,
} from "../../../src/lib/enterprise/operator-runtime/index.ts";
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
    "operatorImplemented",
    "operatorCapabilityProfileImplemented",
    "operatorAuthenticationImplemented",
    "operatorCommunicationImplemented",
    "soapFunctionalImplemented",
    "xmlFunctionalImplemented",
    "restImplemented",
    "authorizationImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleCapabilityProfile(
  overrides: Partial<OperatorCapabilityProfile> = {},
): OperatorCapabilityProfile {
  return createEmptyOperatorCapabilityProfile({
    operatorId: "opaque-operator-ref",
    displayName: "Structural Operator Profile",
    supportedTissVersions: ["3.05.00"],
    supportedGuideTypes: ["sp-sadt"],
    supportsAuthorization: false,
    supportsCancellation: false,
    supportsBatch: false,
    supportsAttachments: false,
    supportsAsyncProcessing: false,
    supportsProtocolQuery: false,
    supportsEligibility: false,
    supportsStatusPolling: false,
    supportedAuthenticationMethods: [],
    supportedTransportProtocols: [],
    supportedFileFormats: [],
    supportedCharacterEncoding: [],
    supportedCompression: [],
    customCapabilities: {},
    ...overrides,
  });
}

function sampleOperatorContext(overrides: Partial<OperatorContext> = {}): OperatorContext {
  return {
    kind: "canonical-operator-context",
    contextId: "operator-context-structural",
    capabilityProfile: sampleCapabilityProfile(),
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "prepared",
    executionDuration: 0,
    processedItems: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-04" },
    structuralNotes: "C-04 structural only",
    ...overrides,
  };
}

describe("C-04 OperatorRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem operadoras reais", async () => {
    const port: OperatorRuntimePort = new MockOperatorRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_OPERATOR_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareProfile, true);
    assert.equal(caps.supportsGetProfile, true);
    assert.equal(caps.supportsListProfiles, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultOperatorRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseOperatorRuntimeAdapter, DefaultOperatorRuntimeAdapter);
    const port = new DefaultOperatorRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Operator Runtime Foundation vendor-agnostic", () => {
    assert.equal(OPERATOR_RUNTIME_IDENTITY.name, "Enterprise Operator Runtime");
    assert.equal(OPERATOR_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(OPERATOR_RUNTIME_IDENTITY.version);
    assert.equal(OPERATOR_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createOperatorRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "OPERATOR_RUNTIME");
  });

  it("provider default resolve enterprise via getOperatorRuntimePort/Provider", () => {
    const port = createOperatorRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getOperatorRuntimePort().providerId, "enterprise");
    assert.equal(OperatorRuntimeProvider.create().providerId, "enterprise");
    assert.equal(OperatorRuntimeProvider.get().providerId, "enterprise");
    assert.ok(OperatorRuntimeProvider.getFactory() instanceof OperatorRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createOperatorRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getOperatorRuntimeFactory().getRegistry().list().length,
      BUILTIN_OPERATOR_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultOperatorRuntimeRegistry();
    assert.ok(registry instanceof OperatorRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.operatorImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.authorizationImplemented, false);
  });

  it("prepareProfile → getProfile → listProfiles → stats (sem operadora real)", async () => {
    resetAllOperatorRuntimeIdSequences();
    const operatorContext = sampleOperatorContext();
    const port = createOperatorRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareProfile({
      operatorContext,
      capabilityProfile: operatorContext.capabilityProfile,
      request: {
        kind: "canonical-operator-request",
        name: "Foundation Operator Prepare",
        structuralNotes: "C-04 structural only",
        operatorImplemented: false,
        operatorCapabilityProfileImplemented: false,
        operatorAuthenticationImplemented: false,
        operatorCommunicationImplemented: false,
        soapFunctionalImplemented: false,
        xmlFunctionalImplemented: false,
        restImplemented: false,
        authorizationImplemented: false,
      },
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.response?.responseId);
    assert.equal(prepared.response?.realOperatorResolved, false);
    assert.equal(prepared.response?.communicationExecuted, false);
    assert.equal(prepared.response?.runtimeReady, true);
    assert.equal(prepared.response?.status, "prepared");
    assert.equal(prepared.response?.profile?.kind, "canonical-operator-capability-profile");
    assert.equal(prepared.response?.operatorContext?.kind, "canonical-operator-context");
    assertStructuralFlagsFalse(prepared.response as unknown as Record<string, unknown>);
    assertStructuralFlagsFalse(prepared.response!.profile as unknown as Record<string, unknown>);

    const loaded = await port.getProfile({ responseId: prepared.response!.responseId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.response?.responseId, prepared.response!.responseId);

    const byProfile = await port.getProfile({
      profileId: prepared.response!.profile!.profileId!,
    });
    assert.equal(byProfile.ok, true);
    assert.equal(byProfile.profile?.kind, "canonical-operator-capability-profile");

    const listed = await port.listProfiles();
    assert.equal(listed.ok, true);
    assert.ok(listed.responses.length >= 1);
    assert.ok(listed.profiles.length >= 1);
    assert.equal(listed.statistics?.realOperatorResolvedCount, 0);
    assert.equal(listed.statistics?.operatorImplementedCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalProfiles ?? 0) >= 1);
    assert.equal(stats.statistics?.authorizationImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryOperatorRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_OPERATOR_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.profileCount(), 0);
    assert.equal(store.responseCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.contextCount(), 0);
  });

  it("demo getOperatorRuntimeHealthSummary resume Port sem lógica funcional", async () => {
    const port = createOperatorRuntimePort({ provider: "enterprise" });
    const summary = await getOperatorRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "OPERATOR_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("OperatorCapabilityProfile contrato mínimo presente", () => {
    const profile = sampleCapabilityProfile();
    assert.equal(profile.kind, "canonical-operator-capability-profile");
    assert.ok("operatorId" in profile);
    assert.ok("displayName" in profile);
    assert.ok("supportedTissVersions" in profile);
    assert.ok("supportedGuideTypes" in profile);
    assert.ok("supportsAuthorization" in profile);
    assert.ok("supportsCancellation" in profile);
    assert.ok("supportsBatch" in profile);
    assert.ok("supportsAttachments" in profile);
    assert.ok("supportsAsyncProcessing" in profile);
    assert.ok("supportsProtocolQuery" in profile);
    assert.ok("supportsEligibility" in profile);
    assert.ok("supportsStatusPolling" in profile);
    assert.ok("supportedAuthenticationMethods" in profile);
    assert.ok("supportedTransportProtocols" in profile);
    assert.ok("maxBatchSize" in profile || profile.maxBatchSize === undefined);
    assert.ok("maxAttachmentSize" in profile || profile.maxAttachmentSize === undefined);
    assert.ok("supportedFileFormats" in profile);
    assert.ok("supportedCharacterEncoding" in profile);
    assert.ok("supportedCompression" in profile);
    assert.ok("customCapabilities" in profile);
    assertStructuralFlagsFalse(profile as unknown as Record<string, unknown>);
  });

  it("OperatorContext prevê observabilidade RULE_04 sem processar", () => {
    const ctx = sampleOperatorContext();
    assert.equal(ctx.kind, "canonical-operator-context");
    assert.ok(ctx.capabilityProfile);
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

  it("AbortSignal cancela operação", async () => {
    const port = createOperatorRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareProfile({
      name: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "OPERATOR_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultOperatorRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new OperatorRuntimeFactory({ registry });
    assert.throws(
      () => factory.create({ provider: "unknown" as never }),
      /não está registrado/,
    );
  });

  it("Enterprise Runtime expõe OperatorRuntimePort + health.operatorRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getOperatorRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.operatorRuntimeOk, true);
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

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getOperatorRuntimePort();
    const health = await port.health();
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

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/XML lib/DB e não ramifica por operadora", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/operator-runtime");
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
      /\bif\s*\([^)]*operadora/i,
      /\bswitch\s*\([^)]*operadora/i,
      /\bcase\s+["']Unimed/i,
      /\bcase\s+["']Hapvida/i,
      /\bcase\s+["']Bradesco/i,
      /\bcase\s+["']Amil/i,
      /operatorId\s*===\s*["']/i,
      /displayName\s*===\s*["']/i,
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

  it("Enterprise Runtime wiring inclui createOperatorRuntimePort + operatorRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createOperatorRuntimePort"));
    assert.ok(source.includes("operatorRuntimeOk"));
    assert.ok(source.includes("getOperatorRuntimePort"));
    assert.ok(source.includes("getSOAPRuntimePort"));
    assert.ok(source.includes("C-04"));
  });

  it("documentação C-04 e Regra Permanente nº 7 existem", () => {
    const docs = [
      "docs/enterprise/C04_ENTERPRISE_OPERATOR_RUNTIME.md",
      "docs/enterprise/C04_OPERATOR_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C04_OPERATOR_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule07 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md"),
      "utf8",
    );
    assert.match(rule07, /OPERATOR CAPABILITY MODEL/i);
    assert.match(rule07, /OperatorCapabilityProfile/);
    assert.match(rule07, /nenhuma operadora é conhecida/i);
    assert.match(rule07, /lógica condicional/i);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.operatorImplemented, false);
    assert.equal(
      DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.operatorCapabilityProfileImplemented,
      false,
    );
    assert.equal(
      DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.operatorAuthenticationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.operatorCommunicationImplemented,
      false,
    );
    assert.equal(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.soapFunctionalImplemented, false);
    assert.equal(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.xmlFunctionalImplemented, false);
    assert.equal(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.restImplemented, false);
    assert.equal(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.authorizationImplemented, false);
    assert.equal(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES.knowsOperatorOrCooperative, false);
  });
});
