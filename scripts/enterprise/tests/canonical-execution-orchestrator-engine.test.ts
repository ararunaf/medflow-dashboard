#!/usr/bin/env node
/**
 * EPC-24 — Canonical Execution Orchestrator Foundation
 * Prova Application → CanonicalExecutionOrchestratorPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_EXECUTION_STEPS,
  CANONICAL_ORCHESTRATED_COMPONENTS,
  CANONICAL_ORCHESTRATION_PIPELINE,
  CANONICAL_STRUCTURAL_CHAIN,
  DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID,
  DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_STORE_ID,
  DefaultCanonicalExecutionOrchestratorAdapter,
  DefaultCanonicalExecutionOrchestratorStore,
  FOUNDATION_PORT_CHAIN,
  FUTURE_PORT_INTEGRATION_NOTES,
  MOCK_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID,
  MockCanonicalExecutionOrchestratorAdapter,
  ORCHESTRATED_FOUNDATION_PORT_CONTRACTS,
  ORCHESTRATED_FOUNDATION_PORTS,
  createCanonicalExecutionOrchestratorFactory,
  createCanonicalExecutionOrchestratorPort,
  createCanonicalExecutionSteps,
  getCanonicalExecutionOrchestratorHealthSummary,
  resetAllCanonicalExecutionIdSequences,
  type CanonicalExecutionOrchestratorPort,
  type FoundationPortRegistry,
} from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import { createDocumentIntakePort } from "../../../src/lib/enterprise/document-intake/index.ts";
import { createDocumentProcessorPort } from "../../../src/lib/enterprise/document-processor/index.ts";
import { createProcessingProviderPort } from "../../../src/lib/enterprise/processing-provider/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createTISSProfilePort } from "../../../src/lib/enterprise/tiss-profile/index.ts";
import { createHealthcareModelPort } from "../../../src/lib/enterprise/healthcare-model/index.ts";
import { createContractRuleBindingPort } from "../../../src/lib/enterprise/contract-rule-binding/index.ts";
import { createTISSRuleRuntimePort } from "../../../src/lib/enterprise/tiss-rule-runtime/index.ts";

describe("EPC-24 CanonicalExecutionOrchestratorPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: CanonicalExecutionOrchestratorPort = new MockCanonicalExecutionOrchestratorAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedContextCount, 0);
    assert.equal(health.storedResultCount, 0);
    assert.equal(health.storedTraceCount, 0);
    assert.equal(health.foundationPortRefCount, 8);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsStartExecution, true);
    assert.equal(caps.supportsGetExecution, true);
    assert.equal(caps.supportsListExecutions, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsTracing, true);
    assert.equal(caps.orchestratesViaFoundationPortsOnly, true);
    assert.equal(caps.foundationPortCount, 8);
    assert.equal(caps.supportsFuturePortInvocation, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.resolvesPipelineDynamically, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.implementsMapping, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsPersistence, false);
    assert.equal(caps.implementsUi, false);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.orchestrationOnly, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("DefaultCanonicalExecutionOrchestratorAdapter é o default da fundação", async () => {
    const port: CanonicalExecutionOrchestratorPort =
      new DefaultCanonicalExecutionOrchestratorAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.orchestrationOnly, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createCanonicalExecutionOrchestratorPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter({
      store: new DefaultCanonicalExecutionOrchestratorStore(),
      ping: async () => ({
        ok: true,
        message: "canonical-execution-orchestrator probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "canonical-execution-orchestrator probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultCanonicalExecutionOrchestratorAdapter", () => {
    const defaultPort = createCanonicalExecutionOrchestratorPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createCanonicalExecutionOrchestratorFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const summary = await getCanonicalExecutionOrchestratorHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Sprint 02 — Orchestrator depende exclusivamente do Pipeline Resolver", () => {
  it("adapters expõem PipelineResolverPort e não conhecem sequência internamente", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    const mockResolver = mock.getPipelineResolver();
    const defResolver = def.getPipelineResolver();
    assert.ok(mockResolver);
    assert.ok(defResolver);

    const resolved = await mockResolver.resolvePipeline();
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.stagesExecuted, false);
    assert.equal(resolved.result?.enginesInvoked, false);
    assert.equal(resolved.result?.resolvedViaOfficialPortsOnly, true);
    assert.equal(resolved.result?.orderedNodes.length, 8);

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.resolvesPipelineDynamically, true);
  });

  it("startExecution obtém composição via Resolver (não via cadeia hardcoded)", async () => {
    resetAllCanonicalExecutionIdSequences();
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-resolver-1",
      createResultId: () => "canonical-result-resolver-1",
      createTraceId: () => "canonical-trace-resolver-1",
      createCorrelationId: () => "canonical-corr-resolver-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-resolver-${++n}`;
      })(),
      now: () => "2026-08-01T16:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-via-resolver" });
    assert.equal(started.ok, true);
    assert.equal(started.context?.steps.length, 8);
    assert.equal(started.context?.steps[0]?.name, "document-intake");
    assert.equal(started.context?.steps[7]?.name, "tiss-rule-runtime");
    assert.ok(
      started.context?.steps.every((step) =>
        step.notes?.includes("resolved via PipelineResolverPort"),
      ),
    );
    assert.equal(started.result?.enginesInvoked, false);
  });
});

describe("EPC-24 Sprint 03 — Orchestrator cria e utiliza exclusivamente o Execution Context", () => {
  it("adapters expõem ExecutionContextPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionContextPort());
    assert.ok(def.getExecutionContextPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution cria, anexa pipeline e finaliza o Execution Context", async () => {
    resetAllCanonicalExecutionIdSequences();
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint03-1",
      createResultId: () => "canonical-result-sprint03-1",
      createTraceId: () => "canonical-trace-sprint03-1",
      createCorrelationId: () => "canonical-corr-sprint03-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint03-${++n}`;
      })(),
      now: () => "2026-08-01T21:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint03" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.kind, "execution-context");
    assert.equal(started.executionContext?.id, "canonical-exec-sprint03-1");
    assert.equal(started.executionContext?.identity.executionId, "canonical-exec-sprint03-1");
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.executionContext?.stages.length, 8);
    assert.equal(started.executionContext?.pipeline?.stagesExecuted, false);
    assert.equal(started.executionContext?.capability.structuralTransportOnly, true);
    assert.equal(started.executionContext?.state.processingPerformed, false);
    assert.equal(started.result?.enginesInvoked, false);

    const got = await port.getExecution({ executionId: "canonical-exec-sprint03-1" });
    assert.equal(got.ok, true);
    assert.ok(got.executionContext);
    assert.equal(got.executionContext?.state.phase, "finalized");
  });
});

describe("EPC-24 structural pipeline orchestration (sem Engines)", () => {
  it("pipeline canônico contém exatamente os 8 steps da Foundation", () => {
    assert.deepEqual(
      [...CANONICAL_EXECUTION_STEPS],
      [
        "document-intake",
        "document-processing",
        "processing-provider",
        "ocr-provider",
        "tiss-profile",
        "healthcare-model",
        "contract-rule-binding",
        "tiss-rule-runtime",
      ],
    );

    const steps = createCanonicalExecutionSteps(() => "step-fixed");
    assert.equal(steps.length, 8);
    assert.ok(steps.every((step) => step.status === "pending"));
  });

  it("orquestra Document Intake → … → AI Auditor estruturalmente (mock)", async () => {
    resetAllCanonicalExecutionIdSequences();
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-fixed-1",
      createResultId: () => "canonical-result-fixed-1",
      createTraceId: () => "canonical-trace-fixed-1",
      createCorrelationId: () => "canonical-corr-fixed-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-fixed-${++n}`;
      })(),
      now: () => "2026-08-01T12:00:00.000Z",
    });

    const started = await port.startExecution({
      intakeRef: "intake-ref-001",
      documentRef: "document-ref-001",
      channel: "enterprise-test",
      tags: ["foundation", "orchestration"],
    });

    assert.equal(started.ok, true);
    assert.equal(started.context?.executionId, "canonical-exec-fixed-1");
    assert.equal(started.context?.status, "completed");
    assert.equal(started.context?.steps.length, 8);
    assert.equal(started.context?.intakeRef, "intake-ref-001");
    assert.equal(started.context?.documentRef, "document-ref-001");
    assert.equal(started.result?.enginesInvoked, false);
    assert.equal(started.result?.orchestrationViaPortsOnly, true);
    assert.equal(started.trace?.portsOnly, true);
    assert.equal(started.trace?.status, "completed");
    assert.ok(started.context?.steps.every((step) => step.status === "completed"));
    assert.equal(started.context?.steps[0]?.name, "document-intake");
    assert.equal(started.context?.steps[0]?.portContract, "DocumentIntakePort");
    assert.equal(started.context?.steps[7]?.name, "tiss-rule-runtime");
    assert.equal(started.context?.steps[7]?.portContract, "TISSRuleRuntimePort");

    const health = await port.health();
    assert.equal(health.storedContextCount, 1);
    assert.equal(health.storedResultCount, 1);
    assert.equal(health.storedTraceCount, 1);
  });

  it("Default percorre o pipeline sem invocar Engines", async () => {
    resetAllCanonicalExecutionIdSequences();
    const port = new DefaultCanonicalExecutionOrchestratorAdapter({
      now: () => "2026-08-01T13:00:00.000Z",
    });

    const started = await port.startExecution({
      intakeRef: "intake-default-1",
    });
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);
    assert.equal(started.result?.orchestrationViaPortsOnly, true);
    assert.equal(started.context?.steps.length, 8);

    const caps = port.capabilities();
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.implementsMapping, false);
    assert.equal(caps.implementsXmlParser, false);
  });

  it("getExecution e listExecutions cobrem criação e consulta", async () => {
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-list-1",
      now: () => "2026-08-01T14:00:00.000Z",
    });

    const started = await port.startExecution({ channel: "list-test" });
    assert.equal(started.ok, true);

    const got = await port.getExecution({ executionId: "canonical-exec-list-1" });
    assert.equal(got.ok, true);
    assert.equal(got.context?.executionId, "canonical-exec-list-1");
    assert.equal(got.result?.executionId, "canonical-exec-list-1");
    assert.equal(got.trace?.executionId, "canonical-exec-list-1");

    const listed = await port.listExecutions({ status: "completed" });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.executions[0]?.executionId, "canonical-exec-list-1");

    const missing = await port.getExecution({ executionId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("mock unhealthy bloqueia orquestração", async () => {
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      healthy: false,
      message: "offline for homologation",
    });
    const health = await port.health();
    assert.equal(health.ok, false);

    const started = await port.startExecution({ intakeRef: "x" });
    assert.equal(started.ok, false);
    assert.equal(started.code, "unhealthy");
  });
});

describe("EPC-24 Foundation Port references (sem acoplamento a Engines)", () => {
  it("cada step referencia exclusivamente o Port Foundation correspondente", () => {
    assert.equal(FOUNDATION_PORT_CHAIN.length, 8);
    assert.equal(ORCHESTRATED_FOUNDATION_PORTS.length, 8);
    assert.equal(ORCHESTRATED_FOUNDATION_PORT_CONTRACTS.length, 8);

    assert.deepEqual(
      [...ORCHESTRATED_FOUNDATION_PORT_CONTRACTS],
      [
        "DocumentIntakePort",
        "DocumentProcessorPort",
        "ProcessingProviderPort",
        "OCRProviderPort",
        "TISSProfilePort",
        "HealthcareModelPort",
        "ContractRuleBindingPort",
        "TISSRuleRuntimePort",
      ],
    );

    const steps = createCanonicalExecutionSteps(() => "id");
    for (let i = 0; i < FOUNDATION_PORT_CHAIN.length; i++) {
      assert.equal(steps[i]?.portRef, FOUNDATION_PORT_CHAIN[i]?.portRef);
      assert.equal(steps[i]?.portContract, FOUNDATION_PORT_CHAIN[i]?.portContract);
      assert.equal(steps[i]?.name, FOUNDATION_PORT_CHAIN[i]?.stepName);
    }
  });

  it("aceita registry tipado de Ports Foundation sem invocá-los", async () => {
    const foundationPorts: FoundationPortRegistry = {
      documentIntake: createDocumentIntakePort({ provider: "mock" }),
      documentProcessor: createDocumentProcessorPort({ provider: "mock" }),
      processingProvider: createProcessingProviderPort({ provider: "mock" }),
      ocrProvider: createOCRProviderPort({ provider: "mock" }),
      tissProfile: createTISSProfilePort({ provider: "mock" }),
      healthcareModel: createHealthcareModelPort({ provider: "mock" }),
      contractRuleBinding: createContractRuleBindingPort({ provider: "mock" }),
      tissRuleRuntime: createTISSRuleRuntimePort({ provider: "mock" }),
    };

    const port = new DefaultCanonicalExecutionOrchestratorAdapter({
      foundationPorts,
      now: () => "2026-08-01T15:00:00.000Z",
    });

    const registry = port.getFoundationPorts();
    assert.ok(registry);
    assert.equal(registry?.documentIntake?.providerId, "mock");
    assert.equal(registry?.ocrProvider?.providerId, "mock");
    assert.equal(registry?.tissRuleRuntime?.providerId, "mock");

    // Orquestração estrutural — Ports injetados NÃO são invocados para negócio.
    const started = await port.startExecution({ intakeRef: "intake-ports-ref" });
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);
    assert.equal(
      started.context?.steps.every((s) => s.portRef.length > 0),
      true,
    );

    // Ports Foundation injetados expõem capabilities; Orquestrador não executa OCR/IA/regras.
    const ocrCaps = foundationPorts.ocrProvider?.capabilities();
    assert.ok(ocrCaps);
    assert.equal(port.capabilities().implementsOcr, false);
    assert.equal(port.capabilities().implementsAi, false);
  });

  it("Factory aceita foundationPorts sem acoplar Engines", () => {
    const factory = createCanonicalExecutionOrchestratorFactory({
      foundationPorts: {
        documentIntake: createDocumentIntakePort({ provider: "mock" }),
      },
    });
    const port = factory.create({ provider: "mock" });
    assert.equal(port.providerId, "mock");
    assert.equal(port.capabilities().noDirectEngineCoupling, true);
  });
});

describe("EPC-24 structural constants and future integration", () => {
  it("documenta pipeline de orquestração e componentes", () => {
    assert.deepEqual([...CANONICAL_ORCHESTRATION_PIPELINE], [...CANONICAL_EXECUTION_STEPS]);
    assert.ok(CANONICAL_ORCHESTRATED_COMPONENTS.includes("document-intake"));
    assert.ok(CANONICAL_ORCHESTRATED_COMPONENTS.includes("ocr-provider"));
    assert.ok(CANONICAL_ORCHESTRATED_COMPONENTS.includes("tiss-rule-runtime"));

    assert.deepEqual(
      [...CANONICAL_STRUCTURAL_CHAIN],
      [
        "canonical-execution-request",
        "canonical-execution-context",
        "canonical-execution-step",
        "canonical-execution-result",
        "canonical-execution-trace",
      ],
    );
  });

  it("FUTURE_PORT_INTEGRATION_NOTES cobre todos os Ports da cadeia", () => {
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.documentIntake.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.documentProcessor.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.processingProvider.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.ocrProvider.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.tissProfile.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.healthcareModel.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.contractRuleBinding.length > 0);
    assert.ok(FUTURE_PORT_INTEGRATION_NOTES.tissRuleRuntime.length > 0);
  });

  it("modelos canônicos obrigatórios estão tipados no barrel", () => {
    assert.equal(typeof createCanonicalExecutionSteps, "function");
    assert.equal(typeof createCanonicalExecutionOrchestratorPort, "function");
  });
});
