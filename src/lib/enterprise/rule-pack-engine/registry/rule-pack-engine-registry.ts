/**
 * RulePackEngineRegistry — catálogo de mecanismos (TISS-03).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XML. Sem operadoras.
 */
import {
  DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID,
  DEFAULT_RULE_PACK_ENGINE_VERSION,
} from "../adapters/default-rule-pack-engine-adapter";
import {
  DEFAULT_MOCK_RULE_PACK_ENGINE_VERSION,
  MOCK_RULE_PACK_ENGINE_ADAPTER_ID,
} from "../adapters/mock-rule-pack-engine-adapter";
import {
  DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES,
  DEFAULT_RULE_PACK_ENGINE_CAPABILITIES,
  type RulePackEngineCapabilities,
} from "../ports/capabilities";
import type {
  RulePackEngineProviderId,
  RulePackEngineRegistration,
  RulePackEngineStatus,
} from "../ports/types";

export type RulePackEngineRegistrySnapshot = {
  registrations: readonly RulePackEngineRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly RulePackEngineRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Rule Pack Engine",
    version: DEFAULT_MOCK_RULE_PACK_ENGINE_VERSION,
    status: "ready",
    adapterId: MOCK_RULE_PACK_ENGINE_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Rule Pack Engine mock — no XML, no operators.",
  },
  {
    providerId: "test",
    name: "Test Rule Pack Engine",
    version: DEFAULT_MOCK_RULE_PACK_ENGINE_VERSION,
    status: "ready",
    adapterId: MOCK_RULE_PACK_ENGINE_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Rule Pack Engine mock.",
  },
  {
    providerId: "default",
    name: "Default Rule Pack Engine",
    version: DEFAULT_RULE_PACK_ENGINE_VERSION,
    status: "ready",
    adapterId: DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RULE_PACK_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-03).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Rule Pack Engine",
    version: DEFAULT_RULE_PACK_ENGINE_VERSION,
    status: "ready",
    adapterId: DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RULE_PACK_ENGINE_CAPABILITIES,
    description:
      "Official TISS-03 Enterprise Rule Pack Engine — generic pack interpretation via TISSCatalogPort.",
  },
];

export class RulePackEngineRegistry {
  private readonly byId = new Map<RulePackEngineProviderId, RulePackEngineRegistration>();

  constructor(seed: readonly RulePackEngineRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: RulePackEngineRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: RulePackEngineProviderId): RulePackEngineRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: RulePackEngineProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly RulePackEngineRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: RulePackEngineStatus): readonly RulePackEngineRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: RulePackEngineProviderId): RulePackEngineCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): RulePackEngineRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultRulePackEngineRegistry(): RulePackEngineRegistry {
  return new RulePackEngineRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_RULE_PACK_ENGINE_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
