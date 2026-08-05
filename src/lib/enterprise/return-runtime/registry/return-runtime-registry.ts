/**
 * ReturnRuntimeRegistry — catálogo de mecanismos (C-08).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem processamento de retorno. Sem correlação automática.
 */
import {
  DEFAULT_RETURN_RUNTIME_ADAPTER_ID,
  DEFAULT_RETURN_RUNTIME_VERSION,
} from "../adapters/default-return-runtime-adapter";
import {
  DEFAULT_MOCK_RETURN_RUNTIME_VERSION,
  MOCK_RETURN_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-return-runtime-adapter";
import {
  DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  ReturnRuntimeProviderId,
  ReturnRuntimeRegistration,
  ReturnRuntimeStatus,
} from "../ports/types";

export type ReturnRuntimeRegistrySnapshot = {
  registrations: readonly ReturnRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ReturnRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Return Runtime",
    version: DEFAULT_MOCK_RETURN_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_RETURN_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Return Runtime mock — no return processing, no automatic correlation, no network.",
  },
  {
    providerId: "test",
    name: "Test Return Runtime",
    version: DEFAULT_MOCK_RETURN_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_RETURN_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Return Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Return Runtime",
    version: DEFAULT_RETURN_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_RETURN_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-08).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Return Runtime",
    version: DEFAULT_RETURN_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_RETURN_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-08 Enterprise Return Runtime — structural ReturnManifest / ReturnCorrelation / ReturnStateMachine foundation (no return processing).",
  },
];

export class ReturnRuntimeRegistry {
  private readonly byId = new Map<ReturnRuntimeProviderId, ReturnRuntimeRegistration>();

  constructor(seed: readonly ReturnRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ReturnRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ReturnRuntimeProviderId): ReturnRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ReturnRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ReturnRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ReturnRuntimeStatus): readonly ReturnRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): ReturnRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultReturnRuntimeRegistry(): ReturnRuntimeRegistry {
  return new ReturnRuntimeRegistry();
}

export const BUILTIN_RETURN_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
