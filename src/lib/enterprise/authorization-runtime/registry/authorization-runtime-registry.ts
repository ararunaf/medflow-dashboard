/**
 * AuthorizationRuntimeRegistry — catálogo de mecanismos (C-05).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem autorização funcional.
 */
import {
  DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
} from "../adapters/default-authorization-runtime-adapter";
import {
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
  MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-authorization-runtime-adapter";
import {
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeRegistration,
  AuthorizationRuntimeStatus,
} from "../ports/types";

export type AuthorizationRuntimeRegistrySnapshot = {
  registrations: readonly AuthorizationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly AuthorizationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Authorization Runtime",
    version: DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Authorization Runtime mock — no functional authorization, no network.",
  },
  {
    providerId: "test",
    name: "Test Authorization Runtime",
    version: DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Authorization Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Authorization Runtime",
    version: DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-05).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Authorization Runtime",
    version: DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-05 Enterprise Authorization Runtime — structural AuthorizationStrategy / AuthorizationPolicy foundation (no functional authorization).",
  },
];

export class AuthorizationRuntimeRegistry {
  private readonly byId = new Map<
    AuthorizationRuntimeProviderId,
    AuthorizationRuntimeRegistration
  >();

  constructor(seed: readonly AuthorizationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: AuthorizationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: AuthorizationRuntimeProviderId): AuthorizationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: AuthorizationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly AuthorizationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: AuthorizationRuntimeStatus): readonly AuthorizationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): AuthorizationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultAuthorizationRuntimeRegistry(): AuthorizationRuntimeRegistry {
  return new AuthorizationRuntimeRegistry();
}

export const BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
