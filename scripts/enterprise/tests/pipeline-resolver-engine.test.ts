#!/usr/bin/env node
/**
 * EPC-24 Sprint 02 — Pipeline Resolver Foundation
 * Prova Application → PipelineResolverPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_PIPELINE_ID,
  CANONICAL_PIPELINE_NAME,
  CANONICAL_PIPELINE_VERSION,
  DEFAULT_PIPELINE_RESOLVER_ADAPTER_ID,
  DEFAULT_PIPELINE_RESOLVER_STORE_ID,
  DefaultPipelineResolverAdapter,
  DefaultPipelineResolverStore,
  MOCK_PIPELINE_RESOLVER_ADAPTER_ID,
  MockPipelineResolverAdapter,
  OFFICIAL_PORT_CHAIN,
  OFFICIAL_PORT_CONTRACTS,
  OFFICIAL_PORT_REFS,
  OFFICIAL_PORT_RESOLUTION_NOTES,
  buildCanonicalPipelineDefinition,
  createPipelineResolverFactory,
  createPipelineResolverPort,
  createStableCanonicalPipelineDefinition,
  getPipelineResolverHealthSummary,
  resetAllPipelineResolverIdSequences,
  type OfficialPortRegistry,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";
import { createDocumentIntakePort } from "../../../src/lib/enterprise/document-intake/index.ts";
import { createDocumentProcessorPort } from "../../../src/lib/enterprise/document-processor/index.ts";
import { createProcessingProviderPort } from "../../../src/lib/enterprise/processing-provider/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createTISSMappingPort } from "../../../src/lib/enterprise/tiss-mapping/index.ts";
import { createTISSVocabularyPort } from "../../../src/lib/enterprise/tiss-vocabulary/index.ts";
import { createTISSProfilePort } from "../../../src/lib/enterprise/tiss-profile/index.ts";
import { createHealthcareModelPort } from "../../../src/lib/enterprise/healthcare-model/index.ts";
import { createContractRuleBindingPort } from "../../../src/lib/enterprise/contract-rule-binding/index.ts";
import { createTISSRuleRuntimePort } from "../../../src/lib/enterprise/tiss-rule-runtime/index.ts";
import { createAIAuditorPort } from "../../../src/lib/enterprise/ai-auditor/index.ts";

describe("EPC-24 PipelineResolverPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: PipelineResolverPort = new MockPipelineResolverAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedPipelineCount, 1);
    assert.equal(health.storedResolutionCount, 0);
    assert.equal(health.officialPortRefCount, 11);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsResolvePipeline, true);
    assert.equal(caps.supportsGetPipeline, true);
    assert.equal(caps.supportsListPipelines, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.resolvesViaOfficialPortsOnly, true);
    assert.equal(caps.officialPortCount, 11);
    assert.equal(caps.structuralResolutionOnly, true);
    assert.equal(caps.stagesExecuted, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.implementsMapping, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsPersistence, false);
    assert.equal(caps.implementsUi, false);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("DefaultPipelineResolverAdapter é o default da fundação", async () => {
    const port: PipelineResolverPort = new DefaultPipelineResolverAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_PIPELINE_RESOLVER_ADAPTER_ID);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.structuralResolutionOnly, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createPipelineResolverPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultPipelineResolverAdapter({
      store: new DefaultPipelineResolverStore(),
      ping: async () => ({
        ok: true,
        message: "pipeline-resolver probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "pipeline-resolver probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultPipelineResolverAdapter", () => {
    const defaultPort = createPipelineResolverPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createPipelineResolverFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createPipelineResolverPort({ provider: "mock" });
    const summary = await getPipelineResolverHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_PIPELINE_RESOLVER_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_PIPELINE_RESOLVER_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Pipeline Resolution", () => {
  it("resolvePipeline retorna composição estrutural completa sem executar etapas", async () => {
    resetAllPipelineResolverIdSequences();
    const port = new MockPipelineResolverAdapter({
      createResolutionId: () => "resolution-fixed-1",
      createResolutionResultId: () => "resolution-result-fixed-1",
      now: () => "2026-08-01T12:00:00.000Z",
    });

    const resolved = await port.resolvePipeline({
      correlationId: "corr-1",
      channel: "enterprise-test",
      tags: ["foundation", "pipeline"],
    });

    assert.equal(resolved.ok, true);
    assert.equal(resolved.code, "resolved");
    assert.equal(resolved.resolution?.id, "resolution-fixed-1");
    assert.equal(resolved.result?.id, "resolution-result-fixed-1");
    assert.equal(resolved.result?.status, "resolved");
    assert.equal(resolved.result?.pipelineId, CANONICAL_PIPELINE_ID);
    assert.equal(resolved.result?.pipelineName, CANONICAL_PIPELINE_NAME);
    assert.equal(resolved.result?.stagesExecuted, false);
    assert.equal(resolved.result?.enginesInvoked, false);
    assert.equal(resolved.result?.resolvedViaOfficialPortsOnly, true);
    assert.equal(resolved.result?.stageCount, 11);
    assert.equal(resolved.result?.nodeCount, 11);
    assert.equal(resolved.result?.dependencyCount, 10);

    const health = await port.health();
    assert.equal(health.storedResolutionCount, 1);
  });

  it("getPipeline e listPipelines cobrem consulta", async () => {
    const port = new DefaultPipelineResolverAdapter();

    const got = await port.getPipeline({ pipelineId: CANONICAL_PIPELINE_ID });
    assert.equal(got.ok, true);
    assert.equal(got.definition?.id, CANONICAL_PIPELINE_ID);
    assert.equal(got.definition?.version, CANONICAL_PIPELINE_VERSION);

    const listed = await port.listPipelines({ tag: "canonical" });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.pipelines[0]?.id, CANONICAL_PIPELINE_ID);

    const missing = await port.getPipeline({ pipelineId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("mock unhealthy bloqueia resolução", async () => {
    const port = new MockPipelineResolverAdapter({
      healthy: false,
      message: "offline for homologation",
    });
    const health = await port.health();
    assert.equal(health.ok, false);

    const resolved = await port.resolvePipeline();
    assert.equal(resolved.ok, false);
    assert.equal(resolved.code, "unhealthy");
  });
});

describe("EPC-24 Pipeline Composition / Ordering / Metadata / Dependencies", () => {
  it("composição canônica contém exatamente os 11 Ports oficiais", () => {
    assert.equal(OFFICIAL_PORT_CHAIN.length, 11);
    assert.equal(OFFICIAL_PORT_REFS.length, 11);
    assert.equal(OFFICIAL_PORT_CONTRACTS.length, 11);

    assert.deepEqual(
      [...OFFICIAL_PORT_CONTRACTS],
      [
        "DocumentIntakePort",
        "DocumentProcessorPort",
        "ProcessingProviderPort",
        "OCRProviderPort",
        "TISSMappingPort",
        "TISSVocabularyPort",
        "TISSProfilePort",
        "HealthcareModelPort",
        "ContractRuleBindingPort",
        "TISSRuleRuntimePort",
        "AIAuditorPort",
      ],
    );
  });

  it("ordenação do pipeline é canônica e estável", async () => {
    const port = createPipelineResolverPort({ provider: "mock" });
    const resolved = await port.resolvePipeline();
    assert.equal(resolved.ok, true);

    const names = resolved.result?.orderedStages.map((stage) => stage.name);
    assert.deepEqual(names, [
      "document-intake",
      "document-processing",
      "processing-provider",
      "ocr-provider",
      "tiss-mapping",
      "tiss-vocabulary",
      "tiss-profile",
      "healthcare-model",
      "contract-rule-binding",
      "tiss-rule-runtime",
      "ai-auditor",
    ]);

    for (let i = 0; i < (resolved.result?.orderedNodes.length ?? 0); i++) {
      assert.equal(resolved.result?.orderedNodes[i]?.order, i);
      assert.equal(resolved.result?.orderedStages[i]?.order, i);
    }
  });

  it("metadados do pipeline são estruturais", () => {
    const definition = createStableCanonicalPipelineDefinition();
    assert.equal(definition.kind, "pipeline-definition");
    assert.equal(definition.metadata?.stageCount, 11);
    assert.equal(definition.metadata?.nodeCount, 11);
    assert.equal(definition.metadata?.dependencyCount, 10);
    assert.equal(definition.metadata?.officialPortCount, 11);
    assert.ok(definition.tags?.includes("canonical"));
    assert.ok(definition.tags?.includes("epc-24"));
  });

  it("dependências lineares cobrem todos os nós após o primeiro", () => {
    const definition = buildCanonicalPipelineDefinition({
      pipelineId: "pipeline-deps-test",
      createStageId: (() => {
        let n = 0;
        return () => `stage-${++n}`;
      })(),
      createNodeId: (() => {
        let n = 0;
        return () => `node-${++n}`;
      })(),
      createDependencyId: (() => {
        let n = 0;
        return () => `dep-${++n}`;
      })(),
      now: () => "2026-08-01T00:00:00.000Z",
    });

    assert.equal(definition.dependencies.length, 10);
    assert.equal(definition.nodes[0]?.dependencyIds?.length, 0);
    for (let i = 1; i < definition.nodes.length; i++) {
      assert.equal(definition.nodes[i]?.dependencyIds?.length, 1);
      assert.equal(definition.dependencies[i - 1]?.fromNodeId, definition.nodes[i]?.id);
      assert.equal(definition.dependencies[i - 1]?.toNodeId, definition.nodes[i - 1]?.id);
    }
  });
});

describe("EPC-24 Resolver Factory / Provider / Adapter / Port / Health / Capabilities", () => {
  it("Factory aceita officialPorts sem acoplar Engines", () => {
    const factory = createPipelineResolverFactory({
      officialPorts: {
        documentIntake: createDocumentIntakePort({ provider: "mock" }),
        aiAuditor: createAIAuditorPort({ provider: "mock" }),
      },
    });
    const port = factory.create({ provider: "mock" });
    assert.equal(port.providerId, "mock");
    assert.equal(port.capabilities().noDirectEngineCoupling, true);
  });

  it("Provider cria Port sem lógica de negócio", async () => {
    const port = createPipelineResolverPort({ provider: "default" });
    const resolved = await port.resolvePipeline();
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.stagesExecuted, false);
  });

  it("Adapter aceita registry tipado de Ports oficiais sem invocá-los", async () => {
    const officialPorts: OfficialPortRegistry = {
      documentIntake: createDocumentIntakePort({ provider: "mock" }),
      documentProcessor: createDocumentProcessorPort({ provider: "mock" }),
      processingProvider: createProcessingProviderPort({ provider: "mock" }),
      ocrProvider: createOCRProviderPort({ provider: "mock" }),
      tissMapping: createTISSMappingPort({ provider: "mock" }),
      tissVocabulary: createTISSVocabularyPort({ provider: "mock" }),
      tissProfile: createTISSProfilePort({ provider: "mock" }),
      healthcareModel: createHealthcareModelPort({ provider: "mock" }),
      contractRuleBinding: createContractRuleBindingPort({ provider: "mock" }),
      tissRuleRuntime: createTISSRuleRuntimePort({ provider: "mock" }),
      aiAuditor: createAIAuditorPort({ provider: "mock" }),
    };

    const adapter = new DefaultPipelineResolverAdapter({
      officialPorts,
      now: () => "2026-08-01T15:00:00.000Z",
    });

    const registry = adapter.getOfficialPorts();
    assert.ok(registry);
    assert.equal(registry?.documentProcessor?.providerId, "mock");
    assert.equal(registry?.ocrProvider?.providerId, "mock");
    assert.equal(registry?.tissMapping?.providerId, "mock");
    assert.equal(registry?.tissRuleRuntime?.providerId, "mock");
    assert.equal(registry?.aiAuditor?.providerId, "mock");

    const resolved = await adapter.resolvePipeline({ channel: "official-ports-ref" });
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.enginesInvoked, false);
    assert.equal(resolved.result?.stagesExecuted, false);

    const ocrCaps = officialPorts.ocrProvider?.capabilities();
    const auditorCaps = officialPorts.aiAuditor?.capabilities();
    assert.ok(ocrCaps);
    assert.ok(auditorCaps);
    assert.equal(adapter.capabilities().implementsOcr, false);
    assert.equal(adapter.capabilities().implementsAi, false);
  });

  it("Health e Capabilities cobrem superfície obrigatória", async () => {
    const port = createPipelineResolverPort({ provider: "mock" });
    const health = await port.health();
    const caps = port.capabilities();

    assert.equal(health.ok, true);
    assert.equal(health.officialPortRefCount, 11);
    assert.equal(caps.officialPortRefs.length, 11);
    assert.equal(caps.officialPortContracts.length, 11);
    assert.deepEqual([...caps.officialPortRefs], [...OFFICIAL_PORT_REFS]);
  });

  it("OFFICIAL_PORT_RESOLUTION_NOTES cobre todos os Ports da cadeia", () => {
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.documentIntake.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.documentProcessor.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.processingProvider.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.ocrProvider.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.tissMapping.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.tissVocabulary.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.tissProfile.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.healthcareModel.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.contractRuleBinding.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.tissRuleRuntime.length > 0);
    assert.ok(OFFICIAL_PORT_RESOLUTION_NOTES.aiAuditor.length > 0);
  });

  it("store seeda pipeline canônico e permanece saudável", () => {
    const store = new DefaultPipelineResolverStore();
    assert.equal(store.pipelineCount(), 1);
    assert.ok(store.getPipeline(CANONICAL_PIPELINE_ID));
    assert.equal(store.health().ok, true);
  });
});
