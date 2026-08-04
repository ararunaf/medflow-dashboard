/**
 * AIOrchestrationRuntimeRegistry — catálogo de mecanismos (F3-CAP-09).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem IA real. Sem OpenAI/Azure/Gemini/Claude.
 */
import {
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AI_ORCHESTRATION_RUNTIME_VERSION,
} from "../adapters/default-ai-orchestration-runtime-adapter";
import {
  DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_VERSION,
  MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-ai-orchestration-runtime-adapter";
import {
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  AIOrchestrationRuntimeProviderId,
  AIOrchestrationRuntimeRegistration,
  AIOrchestrationRuntimeStatus,
} from "../ports/types";

export type AIOrchestrationRuntimeRegistrySnapshot = {
  registrations: readonly AIOrchestrationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly AIOrchestrationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock AI Orchestration Runtime",
    version: DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process AI Orchestration Runtime mock — no real AI, no network.",
  },
  {
    providerId: "test",
    name: "Test AI Orchestration Runtime",
    version: DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic AI Orchestration Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default AI Orchestration Runtime",
    version: DEFAULT_AI_ORCHESTRATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-09).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise AI Orchestration Runtime",
    version: DEFAULT_AI_ORCHESTRATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-09 Enterprise AI Orchestration Runtime — structural job/request/task orchestration foundation (no real AI).",
  },
];

export class AIOrchestrationRuntimeRegistry {
  private readonly byId = new Map<
    AIOrchestrationRuntimeProviderId,
    AIOrchestrationRuntimeRegistration
  >();

  constructor(seed: readonly AIOrchestrationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: AIOrchestrationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(
    providerId: AIOrchestrationRuntimeProviderId,
  ): AIOrchestrationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: AIOrchestrationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly AIOrchestrationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(
    status: AIOrchestrationRuntimeStatus,
  ): readonly AIOrchestrationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): AIOrchestrationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultAIOrchestrationRuntimeRegistry(): AIOrchestrationRuntimeRegistry {
  return new AIOrchestrationRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_AI_ORCHESTRATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
