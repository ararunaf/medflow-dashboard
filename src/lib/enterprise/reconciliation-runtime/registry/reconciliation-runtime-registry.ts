/**
 * ReconciliationRuntimeRegistry — catálogo de mecanismos (C-09).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem reconciliação funcional. Sem matching automático.
 */
import {
  DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID,
  DEFAULT_RECONCILIATION_RUNTIME_VERSION,
} from "../adapters/default-reconciliation-runtime-adapter";
import {
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_VERSION,
  MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-reconciliation-runtime-adapter";
import {
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  ReconciliationRuntimeProviderId,
  ReconciliationRuntimeRegistration,
  ReconciliationRuntimeStatus,
} from "../ports/types";

export type ReconciliationRuntimeRegistrySnapshot = {
  registrations: readonly ReconciliationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ReconciliationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Reconciliation Runtime",
    version: DEFAULT_MOCK_RECONCILIATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Reconciliation Runtime mock — no functional reconciliation, no automatic matching, no network.",
  },
  {
    providerId: "test",
    name: "Test Reconciliation Runtime",
    version: DEFAULT_MOCK_RECONCILIATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Reconciliation Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Reconciliation Runtime",
    version: DEFAULT_RECONCILIATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-09).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Reconciliation Runtime",
    version: DEFAULT_RECONCILIATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-09 Enterprise Reconciliation Runtime — structural ReconciliationManifest / CanonicalReconciliationResult / ReconciliationStateMachine foundation (no functional reconciliation).",
  },
];

export class ReconciliationRuntimeRegistry {
  private readonly byId = new Map<
    ReconciliationRuntimeProviderId,
    ReconciliationRuntimeRegistration
  >();

  constructor(seed: readonly ReconciliationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ReconciliationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ReconciliationRuntimeProviderId): ReconciliationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ReconciliationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ReconciliationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ReconciliationRuntimeStatus): readonly ReconciliationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): ReconciliationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultReconciliationRuntimeRegistry(): ReconciliationRuntimeRegistry {
  return new ReconciliationRuntimeRegistry();
}

export const BUILTIN_RECONCILIATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
