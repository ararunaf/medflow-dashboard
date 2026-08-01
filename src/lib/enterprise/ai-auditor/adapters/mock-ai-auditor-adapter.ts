/**
 * MockAIAuditorAdapter — EPC-18 / FASE 3.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem IA. Sem LLM. Sem HTTP. Sem prompts.
 */
import { createAIOrchestratorPort, type AIOrchestratorPort } from "../../ai-orchestrator";
import type { AIAuditorPort } from "../ports/ai-auditor-port";
import { createAuditId } from "../ports/identity";
import type {
  AIAuditorCapabilities,
  AIAuditorConfigurationValidation,
  AIAuditorHealth,
  AIAuditorProviderId,
  AIAuditorProviderInfo,
  AuditRequest,
  AuditResult,
} from "../ports/types";
import { buildDeterministicAuditExplanation } from "../runtime/build-audit-explanation";
import { DefaultAIAuditorStore, type AIAuditorStore } from "../store";

export const MOCK_AI_AUDITOR_ADAPTER_ID = "mock-in-memory";
export const MOCK_AI_AUDITOR_VERSION = "1.0.0";

export type MockAIAuditorAdapterOptions = {
  provider?: Extract<AIAuditorProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AIAuditorStore;
  orchestrator?: AIOrchestratorPort;
  createId?: () => string;
  now?: () => string;
};

export class MockAIAuditorAdapter implements AIAuditorPort {
  readonly providerId: Extract<AIAuditorProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: AIAuditorStore;
  private readonly orchestrator: AIOrchestratorPort;
  private readonly createId: () => string;
  private readonly now?: () => string;

  constructor(options: MockAIAuditorAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} ai-auditor ready.`;
    this.store = options.store ?? new DefaultAIAuditorStore();
    this.orchestrator = options.orchestrator ?? createAIOrchestratorPort({ provider: "mock" });
    this.createId = options.createId ?? createAuditId;
    this.now = options.now;
  }

  getStore(): AIAuditorStore {
    return this.store;
  }

  getOrchestrator(): AIOrchestratorPort {
    return this.orchestrator;
  }

  capabilities(): AIAuditorCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsAudit: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderInfo: true,
      supportsValidateConfiguration: true,
      usesAiOrchestrator: true,
      usesAiProviderFrameworkViaOrchestrator: true,
      producesAuditExplanationOnly: true,
      decidesApproval: false,
      executesRules: false,
      interpretsContracts: false,
      supportsFutureRuleEngine: true,
      supportsFutureOcr: true,
      supportsFutureDocumentProcessing: true,
      supportsFutureWorkflow: true,
      supportsFutureTissIntelligence: true,
      supportsFutureContractFoundation: true,
    };
  }

  providerInfo(): AIAuditorProviderInfo {
    return {
      providerId: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      name: this.providerId === "test" ? "Test AI Auditor" : "Mock AI Auditor",
      version: MOCK_AI_AUDITOR_VERSION,
      status: this.healthy ? "ready" : "unhealthy",
      usesAiOrchestrator: true,
      usesAiProviderFrameworkViaOrchestrator: true,
      producesAuditExplanationOnly: true,
      description: "Offline mock AI Auditor — no network, no prompts, no LLM.",
    };
  }

  async health(): Promise<AIAuditorHealth> {
    const orch = await this.orchestrator.health();
    return {
      ok: this.healthy && orch.ok,
      provider: this.providerId,
      latencyMs: 0,
      storedExplanationCount: this.store.count(),
      orchestratorOk: orch.ok,
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<AIAuditorConfigurationValidation> {
    const orch = await this.orchestrator.health();
    const errors: string[] = [];
    if (!this.healthy) {
      errors.push("Mock AI Auditor marked unhealthy.");
    }
    if (!orch.ok) {
      errors.push("AI Orchestrator unhealthy.");
    }
    return {
      ok: errors.length === 0,
      provider: this.providerId,
      errors,
      warnings: [],
      orchestratorOk: orch.ok,
      message:
        errors.length === 0
          ? "Mock AI Auditor não requer configuração externa."
          : "Configuração inválida.",
    };
  }

  async audit(request: AuditRequest): Promise<AuditResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: "Mock AI Auditor unhealthy — no AuditExplanation produced.",
      };
    }

    const orchestration = await this.orchestrator.selectProvider({
      requestId: request.auditId,
      taskType: "audit-explanation",
      preferredProviders: request.preferredProviders,
      fallbackProviders: request.fallbackProviders,
      requestedCapabilities: ["structured-output", "document-analysis"],
      tags: request.tags,
      customAttributes: { channel: "ai-auditor", foundation: true },
    });

    const explanation = buildDeterministicAuditExplanation(request, {
      createId: this.createId,
      now: this.now,
      selectedAiProvider: orchestration.selectedProvider,
    });

    this.store.setExplanation({ request, explanation });

    return {
      ok: true,
      explanation,
      code: "audited",
      message: "AuditExplanation produced deterministically (mock — no LLM, no HTTP).",
    };
  }
}
