/**
 * MockExecutionCapabilityRegistryAdapter — EPC-24 Sprint 08.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem descoberta automática. Sem reflexão. Sem plugins. Sem carregamento dinâmico.
 */
import {
  createCapabilityCategoryId,
  createCapabilityDefinitionId,
  createCapabilityDescriptorId,
  createExecutionCapabilityId,
  createExecutionCapabilityRegistryId,
} from "../ports/identity";
import type { ExecutionCapabilityRegistryPort } from "../ports/execution-capability-registry-port";
import type {
  ExecutionCapabilityRegistryPortCapabilities,
  ExecutionCapabilityRegistryPortHealth,
  ExecutionCapabilityRegistryProviderId,
  ExecutionCapabilityStatisticsResult,
  FindCapabilitiesInput,
  FindCapabilitiesResult,
  GetCapabilityInput,
  GetCapabilityResult,
  ListCapabilitiesInput,
  ListCapabilitiesResult,
  RegisterCapabilityInput,
  RegisterCapabilityResult,
} from "../ports/types";
import {
  DefaultExecutionCapabilityRegistryStore,
  type ExecutionCapabilityRegistryStore,
} from "../store";
import {
  appendCapabilityToRegistry,
  buildCapability,
  buildStatistics,
  buildStructuralHealth,
  ensureCapabilityRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistCapability,
} from "./capability-helpers";

export const MOCK_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_CAPABILITY_REGISTRY_VERSION = "1.0.0";

export type MockExecutionCapabilityRegistryAdapterOptions = {
  provider?: Extract<ExecutionCapabilityRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionCapabilityRegistryStore;
  createExecutionCapabilityRegistryId?: () => string;
  createExecutionCapabilityId?: () => string;
  createDefinitionId?: () => string;
  createDescriptorId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

export class MockExecutionCapabilityRegistryAdapter implements ExecutionCapabilityRegistryPort {
  readonly providerId: Extract<ExecutionCapabilityRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionCapabilityRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createCapabilityIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createDescriptorIdFn: () => string;
  private readonly createCategoryIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionCapabilityRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-capability-registry ready.`;
    this.store = options.store ?? new DefaultExecutionCapabilityRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionCapabilityRegistryId ?? createExecutionCapabilityRegistryId;
    this.createCapabilityIdFn = options.createExecutionCapabilityId ?? createExecutionCapabilityId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createCapabilityDefinitionId;
    this.createDescriptorIdFn = options.createDescriptorId ?? createCapabilityDescriptorId;
    this.createCategoryIdFn = options.createCategoryId ?? createCapabilityCategoryId;
    this.now = options.now;
  }

  getStore(): ExecutionCapabilityRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionCapabilityRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionCapabilityRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedCapabilityCount: this.store.capabilityCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private factories() {
    return {
      createCapabilityId: this.createCapabilityIdFn,
      createDefinitionId: this.createDefinitionIdFn,
      createDescriptorId: this.createDescriptorIdFn,
      createCategoryId: this.createCategoryIdFn,
      createRegistryId: this.createRegistryIdFn,
    };
  }

  private unhealthyResult<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async statistics(): Promise<ExecutionCapabilityStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionCapabilityStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerCapability(input: RegisterCapabilityInput): Promise<RegisterCapabilityResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterCapabilityResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      });
    }

    if (!input.key || !input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "key and name required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      };
    }

    const stamp = this.stamp();
    const factories = this.factories();
    const registry = ensureCapabilityRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getCapabilityByKey(
      registry.executionCapabilityRegistryId,
      input.key,
    );
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "capability already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      };
    }

    if (input.executionCapabilityId && this.store.getCapability(input.executionCapabilityId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "capability already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      };
    }

    const capability = buildCapability(input, registry, stamp, factories);
    persistCapability(this.store, capability);
    const updatedRegistry = appendCapabilityToRegistry(this.store, registry, capability, stamp);

    return {
      ok: true,
      capability,
      registry: updatedRegistry,
      code: "registered",
      message:
        "capability registered structurally — no execution, no auto-discovery, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      autoDiscoveryImplemented: false,
      dynamicLoadingImplemented: false,
      capabilitiesExecuted: false,
    };
  }

  async getCapability(input: GetCapabilityInput): Promise<GetCapabilityResult> {
    if (!this.healthy) return this.unhealthyResult<GetCapabilityResult>();

    if (!input.executionCapabilityId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionCapabilityId or key required",
      };
    }

    let stored = input.executionCapabilityId
      ? this.store.getCapability(input.executionCapabilityId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionCapabilityRegistryId;
      if (registryId) {
        stored = this.store.getCapabilityByKey(registryId, input.key);
      } else {
        stored = this.store.listCapabilities().find((s) => s.capability.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "capability not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      capability: stored.capability,
      registry,
      code: "found",
      message: "capability retrieved structurally",
    };
  }

  async listCapabilities(input: ListCapabilitiesInput = {}): Promise<ListCapabilitiesResult> {
    if (!this.healthy) return this.unhealthyResult<ListCapabilitiesResult>();

    const stamp = this.stamp();
    let capabilities = this.store
      .listCapabilities(input.filter?.executionCapabilityRegistryId)
      .map((s) => s.capability);

    if (input.filter) {
      capabilities = capabilities.filter((c) => matchesFilter(c, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      capabilities = capabilities.slice(0, limit);
    }

    const registryId =
      input.filter?.executionCapabilityRegistryId ?? capabilities[0]?.executionCapabilityRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      capabilities,
      registry,
      total: capabilities.length,
      code: "listed",
      message: `structural capabilities listed — in-memory only (${stamp})`,
    };
  }

  async findCapabilities(input: FindCapabilitiesInput): Promise<FindCapabilitiesResult> {
    if (!this.healthy) {
      return {
        kind: "execution-capability-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      };
    }

    if (!input.filter) {
      return {
        kind: "execution-capability-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      };
    }

    const matches = this.store
      .listCapabilities(input.filter.executionCapabilityRegistryId)
      .map((s) => s.capability)
      .filter((c) => matchesFilter(c, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-capability-result",
        ok: false,
        code: "not_found",
        message: "no capability matched structural filter",
        capabilities: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        autoDiscoveryImplemented: false,
        dynamicLoadingImplemented: false,
        capabilitiesExecuted: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionCapabilityRegistryId)?.registry;

    return {
      kind: "execution-capability-result",
      ok: true,
      executionCapabilityRegistryId: first.executionCapabilityRegistryId,
      executionCapabilityId: first.executionCapabilityId,
      executionId: first.executionId,
      capability: first,
      registry,
      capabilities: matches,
      code: "found",
      message: "capability(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      autoDiscoveryImplemented: false,
      dynamicLoadingImplemented: false,
      capabilitiesExecuted: false,
    };
  }
}
