#!/usr/bin/env node
/**
 * C-05 — Enterprise Authorization Runtime Foundation
 * Prova: Application → AuthorizationRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareAuthorization / getAuthorization / listAuthorizations / stats
 *         + Enterprise Runtime + deps estruturais (Operator/SOAP/XML/XMLValidation/
 *           Quality/AutoFill/Audit/Validation)
 *         + contrato AuthorizationContext + AuthorizationStrategy + AuthorizationPolicy
 *           + envelope de observabilidade RULE_04
 *         + ausência de autorização funcional / elegibilidade / integração com
 *           operadoras / SOAP/XML/REST funcional / autenticação / banco / APIs
 *         + Regra Permanente nº 9 (AUTHORIZATION STRATEGY PATTERN)
 *         + POLICY-DRIVEN AUTHORIZATION (OperatorCapabilityProfile + AuthorizationPolicy)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTHORIZATION_RUNTIME_IDENTITY,
  BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultAuthorizationRuntimeAdapter,
  EnterpriseAuthorizationRuntimeAdapter,
  IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID,
  InMemoryAuthorizationRuntimeStore,
  MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  MockAuthorizationRuntimeAdapter,
  AuthorizationRuntimeFactory,
  AuthorizationRuntimeProvider,
  AuthorizationRuntimeRegistry,
  createAuthorizationRuntimeFactory,
  createAuthorizationRuntimePort,
  createDefaultAuthorizationRuntimeRegistry,
  createEmptyAuthorizationPolicy,
  createEmptyAuthorizationStrategy,
  getAuthorizationRuntimeFactory,
  getAuthorizationRuntimeHealthSummary,
  getAuthorizationRuntimePort,
  resetAllAuthorizationRuntimeIdSequences,
  type AuthorizationContext,
  type AuthorizationPolicy,
  type AuthorizationRuntimePort,
  type AuthorizationStrategy,
} from "../../../src/lib/enterprise/authorization-runtime/index.ts";
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
    "authorizationImplemented",
    "eligibilityImplemented",
    "attachmentAuthorizationImplemented",
    "batchAuthorizationImplemented",
    "statusPollingImplemented",
    "preAuthorizationImplemented",
    "soapFunctionalImplemented",
    "xmlFunctionalImplemented",
    "restImplemented",
    "operatorCommunicationImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleStrategy(overrides: Partial<AuthorizationStrategy> = {}): AuthorizationStrategy {
  return createEmptyAuthorizationStrategy({
    strategyKind: "synchronous",
    displayName: "Structural Synchronous Strategy",
    ...overrides,
  });
}

function samplePolicy(overrides: Partial<AuthorizationPolicy> = {}): AuthorizationPolicy {
  return createEmptyAuthorizationPolicy({
    name: "Structural Authorization Policy",
    preferredStrategyKind: "synchronous",
    strategy: sampleStrategy(),
    ...overrides,
  });
}

function sampleAuthorizationContext(
  overrides: Partial<AuthorizationContext> = {},
): AuthorizationContext {
  const strategy = sampleStrategy();
  const policy = samplePolicy({ strategy });
  return {
    kind: "canonical-authorization-context",
    contextId: "authorization-context-structural",
    strategy,
    policy,
    capabilityProfile: policy.capabilityProfile,
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "prepared",
    executionDuration: 0,
    processedItems: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-05" },
    structuralNotes: "C-05 structural only",
    ...overrides,
  };
}

describe("C-05 AuthorizationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem autorização funcional", async () => {
    const port: AuthorizationRuntimePort = new MockAuthorizationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareAuthorization, true);
    assert.equal(caps.supportsGetAuthorization, true);
    assert.equal(caps.supportsListAuthorizations, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.supportsStrategySelection, true);
    assert.equal(caps.supportsPolicyDrivenAuthorization, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultAuthorizationRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseAuthorizationRuntimeAdapter, DefaultAuthorizationRuntimeAdapter);
    const port = new DefaultAuthorizationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Authorization Runtime Foundation vendor-agnostic", () => {
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.name, "Enterprise Authorization Runtime");
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(AUTHORIZATION_RUNTIME_IDENTITY.version);
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createAuthorizationRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "AUTHORIZATION_RUNTIME");
  });

  it("provider default resolve enterprise via getAuthorizationRuntimePort/Provider", () => {
    const port = createAuthorizationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getAuthorizationRuntimePort().providerId, "enterprise");
    assert.equal(AuthorizationRuntimeProvider.create().providerId, "enterprise");
    assert.equal(AuthorizationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(AuthorizationRuntimeProvider.getFactory() instanceof AuthorizationRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createAuthorizationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getAuthorizationRuntimeFactory().getRegistry().list().length,
      BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise", () => {
    const registry = createDefaultAuthorizationRuntimeRegistry();
    assert.ok(registry instanceof AuthorizationRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, 4);
    assert.equal(registry.get("enterprise")?.capabilities.authorizationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.eligibilityImplemented, false);
  });

  it("prepareAuthorization → getAuthorization → listAuthorizations → stats (sem autorização funcional)", async () => {
    resetAllAuthorizationRuntimeIdSequences();
    const authorizationContext = sampleAuthorizationContext();
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareAuthorization({
      authorizationContext,
      strategy: authorizationContext.strategy,
      policy: authorizationContext.policy,
      request: {
        kind: "canonical-authorization-request",
        name: "Foundation Authorization Prepare",
        structuralNotes: "C-05 structural only",
        authorizationImplemented: false,
        eligibilityImplemented: false,
        attachmentAuthorizationImplemented: false,
        batchAuthorizationImplemented: false,
        statusPollingImplemented: false,
        preAuthorizationImplemented: false,
        soapFunctionalImplemented: false,
        xmlFunctionalImplemented: false,
        restImplemented: false,
        operatorCommunicationImplemented: false,
      },
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.response?.responseId);
    assert.equal(prepared.response?.authorizationExecuted, false);
    assert.equal(prepared.response?.eligibilityExecuted, false);
    assert.equal(prepared.response?.communicationExecuted, false);
    assert.equal(prepared.response?.runtimeReady, true);
    assert.equal(prepared.response?.status, "prepared");
    assert.equal(prepared.response?.strategy?.kind, "canonical-authorization-strategy");
    assert.equal(prepared.response?.policy?.kind, "canonical-authorization-policy");
    assert.equal(prepared.response?.authorizationContext?.kind, "canonical-authorization-context");
    assertStructuralFlagsFalse(prepared.response as unknown as Record<string, unknown>);

    const loaded = await port.getAuthorization({ responseId: prepared.response!.responseId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.response?.responseId, prepared.response!.responseId);

    const byStrategy = await port.getAuthorization({
      strategyId: prepared.response!.strategy!.strategyId!,
    });
    assert.equal(byStrategy.ok, true);
    assert.equal(byStrategy.strategy?.kind, "canonical-authorization-strategy");

    const byPolicy = await port.getAuthorization({
      policyId: prepared.response!.policy!.policyId!,
    });
    assert.equal(byPolicy.ok, true);
    assert.equal(byPolicy.policy?.kind, "canonical-authorization-policy");

    const listed = await port.listAuthorizations();
    assert.equal(listed.ok, true);
    assert.ok(listed.responses.length >= 1);
    assert.ok(listed.strategies.length >= 1);
    assert.ok(listed.policies.length >= 1);
    assert.equal(listed.statistics?.authorizationExecutedCount, 0);
    assert.equal(listed.statistics?.authorizationImplementedCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalStrategies ?? 0) >= 1);
    assert.equal(stats.statistics?.eligibilityImplementedCount, 0);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryAuthorizationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.strategyCount(), 0);
    assert.equal(store.policyCount(), 0);
    assert.equal(store.responseCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.contextCount(), 0);
  });

  it("demo getAuthorizationRuntimeHealthSummary resume Port sem lógica funcional", async () => {
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });
    const summary = await getAuthorizationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "AUTHORIZATION_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("AuthorizationStrategy e AuthorizationPolicy contratos mínimos presentes", () => {
    const strategy = sampleStrategy({ strategyKind: "batch" });
    assert.equal(strategy.kind, "canonical-authorization-strategy");
    assert.equal(strategy.strategyKind, "batch");
    assert.equal(strategy.strategyImplemented, false);
    assert.equal(strategy.authorizationImplemented, false);

    const policy = samplePolicy({ preferredStrategyKind: "eligibility" });
    assert.equal(policy.kind, "canonical-authorization-policy");
    assert.equal(policy.preferredStrategyKind, "eligibility");
    assert.equal(policy.authorizationPolicyImplemented, false);
    assertStructuralFlagsFalse({
      authorizationImplemented: policy.authorizationImplemented,
      eligibilityImplemented: policy.eligibilityImplemented,
      attachmentAuthorizationImplemented: policy.attachmentAuthorizationImplemented,
      batchAuthorizationImplemented: policy.batchAuthorizationImplemented,
      statusPollingImplemented: policy.statusPollingImplemented,
      preAuthorizationImplemented: policy.preAuthorizationImplemented,
      soapFunctionalImplemented: false,
      xmlFunctionalImplemented: false,
      restImplemented: false,
      operatorCommunicationImplemented: false,
    });
  });

  it("AuthorizationContext prevê observabilidade RULE_04 sem processar", () => {
    const ctx = sampleAuthorizationContext();
    assert.equal(ctx.kind, "canonical-authorization-context");
    assert.ok(ctx.strategy);
    assert.ok(ctx.policy);
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
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareAuthorization({
      name: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUTHORIZATION_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultAuthorizationRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new AuthorizationRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe AuthorizationRuntimePort + health.authorizationRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAuthorizationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getAuthorizationRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/XML lib/DB e não ramifica por operadora", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/authorization-runtime");
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
      /\bif\s*\([^)]*versão/i,
      /\bif\s*\([^)]*guia/i,
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

  it("Enterprise Runtime wiring inclui createAuthorizationRuntimePort + authorizationRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createAuthorizationRuntimePort"));
    assert.ok(source.includes("authorizationRuntimeOk"));
    assert.ok(source.includes("getAuthorizationRuntimePort"));
    assert.ok(source.includes("getOperatorRuntimePort"));
    assert.ok(source.includes("getSOAPRuntimePort"));
    assert.ok(source.includes("C-05"));
  });

  it("documentação C-05 e Regra Permanente nº 9 existem", () => {
    const docs = [
      "docs/enterprise/C05_ENTERPRISE_AUTHORIZATION_RUNTIME.md",
      "docs/enterprise/C05_AUTHORIZATION_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C05_AUTHORIZATION_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_09.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule09 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_09.md"),
      "utf8",
    );
    assert.match(rule09, /AUTHORIZATION STRATEGY PATTERN/i);
    assert.match(rule09, /AuthorizationStrategy/);
    assert.match(rule09, /AuthorizationPolicy/);
    assert.match(rule09, /POLICY-DRIVEN AUTHORIZATION/i);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.authorizationImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.eligibilityImplemented, false);
    assert.equal(
      DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.attachmentAuthorizationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.batchAuthorizationImplemented,
      false,
    );
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.statusPollingImplemented, false);
    assert.equal(
      DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.preAuthorizationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.soapFunctionalImplemented,
      false,
    );
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.xmlFunctionalImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.restImplemented, false);
    assert.equal(
      DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.operatorCommunicationImplemented,
      false,
    );
    assert.equal(
      DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.knowsOperatorOrCooperative,
      false,
    );
  });
});
