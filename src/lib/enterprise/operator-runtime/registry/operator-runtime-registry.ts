/**
 * OperatorRuntimeRegistry — catálogo de mecanismos (C-04).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem operadoras reais.
 */
import {
  DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID,
  DEFAULT_OPERATOR_RUNTIME_VERSION,
} from "../adapters/default-operator-runtime-adapter";
import {
  DEFAULT_MOCK_OPERATOR_RUNTIME_VERSION,
  MOCK_OPERATOR_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-operator-runtime-adapter";
import {
  DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  OperatorRuntimeProviderId,
  OperatorRuntimeRegistration,
  OperatorRuntimeStatus,
} from "../ports/types";

export type OperatorRuntimeRegistrySnapshot = {
  registrations: readonly OperatorRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly OperatorRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Operator Runtime",
    version: DEFAULT_MOCK_OPERATOR_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_OPERATOR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Operator Runtime mock — no real operators, no network.",
  },
  {
    providerId: "test",
    name: "Test Operator Runtime",
    version: DEFAULT_MOCK_OPERATOR_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_OPERATOR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Operator Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Operator Runtime",
    version: DEFAULT_OPERATOR_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-04).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Operator Runtime",
    version: DEFAULT_OPERATOR_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-04 Enterprise Operator Runtime — structural OperatorCapabilityProfile foundation (no real operators).",
  },
];

export class OperatorRuntimeRegistry {
  private readonly byId = new Map<OperatorRuntimeProviderId, OperatorRuntimeRegistration>();

  constructor(seed: readonly OperatorRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: OperatorRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: OperatorRuntimeProviderId): OperatorRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: OperatorRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly OperatorRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: OperatorRuntimeStatus): readonly OperatorRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): OperatorRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultOperatorRuntimeRegistry(): OperatorRuntimeRegistry {
  return new OperatorRuntimeRegistry();
}

export const BUILTIN_OPERATOR_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
