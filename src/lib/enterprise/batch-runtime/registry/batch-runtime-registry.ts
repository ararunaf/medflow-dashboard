/**
 * BatchRuntimeRegistry — catálogo de mecanismos (C-06).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem processamento em lote.
 */
import {
  DEFAULT_BATCH_RUNTIME_ADAPTER_ID,
  DEFAULT_BATCH_RUNTIME_VERSION,
} from "../adapters/default-batch-runtime-adapter";
import {
  DEFAULT_MOCK_BATCH_RUNTIME_VERSION,
  MOCK_BATCH_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-batch-runtime-adapter";
import {
  REAL_TISS_BATCH_RUNTIME_ADAPTER_ID,
  REAL_TISS_BATCH_RUNTIME_VERSION,
} from "../adapters/real-tiss-batch-runtime-adapter";
import {
  DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  BatchRuntimeProviderId,
  BatchRuntimeRegistration,
  BatchRuntimeStatus,
} from "../ports/types";

export type BatchRuntimeRegistrySnapshot = {
  registrations: readonly BatchRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly BatchRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Batch Runtime",
    version: DEFAULT_MOCK_BATCH_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_BATCH_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Batch Runtime mock — no batch processing, no network.",
  },
  {
    providerId: "test",
    name: "Test Batch Runtime",
    version: DEFAULT_MOCK_BATCH_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_BATCH_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Batch Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Batch Runtime",
    version: DEFAULT_BATCH_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_BATCH_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-06).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Batch Runtime",
    version: DEFAULT_BATCH_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_BATCH_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-06 Enterprise Batch Runtime — structural BatchManifest / BatchStateMachine foundation (no batch processing).",
  },
  {
    providerId: "real-tiss",
    name: "Real TISS Batch Runtime",
    version: REAL_TISS_BATCH_RUNTIME_VERSION,
    status: "ready",
    adapterId: REAL_TISS_BATCH_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Real TISS batch creation adapter — produces ANS TISS batch manifests from XML_GENERATED jobs.",
  },
];

export class BatchRuntimeRegistry {
  private readonly byId = new Map<BatchRuntimeProviderId, BatchRuntimeRegistration>();

  constructor(seed: readonly BatchRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: BatchRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: BatchRuntimeProviderId): BatchRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: BatchRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly BatchRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: BatchRuntimeStatus): readonly BatchRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): BatchRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultBatchRuntimeRegistry(): BatchRuntimeRegistry {
  return new BatchRuntimeRegistry();
}

export const BUILTIN_BATCH_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
