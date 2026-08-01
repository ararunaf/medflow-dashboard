/**
 * DefaultMockAIAuditorAdapter — adapter default determinístico (EPC-18 / FASE 2).
 *
 * Implementação totalmente determinística.
 * Sem IA. Sem LLM. Sem HTTP. Sem prompts.
 *
 * Utiliza AI Orchestrator (EPC-16) apenas para seleção de Provider
 * (nunca invoke). Produz exclusivamente AuditExplanation.
 */
import { createAIOrchestratorPort, type AIOrchestratorPort } from "../../ai-orchestrator";
import type { AIAuditorPort } from "../ports/ai-auditor-port";
import { createAuditId } from "../ports/identity";
import type {
  AIAuditorCapabilities,
  AIAuditorConfigurationValidation,
  AIAuditorHealth,
  AIAuditorProviderInfo,
  AuditRequest,
  AuditResult,
} from "../ports/types";
import { buildDeterministicAuditExplanation } from "../runtime/build-audit-explanation";
import { DefaultAIAuditorStore, type AIAuditorStore } from "../store";

export const DEFAULT_MOCK_AI_AUDITOR_ADAPTER_ID = "default-mock-in-process";
export const DEFAULT_MOCK_AI_AUDITOR_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind do Orchestrator
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultMockAIAuditorRuntime = {
  /** Store ativo. Default: DefaultAIAuditorStore in-process. */
  store?: AIAuditorStore;
  /** AI Orchestrator Port (EPC-16). Default: createAIOrchestratorPort({ provider: "mock" }). */
  orchestrator?: AIOrchestratorPort;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de audit id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultMockAIAuditorRuntime {
  return {
    store: new DefaultAIAuditorStore(),
    orchestrator: createAIOrchestratorPort({ provider: "mock" }),
  };
}

export class DefaultMockAIAuditorAdapter implements AIAuditorPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultMockAIAuditorRuntime;
  private readonly store: AIAuditorStore;
  private readonly orchestrator: AIOrchestratorPort;

  constructor(runtime: DefaultMockAIAuditorRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultAIAuditorStore();
    this.orchestrator = runtime.orchestrator ?? createAIOrchestratorPort({ provider: "mock" });
  }

  /** Acesso estrutural ao store (testes / demo). Sem IA. */
  getStore(): AIAuditorStore {
    return this.store;
  }

  /** Acesso estrutural ao AI Orchestrator (testes / demo). Sem invoke. */
  getOrchestrator(): AIOrchestratorPort {
    return this.orchestrator;
  }

  capabilities(): AIAuditorCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_MOCK_AI_AUDITOR_ADAPTER_ID,
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
      providerId: "default",
      adapterId: DEFAULT_MOCK_AI_AUDITOR_ADAPTER_ID,
      name: "Default Mock AI Auditor",
      version: DEFAULT_MOCK_AI_AUDITOR_VERSION,
      status: "ready",
      usesAiOrchestrator: true,
      usesAiProviderFrameworkViaOrchestrator: true,
      producesAuditExplanationOnly: true,
      description: "Deterministic AI Auditor foundation — no network, no prompts, no LLM.",
    };
  }

  async health(): Promise<AIAuditorHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const orch = await this.orchestrator.health();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok && orch.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        storedExplanationCount: this.store.count(),
        orchestratorOk: orch.ok,
        message:
          probe.message ??
          (probe.ok
            ? "Default mock ai-auditor probe ok."
            : "Default mock ai-auditor probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const orch = await this.orchestrator.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok && orch.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      storedExplanationCount: this.store.count(),
      orchestratorOk: orch.ok,
      message:
        storeHealth.message ??
        "AIAuditorStore + AIOrchestrator prontos (sem I/O externo — EPC-18).",
    };
  }

  async validateConfiguration(): Promise<AIAuditorConfigurationValidation> {
    const orch = await this.orchestrator.health();
    const errors: string[] = [];
    if (!orch.ok) {
      errors.push("AI Orchestrator unhealthy.");
    }
    return {
      ok: errors.length === 0,
      provider: "default",
      errors,
      warnings: [],
      orchestratorOk: orch.ok,
      message:
        errors.length === 0
          ? "Default mock AI Auditor não requer configuração externa."
          : "Configuração inválida: Orchestrator indisponível.",
    };
  }

  async audit(request: AuditRequest): Promise<AuditResult> {
    const orchestration = await this.orchestrator.selectProvider({
      requestId: request.auditId,
      taskType: "audit-explanation",
      preferredProviders: request.preferredProviders,
      fallbackProviders: request.fallbackProviders,
      requestedCapabilities: ["structured-output", "document-analysis"],
      configurationReference: request.configurationReference
        ? {
            id: request.configurationReference.id,
            kind: request.configurationReference.kind,
            version: request.configurationReference.version,
            namespace: request.configurationReference.namespace,
          }
        : undefined,
      metadataReference: request.metadataReference
        ? {
            id: request.metadataReference.id,
            name: request.metadataReference.name,
            namespace: request.metadataReference.namespace,
            version: request.metadataReference.version,
            kind: request.metadataReference.kind,
          }
        : undefined,
      tags: request.tags,
      customAttributes: { channel: "ai-auditor", foundation: true },
    });

    const explanation = buildDeterministicAuditExplanation(request, {
      createId: this.runtime.createId ?? createAuditId,
      now: this.runtime.now,
      selectedAiProvider: orchestration.selectedProvider,
    });

    this.store.setExplanation({ request, explanation });

    return {
      ok: true,
      explanation,
      code: "audited",
      message: "AuditExplanation produced deterministically (no LLM, no HTTP, no decision).",
    };
  }
}
