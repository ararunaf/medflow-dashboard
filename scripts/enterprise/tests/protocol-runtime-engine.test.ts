#!/usr/bin/env node
/**
 * C-07 — Enterprise Protocol Runtime Foundation
 * Prova: Application → ProtocolRuntimePort → Adapter → Factory → Registry → Store
 *         + prepareProfile / getProfile / listProfiles / resolveProtocol / stats
 *         + Enterprise Runtime + deps estruturais (Batch/Authorization/Operator/
 *           SOAP/XML/XMLValidation)
 *         + contrato ProtocolProfile + ProtocolResolver + ProtocolContext
 *           + envelope de observabilidade RULE_04
 *         + ausência de SOAP / REST / gRPC / mensageria / HTTP / TLS /
 *           autenticação / banco / APIs / resolução funcional
 *         + Regra Permanente nº 12 (PROTOCOL ABSTRACTION)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_PROTOCOL_RUNTIME_PROVIDER_COUNT,
  DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID,
  DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  DefaultProtocolRuntimeAdapter,
  EnterpriseProtocolRuntimeAdapter,
  IN_MEMORY_PROTOCOL_RUNTIME_STORE_ID,
  InMemoryProtocolRuntimeStore,
  MOCK_PROTOCOL_RUNTIME_ADAPTER_ID,
  MockProtocolRuntimeAdapter,
  PROTOCOL_CANONICAL_STATES,
  PROTOCOL_RUNTIME_IDENTITY,
  ProtocolRuntimeFactory,
  ProtocolRuntimeProvider,
  ProtocolRuntimeRegistry,
  REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID,
  REAL_TISS_PROTOCOL_RUNTIME_VERSION,
  RealTissProtocolRuntimeAdapter,
  createDefaultProtocolRuntimeRegistry,
  createEmptyProtocolCapabilities,
  createEmptyProtocolProfile,
  createEmptyProtocolResolver,
  createProtocolRuntimeFactory,
  createProtocolRuntimePort,
  getProtocolRuntimeFactory,
  getProtocolRuntimeHealthSummary,
  getProtocolRuntimePort,
  resetAllProtocolRuntimeIdSequences,
  type ProtocolContext,
  type ProtocolProfile,
  type ProtocolResolver,
  type ProtocolRuntimePort,
} from "../../../src/lib/enterprise/protocol-runtime/index.ts";
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
    "soapImplemented",
    "restImplemented",
    "grpcImplemented",
    "messagingImplemented",
    "protocolResolutionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleProfile(overrides: Partial<ProtocolProfile> = {}): ProtocolProfile {
  return createEmptyProtocolProfile({
    profileName: "Structural Protocol Profile",
    state: "DECLARED",
    owner: "enterprise-foundation",
    tags: ["c-07", "structural"],
    ...overrides,
  });
}

function sampleResolver(overrides: Partial<ProtocolResolver> = {}): ProtocolResolver {
  return createEmptyProtocolResolver({
    name: "Structural Protocol Resolver",
    protocolCapabilities: createEmptyProtocolCapabilities(),
    ...overrides,
  });
}

function sampleProtocolContext(overrides: Partial<ProtocolContext> = {}): ProtocolContext {
  const profile = sampleProfile();
  return {
    kind: "canonical-protocol-context",
    contextId: "protocol-context-structural",
    profileId: profile.profileId,
    profile,
    state: profile.state,
    operationId: "op-structural",
    correlationId: "corr-structural",
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "DECLARED",
    executionDuration: 0,
    processedItems: 0,
    warnings: [],
    errors: [],
    traceMetadata: { foundation: "C-07" },
    structuralNotes: "C-07 structural only",
    ...overrides,
  };
}

describe("C-07 ProtocolRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem protocolos concretos", async () => {
    const port: ProtocolRuntimePort = new MockProtocolRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_PROTOCOL_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareProfile, true);
    assert.equal(caps.supportsGetProfile, true);
    assert.equal(caps.supportsListProfiles, true);
    assert.equal(caps.supportsResolveProtocol, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.supportsCanonicalProtocolProfile, true);
    assert.equal(caps.supportsProtocolResolver, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultProtocolRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseProtocolRuntimeAdapter, DefaultProtocolRuntimeAdapter);
    const port = new DefaultProtocolRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Protocol Runtime Foundation vendor-agnostic", () => {
    assert.equal(PROTOCOL_RUNTIME_IDENTITY.name, "Enterprise Protocol Runtime");
    assert.equal(PROTOCOL_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(PROTOCOL_RUNTIME_IDENTITY.version);
    assert.equal(PROTOCOL_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createProtocolRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "PROTOCOL_RUNTIME");
  });

  it("provider default resolve enterprise via getProtocolRuntimePort/Provider", () => {
    const port = createProtocolRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getProtocolRuntimePort().providerId, "enterprise");
    assert.equal(ProtocolRuntimeProvider.create().providerId, "enterprise");
    assert.equal(ProtocolRuntimeProvider.get().providerId, "enterprise");
    assert.ok(ProtocolRuntimeProvider.getFactory() instanceof ProtocolRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createProtocolRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.ok(factory.create({ provider: "real-tiss" }) instanceof RealTissProtocolRuntimeAdapter);
    assert.equal(
      getProtocolRuntimeFactory().getRegistry().list().length,
      BUILTIN_PROTOCOL_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultProtocolRuntimeRegistry();
    assert.ok(registry instanceof ProtocolRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_PROTOCOL_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.soapImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.protocolResolutionImplemented, false);
    const realTiss = registry.get("real-tiss");
    assert.equal(realTiss?.providerId, "real-tiss");
    assert.equal(realTiss?.version, REAL_TISS_PROTOCOL_RUNTIME_VERSION);
    assert.equal(realTiss?.adapterId, REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID);
    assert.equal(realTiss?.capabilities.soapImplemented, false);
  });

  it("prepareProfile → getProfile → listProfiles → stats (sem protocolos concretos)", async () => {
    resetAllProtocolRuntimeIdSequences();
    const protocolContext = sampleProtocolContext();
    const port = createProtocolRuntimePort({ provider: "enterprise" });

    const prepared = await port.prepareProfile({
      protocolContext,
      profile: protocolContext.profile,
      profileName: "Foundation Protocol Prepare",
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.profile?.profileId);
    assert.equal(prepared.protocolResolved, false);
    assert.equal(prepared.profile?.state, "DECLARED");
    assert.equal(prepared.profile?.kind, "canonical-protocol-profile");
    assert.equal(prepared.protocolContext?.kind, "canonical-protocol-context");
    assertStructuralFlagsFalse(prepared.profile as unknown as Record<string, unknown>);

    const loaded = await port.getProfile({ profileId: prepared.profile!.profileId! });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.profile?.profileId, prepared.profile!.profileId);

    const byContext = await port.getProfile({
      contextId: prepared.protocolContext!.contextId!,
    });
    assert.equal(byContext.ok, true);
    assert.equal(byContext.protocolContext?.kind, "canonical-protocol-context");

    const listed = await port.listProfiles();
    assert.equal(listed.ok, true);
    assert.ok(listed.profiles.length >= 1);
    assert.ok(listed.contexts.length >= 1);
    assert.equal(listed.statistics?.soapImplementedCount, 0);
    assert.equal(listed.statistics?.protocolResolutionImplementedCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalProfiles ?? 0) >= 1);
    assert.equal(stats.statistics?.restImplementedCount, 0);
  });

  it("resolveProtocol permanece estrutural (protocolResolutionImplemented=false)", async () => {
    resetAllProtocolRuntimeIdSequences();
    const port = createProtocolRuntimePort({ provider: "enterprise" });
    const result = await port.resolveProtocol({
      resolver: sampleResolver(),
      protocolCapabilities: createEmptyProtocolCapabilities(),
    });
    assert.equal(result.ok, true);
    assert.equal(result.protocolResolved, false);
    assert.equal(result.protocolResolutionImplemented, false);
    assert.equal(result.resolver?.kind, "canonical-protocol-resolver");
    assert.equal(result.resolver?.protocolResolutionImplemented, false);
    assert.equal(result.code, "PROTOCOL_RUNTIME_RESOLUTION_NOT_IMPLEMENTED");
    assertStructuralFlagsFalse(result.resolver as unknown as Record<string, unknown>);
  });

  it("store in-memory sem persistência", () => {
    const store = new InMemoryProtocolRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_PROTOCOL_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);
    assert.equal(store.profileCount(), 0);
    assert.equal(store.contextCount(), 0);
    assert.equal(store.resolverCount(), 0);
  });

  it("demo getProtocolRuntimeHealthSummary resume Port sem lógica funcional", async () => {
    const port = createProtocolRuntimePort({ provider: "enterprise" });
    const summary = await getProtocolRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.info.providerType, "PROTOCOL_RUNTIME");
    assertStructuralFlagsFalse(summary.health as unknown as Record<string, unknown>);
  });

  it("ProtocolProfile contrato mínimo presente", () => {
    const profile = sampleProfile({
      profileId: "profile-structural",
      requiredCapabilities: createEmptyProtocolCapabilities(),
    });
    assert.equal(profile.kind, "canonical-protocol-profile");
    assert.ok(profile.profileId);
    assert.ok(profile.profileName);
    assert.equal(profile.state, "DECLARED");
    assert.ok(profile.requiredCapabilities);
    assert.ok(profile.metadata);
    assertStructuralFlagsFalse({
      soapImplemented: profile.soapImplemented,
      restImplemented: profile.restImplemented,
      grpcImplemented: profile.grpcImplemented,
      messagingImplemented: profile.messagingImplemented,
      protocolResolutionImplemented: profile.protocolResolutionImplemented,
    });
  });

  it("ProtocolResolver declara resolução futura sem implementação", () => {
    const resolver = sampleResolver();
    assert.equal(resolver.kind, "canonical-protocol-resolver");
    assert.equal(resolver.protocolResolutionImplemented, false);
    assert.equal(resolver.soapImplemented, false);
    assert.equal(resolver.restImplemented, false);
    assert.equal(resolver.grpcImplemented, false);
    assert.equal(resolver.messagingImplemented, false);
    assert.ok(resolver.protocolCapabilities);
  });

  it("ProtocolState declara estados canônicos sem seleção de protocolo", () => {
    assert.deepEqual(
      [...PROTOCOL_CANONICAL_STATES],
      [
        "DECLARED",
        "PROFILED",
        "CAPABLE",
        "PENDING_RESOLUTION",
        "RESOLVED",
        "ACTIVE",
        "FAILED",
        "DISABLED",
      ],
    );
  });

  it("ProtocolContext prevê observabilidade RULE_04 sem processar", () => {
    const ctx = sampleProtocolContext();
    assert.equal(ctx.kind, "canonical-protocol-context");
    assert.ok(ctx.profile);
    assert.equal(ctx.operationId, "op-structural");
    assert.equal(ctx.correlationId, "corr-structural");
    assert.ok(ctx.startedAt);
    assert.ok(ctx.finishedAt);
    assert.equal(ctx.executionStatus, "DECLARED");
    assert.equal(ctx.executionDuration, 0);
    assert.equal(ctx.processedItems, 0);
    assert.ok(Array.isArray(ctx.warnings));
    assert.ok(Array.isArray(ctx.errors));
    assert.ok(ctx.traceMetadata);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createProtocolRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepareProfile({
      profileName: "abort-test",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "PROTOCOL_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultProtocolRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    const factory = new ProtocolRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("Enterprise Runtime expõe ProtocolRuntimePort + health.protocolRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getProtocolRuntimePort();
    assert.equal(port.providerId, "enterprise");
    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.protocolRuntimeOk, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("shape-check estrutural dos peers via enterpriseDeps", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const port = runtime.getProtocolRuntimePort();
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.batchRuntimeOk, true);
    assert.equal(health.authorizationRuntimeOk, true);
    assert.equal(health.operatorRuntimeOk, true);
    assert.equal(health.soapRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    resetEnterpriseRuntimeForTests();
  });

  it("módulo não importa OpenAI/Azure/HTTP/SOAP/REST/gRPC/DB e não resolve protocolos", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/protocol-runtime");
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
      /BullMQ|bullmq|ioredis|amqplib|kafka/i,
      /Worker\s*\(/,
      /setInterval\s*\(/,
      /\bif\s*\([^)]*\bSOAP\b/i,
      /\bif\s*\([^)]*\bREST\b/i,
      /\bif\s*\([^)]*\bgRPC\b/i,
      /\bif\s*\([^)]*\bRabbitMQ\b/i,
      /\bif\s*\([^)]*\bKafka\b/i,
      /\bif\s*\([^)]*\bAMQP\b/i,
      /\bswitch\s*\([^)]*protocolo/i,
      /\bswitch\s*\([^)]*protocol/i,
      /\bif\s*\([^)]*operadora/i,
      /\bswitch\s*\([^)]*operadora/i,
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

  it("Enterprise Runtime wiring inclui createProtocolRuntimePort + protocolRuntimeOk", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.ok(source.includes("createProtocolRuntimePort"));
    assert.ok(source.includes("protocolRuntimeOk"));
    assert.ok(source.includes("getProtocolRuntimePort"));
    assert.ok(source.includes("getBatchRuntimePort"));
    assert.ok(source.includes("getAuthorizationRuntimePort"));
    assert.ok(source.includes("getOperatorRuntimePort"));
    assert.ok(source.includes("C-07"));
  });

  it("documentação C-07 e Regra Permanente nº 12 existem", () => {
    const docs = [
      "docs/enterprise/C07_ENTERPRISE_PROTOCOL_RUNTIME.md",
      "docs/enterprise/C07_PROTOCOL_RUNTIME_ARCHITECTURE.md",
      "docs/enterprise/C07_PROTOCOL_RUNTIME_CERTIFICATION.md",
      "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_12.md",
    ];
    for (const rel of docs) {
      const content = readFileSync(join(repoRoot, rel), "utf8");
      assert.ok(content.length > 100, `${rel} deveria existir com conteúdo`);
      assert.match(content, /estrutural/i);
    }
    const rule12 = readFileSync(
      join(repoRoot, "docs/enterprise/BLOCO_C_PERMANENT_ARCHITECTURE_RULE_12.md"),
      "utf8",
    );
    assert.match(rule12, /PROTOCOL ABSTRACTION/i);
    assert.match(rule12, /ProtocolResolver/);
    assert.match(rule12, /ProtocolProfile/);
    assert.match(rule12, /Adapter/i);
  });

  it("capabilities engine declara todas as flags *Implemented = false", () => {
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.soapImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.restImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.grpcImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.messagingImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.protocolResolutionImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.httpImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.tlsImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.authenticationImplemented, false);
    assert.equal(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES.knowsOperatorOrCooperative, false);
  });
});
