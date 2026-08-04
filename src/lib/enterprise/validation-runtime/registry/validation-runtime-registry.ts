/**
 * ValidationRuntimeRegistry — catálogo de mecanismos (F3-CAP-08).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem validação real. Sem auditoria/IA/ML/LLM.
 */
import {
  DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
  DEFAULT_VALIDATION_RUNTIME_VERSION,
} from "../adapters/default-validation-runtime-adapter";
import {
  DEFAULT_MOCK_VALIDATION_RUNTIME_VERSION,
  MOCK_VALIDATION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-validation-runtime-adapter";
import {
  DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  ValidationRuntimeProviderId,
  ValidationRuntimeRegistration,
  ValidationRuntimeStatus,
} from "../ports/types";

export type ValidationRuntimeRegistrySnapshot = {
  registrations: readonly ValidationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ValidationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Validation Runtime",
    version: DEFAULT_MOCK_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Validation Runtime mock — no real validation, no network.",
  },
  {
    providerId: "test",
    name: "Test Validation Runtime",
    version: DEFAULT_MOCK_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Validation Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Validation Runtime",
    version: DEFAULT_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-08).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Validation Runtime",
    version: DEFAULT_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-08 Enterprise Validation Runtime — structural job/request/document orchestration foundation (no real validation).",
  },
];

export class ValidationRuntimeRegistry {
  private readonly byId = new Map<ValidationRuntimeProviderId, ValidationRuntimeRegistration>();

  constructor(seed: readonly ValidationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ValidationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ValidationRuntimeProviderId): ValidationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ValidationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ValidationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ValidationRuntimeStatus): readonly ValidationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): ValidationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultValidationRuntimeRegistry(): ValidationRuntimeRegistry {
  return new ValidationRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_VALIDATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
