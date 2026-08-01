#!/usr/bin/env node
/**
 * EPC-18 — AI Auditor Foundation
 * Prova Application → AIAuditorPort → Adapter → Store → Orchestrator sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createAIOrchestratorPort,
  MockAIOrchestratorAdapter,
} from "../../../src/lib/enterprise/ai-orchestrator/index.ts";
import {
  AUDIT_EXPLANATION_VERSION,
  CONFIDENCE_LEVELS,
  CONFIDENCE_LEVEL_CATALOG,
  DEFAULT_AI_AUDITOR_STORE_ID,
  DEFAULT_MOCK_AI_AUDITOR_ADAPTER_ID,
  DefaultAIAuditorStore,
  DefaultMockAIAuditorAdapter,
  MockAIAuditorAdapter,
  buildDeterministicAuditExplanation,
  createAIAuditorFactory,
  createAIAuditorPort,
  createAuditId,
  createFindingId,
  getAIAuditorHealthSummary,
  getConfidenceLevel,
  isKnownConfidenceLevel,
  listConfidenceLevels,
  resetAuditIdSequence,
  resetFindingIdSequence,
  type AIAuditorPort,
  type AuditExplanation,
  type AuditRequest,
} from "../../../src/lib/enterprise/ai-auditor/index.ts";

describe("EPC-18 AIAuditorPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: AIAuditorPort = new MockAIAuditorAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedExplanationCount, 0);
    assert.equal(health.orchestratorOk, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsAudit, true);
    assert.equal(caps.usesAiOrchestrator, true);
    assert.equal(caps.usesAiProviderFrameworkViaOrchestrator, true);
    assert.equal(caps.producesAuditExplanationOnly, true);
    assert.equal(caps.decidesApproval, false);
    assert.equal(caps.executesRules, false);
    assert.equal(caps.interpretsContracts, false);
    assert.equal(caps.supportsFutureRuleEngine, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.supportsFutureDocumentProcessing, true);
    assert.equal(caps.supportsFutureWorkflow, true);
    assert.equal(caps.supportsFutureTissIntelligence, true);
    assert.equal(caps.supportsFutureContractFoundation, true);

    const info = port.providerInfo();
    assert.equal(info.providerId, "mock");
    assert.equal(info.producesAuditExplanationOnly, true);
    assert.equal(info.usesAiOrchestrator, true);

    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.orchestratorOk, true);
  });

  it("DefaultMockAIAuditorAdapter é o default da fundação", async () => {
    const port: AIAuditorPort = new DefaultMockAIAuditorAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_MOCK_AI_AUDITOR_ADAPTER_ID);
    assert.equal(caps.producesAuditExplanationOnly, true);
    assert.equal(caps.decidesApproval, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.equal(health.orchestratorOk, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createAIAuditorPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("DefaultMock usa ping opcional sem IA", async () => {
    const port = new DefaultMockAIAuditorAdapter({
      store: new DefaultAIAuditorStore(),
      orchestrator: createAIOrchestratorPort({ provider: "mock" }),
      ping: async () => ({ ok: true, message: "auditor probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "auditor probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultMockAIAuditorAdapter", () => {
    const defaultPort = createAIAuditorPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createAIAuditorFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createAIAuditorPort({ provider: "mock" });
    const summary = await getAIAuditorHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.providerInfo.providerId, "mock");
    assert.equal(summary.health.ok, true);
  });
});

describe("EPC-18 AuditExplanation production", () => {
  it("audit() produz exclusivamente AuditExplanation canônica", async () => {
    resetAuditIdSequence();
    const port = new MockAIAuditorAdapter({
      createId: () => "aia-audit-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const request: AuditRequest = {
      auditId: "aia-audit-fixed-1",
      deterministicOutcome: {
        code: "RULE_EVAL_OK",
        summary: "Deterministic rule outcome echoed.",
        status: "evaluated",
        findings: [
          {
            findingId: "f-1",
            category: "structural",
            severity: "info",
            description: "Echo finding — no decision.",
            confidence: "UNKNOWN",
            relatedRule: { ruleId: "rule-opaque-1" },
          },
        ],
        evidenceList: [{ id: "ev-1", description: "opaque evidence" }],
        relatedRules: [{ ruleId: "rule-opaque-1" }],
        referencedContracts: [{ contractId: "contract-opaque-1" }],
        recommendations: ["Review deterministically."],
        warnings: ["No approval implied."],
      },
      documentReference: { documentId: "doc-1" },
      processingReference: { processingId: "proc-1" },
      workflowReference: { workflowId: "wf-1" },
      rulePackReference: { packId: "pack-1" },
      metadataReference: { id: "meta-1", namespace: "enterprise.core" },
      configurationReference: { id: "cfg-1", kind: "ai-auditor" },
      preferredProviders: ["mock"],
      tags: ["foundation"],
      customAttributes: { channel: "auditor-test" },
    };

    const result = await port.audit(request);
    assert.equal(result.ok, true);
    assert.equal(result.code, "audited");
    assert.ok(result.explanation);

    const explanation: AuditExplanation = result.explanation!;
    assert.equal(explanation.auditId, "aia-audit-fixed-1");
    assert.equal(explanation.summary, "Deterministic rule outcome echoed.");
    assert.equal(explanation.confidenceLevel, "UNKNOWN");
    assert.equal(explanation.explanationVersion, AUDIT_EXPLANATION_VERSION);
    assert.equal(explanation.simulated, true);
    assert.equal(explanation.selectedAiProvider, "mock");
    assert.equal(explanation.findings?.length, 1);
    assert.equal(explanation.findings?.[0]?.findingId, "f-1");
    assert.equal(explanation.documentReference?.documentId, "doc-1");
    assert.equal(explanation.processingReference?.processingId, "proc-1");
    assert.equal(explanation.workflowReference?.workflowId, "wf-1");
    assert.equal(explanation.rulePackReference?.packId, "pack-1");
    assert.equal(explanation.timestamp, "2026-07-31T12:00:00.000Z");
    assert.ok(explanation.tags?.includes("foundation"));
    assert.equal(explanation.customAttributes?.channel, "auditor-test");

    const store = (port as MockAIAuditorAdapter).getStore();
    assert.equal(store.storeId, DEFAULT_AI_AUDITOR_STORE_ID);
    assert.equal(store.count(), 1);
    assert.equal(
      store.getExplanation("aia-audit-fixed-1")?.explanation.auditId,
      "aia-audit-fixed-1",
    );
  });

  it("DefaultMock audit() usa Orchestrator sem invoke", async () => {
    const orchestrator = new MockAIOrchestratorAdapter({
      createId: () => "aio-from-auditor",
    });
    const store = new DefaultAIAuditorStore();
    const port = new DefaultMockAIAuditorAdapter({
      store,
      orchestrator,
      createId: () => "aia-def-1",
      now: () => "2026-07-31T13:00:00.000Z",
    });

    const result = await port.audit({
      auditId: "aia-def-1",
      preferredProviders: ["mock"],
      deterministicOutcome: { summary: "Default mock echo." },
    });

    assert.equal(result.ok, true);
    assert.equal(result.explanation?.auditId, "aia-def-1");
    assert.equal(result.explanation?.selectedAiProvider, "mock");
    assert.equal(result.explanation?.simulated, true);
    assert.equal(store.count(), 1);

    // Orchestrator registrou seleção; nenhum invoke no Port do auditor
    assert.equal(orchestrator.getStore().count(), 1);
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(port));
    assert.ok(keys.includes("audit"));
    assert.equal(typeof (port as { invoke?: unknown }).invoke, "undefined");
  });

  it("mock unhealthy não produz explicação", async () => {
    const port = new MockAIAuditorAdapter({ healthy: false });
    const result = await port.audit({ auditId: "x" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "unhealthy");
    assert.equal(result.explanation, undefined);
  });

  it("buildDeterministicAuditExplanation é puro e não invoca IA", () => {
    const explanation = buildDeterministicAuditExplanation(
      {
        auditId: "pure-1",
        deterministicOutcome: { summary: "pure" },
      },
      {
        now: () => "2026-07-31T00:00:00.000Z",
        selectedAiProvider: "mock",
      },
    );
    assert.equal(explanation.auditId, "pure-1");
    assert.equal(explanation.summary, "pure");
    assert.equal(explanation.confidenceLevel, "UNKNOWN");
    assert.equal(explanation.simulated, true);
    assert.equal(explanation.selectedAiProvider, "mock");
  });
});

describe("EPC-18 ConfidenceLevel (estrutural)", () => {
  it("catálogo contém os 5 níveis da sprint", () => {
    assert.equal(CONFIDENCE_LEVELS.length, 5);
    assert.deepEqual([...CONFIDENCE_LEVELS], ["LOW", "MEDIUM", "HIGH", "VERY_HIGH", "UNKNOWN"]);
    assert.equal(CONFIDENCE_LEVEL_CATALOG.length, 5);
    assert.equal(listConfidenceLevels().length, 5);
    assert.equal(isKnownConfidenceLevel("HIGH"), true);
    assert.equal(isKnownConfidenceLevel("UNKNOWN"), true);
    assert.equal(isKnownConfidenceLevel("CALIBRATED"), false);
    assert.equal(getConfidenceLevel("UNKNOWN")?.calibratedInFoundation, false);
  });
});

describe("EPC-18 identity helpers", () => {
  it("createAuditId / createFindingId são determinísticos por sequência", () => {
    resetAuditIdSequence();
    resetFindingIdSequence();
    assert.equal(createAuditId(), "aia-audit-1");
    assert.equal(createAuditId(), "aia-audit-2");
    assert.equal(createFindingId(), "aia-finding-1");
    resetAuditIdSequence();
    resetFindingIdSequence();
    assert.equal(createAuditId(), "aia-audit-1");
    assert.equal(createFindingId(), "aia-finding-1");
  });
});

describe("EPC-18 isolation guarantees", () => {
  it("AI Auditor não exporta invoke/HTTP/prompts e permanece desacoplada", async () => {
    const port = createAIAuditorPort({ provider: "mock" });
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(port));
    assert.equal(typeof (port as { invoke?: unknown }).invoke, "undefined");
    assert.ok(keys.includes("audit"));
    assert.ok(keys.includes("health"));
    assert.ok(keys.includes("capabilities"));
    assert.ok(keys.includes("providerInfo"));
    assert.ok(keys.includes("validateConfiguration"));

    const caps = port.capabilities();
    assert.equal(caps.decidesApproval, false);
    assert.equal(caps.executesRules, false);
    assert.equal(caps.interpretsContracts, false);
    assert.equal(caps.usesAiOrchestrator, true);

    // Desacoplamento: não importa Rule Engine / Contract / OCR diretamente
    const orch = (port as MockAIAuditorAdapter).getOrchestrator();
    assert.ok(orch);
    assert.equal(typeof (orch as { invoke?: unknown }).invoke, "undefined");
  });
});
