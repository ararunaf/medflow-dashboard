#!/usr/bin/env node
/**
 * EPC-14 — Processing Provider Framework
 * Prova Application → ProcessingProviderPort → Adapter → Registry sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUILTIN_PROCESSING_PROVIDER_COUNT,
  DEFAULT_PROCESSING_PROVIDER_ADAPTER_ID,
  DefaultMockProcessingProvider,
  DefaultProcessingProviderAdapter,
  HEALTH_STATUSES,
  MockProcessingProviderAdapter,
  PROVIDER_TYPES,
  ProcessingProviderRegistry,
  createDefaultProcessingProviderRegistry,
  createProcessingProviderFactory,
  createProcessingProviderPort,
  createProviderId,
  declaresAsync,
  declaresBatch,
  declaresStreaming,
  defineProviderCapabilities,
  emptyProviderCapabilities,
  getProcessingProviderHealthSummary,
  hasKnownProviderType,
  listProviderTypes,
  providerHasKnownProviderType,
  type ProcessingProviderPort,
  type ProviderDescriptor,
} from "../../../src/lib/enterprise/processing-provider/index.ts";

function sampleProvider(overrides: Partial<ProviderDescriptor> = {}): Omit<
  ProviderDescriptor,
  "providerId" | "providerName" | "providerVersion" | "providerType" | "capabilities"
> & {
  providerId?: string;
  providerName?: string;
  providerVersion?: string;
  providerType?: ProviderDescriptor["providerType"];
  capabilities?: ProviderDescriptor["capabilities"];
} {
  return {
    providerId: "stub-custom-1",
    providerName: "Stub Custom Provider",
    providerVersion: "0.0.0-stub",
    providerType: "CUSTOM",
    capabilities: defineProviderCapabilities({
      supportedInputs: ["opaque"],
      supportedOutputs: ["canonical"],
      supportedLanguages: ["pt-BR"],
      supportsAsync: true,
      supportsBatch: true,
      supportsStreaming: false,
      supportsConfidence: true,
      supportsMetadata: true,
      supportsAttachments: true,
      maxDocumentSize: 1_048_576,
    }),
    priority: 10,
    enabled: false,
    healthStatus: "stub",
    configurationReference: { id: "cfg-1", kind: "provider-config" },
    metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
    tags: ["foundation", "stub"],
    customAttributes: { channel: "framework" },
    ...overrides,
  };
}

describe("EPC-14 ProcessingProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ProcessingProviderPort = new MockProcessingProviderAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.registeredCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterProvider, true);
    assert.equal(caps.supportsUnregisterProvider, true);
    assert.equal(caps.supportsGetProvider, true);
    assert.equal(caps.supportsListProviders, true);
    assert.equal(caps.supportsMultipleProviders, true);
    assert.equal(caps.supportsCapabilitySelection, true);
    assert.equal(caps.supportsAsyncDeclaration, true);
    assert.equal(caps.supportsBatchDeclaration, true);
    assert.equal(caps.supportsStreamingDeclaration, true);
    assert.equal(caps.supportsFutureDocumentProcessingFoundation, true);
    assert.equal(caps.supportsFutureAiProviders, true);
    assert.equal(caps.supportsFutureWorkflow, true);
    assert.equal(caps.supportsFutureRuleEngine, true);
  });

  it("DefaultMockProcessingProvider é alias do Mock", () => {
    assert.equal(DefaultMockProcessingProvider, MockProcessingProviderAdapter);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createProcessingProviderPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa registry in-process e declara capacidades", async () => {
    const registry = new ProcessingProviderRegistry();
    const port: ProcessingProviderPort = new DefaultProcessingProviderAdapter({ registry });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_PROCESSING_PROVIDER_ADAPTER_ID);
    assert.equal(caps.supportsRegisterProvider, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem processar", async () => {
    const port = new DefaultProcessingProviderAdapter({
      registry: new ProcessingProviderRegistry(),
      ping: async () => ({ ok: true, message: "provider probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "provider probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultProcessingProviderAdapter; futuros falham explicitamente", () => {
    const defaultPort = createProcessingProviderPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(
      () => createProcessingProviderPort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createProcessingProviderPort({ provider: "remote" }),
      /ainda não implementado/i,
    );
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createProcessingProviderFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createProcessingProviderPort({ provider: "mock" });
    const summary = await getProcessingProviderHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("register/get/list/unregister funcionam no Mock com descriptor canônico", async () => {
    const port = new MockProcessingProviderAdapter({
      createId: () => "pp-fixed-1",
    });

    const registered = await port.registerProvider({
      provider: sampleProvider({ providerId: undefined }),
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.providerId, "pp-fixed-1");
    assert.equal(registered.provider?.providerType, "CUSTOM");
    assert.equal(registered.provider?.healthStatus, "stub");
    assert.equal(registered.provider?.enabled, false);
    assert.equal(registered.code, "created");

    const got = await port.getProvider({ providerId: "pp-fixed-1" });
    assert.equal(got.ok, true);
    assert.equal(got.provider?.providerName, "Stub Custom Provider");
    assert.equal(got.provider?.capabilities.supportsAsync, true);
    assert.equal(got.provider?.capabilities.maxDocumentSize, 1_048_576);

    const listed = await port.listProviders();
    assert.equal(listed.ok, true);
    assert.equal(listed.providers.length, 1);

    const removed = await port.unregisterProvider({ providerId: "pp-fixed-1" });
    assert.equal(removed.ok, true);
    assert.equal(removed.code, "removed");

    const missing = await port.getProvider({ providerId: "pp-fixed-1" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("Default adapter registra múltiplos Providers no Registry", async () => {
    const port = new DefaultProcessingProviderAdapter({
      registry: createDefaultProcessingProviderRegistry(),
    });

    await port.registerProvider({
      provider: sampleProvider({ providerId: "p-a", providerType: "CUSTOM", priority: 1 }),
    });
    await port.registerProvider({
      provider: sampleProvider({
        providerId: "p-b",
        providerType: "UNKNOWN",
        priority: 2,
        capabilities: defineProviderCapabilities({ supportsBatch: true }),
      }),
    });

    const listed = await port.listProviders();
    assert.equal(listed.providers.length, 2);

    const health = await port.health();
    assert.equal(health.registeredCount, 2);
  });

  it("listProviders filtra por tipo, tag e capacidades declaradas", async () => {
    const port = new MockProcessingProviderAdapter({
      providers: [
        sampleProvider({
          providerId: "async-1",
          providerType: "CUSTOM",
          tags: ["alpha"],
          capabilities: defineProviderCapabilities({ supportsAsync: true, supportsBatch: false }),
        }),
        sampleProvider({
          providerId: "batch-1",
          providerType: "UNKNOWN",
          tags: ["beta"],
          capabilities: defineProviderCapabilities({ supportsAsync: false, supportsBatch: true }),
          enabled: true,
          healthStatus: "ready",
        }),
      ],
    });

    const byType = await port.listProviders({ providerType: "CUSTOM" });
    assert.equal(byType.providers.length, 1);
    assert.equal(byType.providers[0]?.providerId, "async-1");

    const byAsync = await port.listProviders({ requiresAsync: true });
    assert.equal(byAsync.providers.length, 1);
    assert.equal(byAsync.providers[0]?.providerId, "async-1");

    const byBatch = await port.listProviders({ requiresBatch: true });
    assert.equal(byBatch.providers.length, 1);
    assert.equal(byBatch.providers[0]?.providerId, "batch-1");

    const byTag = await port.listProviders({ tag: "beta" });
    assert.equal(byTag.providers.length, 1);

    const byEnabled = await port.listProviders({ enabled: true });
    assert.equal(byEnabled.providers.length, 1);
  });

  it("Registry é catálogo puro — sem processamento e com contagem zero de builtins", () => {
    assert.equal(BUILTIN_PROCESSING_PROVIDER_COUNT, 0);
    const registry = createDefaultProcessingProviderRegistry();
    assert.equal(registry.count(), 0);
    assert.equal(registry.snapshot().count, 0);

    registry.register(sampleProvider({ providerId: "reg-1" }) as ProviderDescriptor);
    assert.equal(registry.has("reg-1"), true);
    assert.equal(registry.listByType("CUSTOM").length, 1);
    assert.equal(registry.unregister("reg-1"), true);
    assert.equal(registry.has("reg-1"), false);
  });

  it("ProviderType enum é estrutural e helpers funcionam", () => {
    assert.equal(PROVIDER_TYPES.length, 10);
    assert.ok(PROVIDER_TYPES.includes("OCR"));
    assert.ok(PROVIDER_TYPES.includes("PDF"));
    assert.ok(PROVIDER_TYPES.includes("XML"));
    assert.ok(PROVIDER_TYPES.includes("JSON"));
    assert.ok(PROVIDER_TYPES.includes("BARCODE"));
    assert.ok(PROVIDER_TYPES.includes("QRCODE"));
    assert.ok(PROVIDER_TYPES.includes("HL7"));
    assert.ok(PROVIDER_TYPES.includes("DICOM"));
    assert.ok(PROVIDER_TYPES.includes("CUSTOM"));
    assert.ok(PROVIDER_TYPES.includes("UNKNOWN"));

    assert.equal(hasKnownProviderType("OCR"), true);
    assert.equal(hasKnownProviderType("NOT-A-TYPE"), false);
    assert.deepEqual(listProviderTypes(), [...PROVIDER_TYPES]);

    const descriptor = sampleProvider({ providerType: "CUSTOM" }) as ProviderDescriptor;
    assert.equal(providerHasKnownProviderType(descriptor), true);
    assert.equal(HEALTH_STATUSES.includes("stub"), true);
  });

  it("ProviderCapabilities helpers são declarativos (sem lógica de execução)", () => {
    const empty = emptyProviderCapabilities();
    assert.deepEqual(empty, {});

    const provider = sampleProvider({
      capabilities: defineProviderCapabilities({
        supportsAsync: true,
        supportsBatch: true,
        supportsStreaming: false,
      }),
    }) as ProviderDescriptor;

    assert.equal(declaresAsync(provider), true);
    assert.equal(declaresBatch(provider), true);
    assert.equal(declaresStreaming(provider), false);
  });

  it("createProviderId gera ids opacos distintos", () => {
    const a = createProviderId("pp");
    const b = createProviderId("pp");
    assert.notEqual(a, b);
    assert.match(a, /^pp-/);
  });

  it("Providers não conversam entre si — apenas via Registry/Port", async () => {
    const port = createProcessingProviderPort({ provider: "mock" });
    await port.registerProvider({
      provider: sampleProvider({ providerId: "iso-a", providerName: "A" }),
    });
    await port.registerProvider({
      provider: sampleProvider({ providerId: "iso-b", providerName: "B" }),
    });

    const a = await port.getProvider({ providerId: "iso-a" });
    const b = await port.getProvider({ providerId: "iso-b" });
    assert.equal(a.provider?.providerId, "iso-a");
    assert.equal(b.provider?.providerId, "iso-b");
    assert.notEqual(a.provider?.providerId, b.provider?.providerId);
  });

  it("não há vazamento de OCR/IA implementados nem de domínio clínico no barrel", async () => {
    const mod = await import("../../../src/lib/enterprise/processing-provider/index.ts");
    const surface = JSON.stringify(Object.keys(mod).sort());

    // Framework não exporta implementações de processamento
    assert.equal(surface.includes("Tesseract"), false);
    assert.equal(surface.includes("OpenAI"), false);
    assert.equal(surface.includes("parseXml"), false);
    assert.equal(surface.includes("scanBarcode"), false);

    // Sem vazamento clínico em exports públicos
    const lower = surface.toLowerCase();
    assert.equal(lower.includes("paciente"), false);
    assert.equal(lower.includes("cooperativa"), false);
    assert.equal(lower.includes("operadora"), false);
    assert.equal(lower.includes("glosa"), false);
  });

  it("unregister inexistente e update de provider existente", async () => {
    const port = new DefaultProcessingProviderAdapter();
    const missing = await port.unregisterProvider({ providerId: "nope" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");

    await port.registerProvider({
      provider: sampleProvider({ providerId: "upd-1", providerVersion: "1.0.0" }),
    });
    const updated = await port.registerProvider({
      provider: sampleProvider({
        providerId: "upd-1",
        providerVersion: "1.0.1",
        enabled: true,
        healthStatus: "ready",
      }),
    });
    assert.equal(updated.code, "updated");
    assert.equal(updated.provider?.providerVersion, "1.0.1");
    assert.equal(updated.provider?.enabled, true);
  });
});
