/**
 * DefaultExecutionCapabilityRegistryAdapter — adapter default in-memory (EPC-24 Sprint 08).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem descoberta automática. Sem reflexão. Sem plugins. Sem carregamento dinâmico.
 *
 * Representa estruturalmente as capacidades disponíveis.
 * Nenhuma Engine é invocada. Nenhuma capacidade é executada.
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

export const DEFAULT_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_CAPABILITY_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionCapabilityRegistryRuntime = {
  store?: ExecutionCapabilityRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionCapabilityRegistryId?: () => string;
  createExecutionCapabilityId?: () => string;
  createDefinitionId?: () => string;
  createDescriptorId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionCapabilityRegistryRuntime {
  return {
    store: new DefaultExecutionCapabilityRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionCapabilityRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionCapabilityRegistryAdapter implements ExecutionCapabilityRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionCapabilityRegistryRuntime;
  private readonly store: ExecutionCapabilityRegistryStore;

  constructor(runtime: DefaultExecutionCapabilityRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionCapabilityRegistryStore();
  }

  getStore(): ExecutionCapabilityRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionCapabilityRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionCapabilityRegistryPortHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const stamp = nowIso(this.runtime);

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default execution-capability-registry probe ok."
            : "Default execution-capability-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedCapabilityCount: this.store.capabilityCount(),
        storedReferenceCount: this.store.referenceCount(),
        storedCategoryCount: this.store.categoryCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "DefaultExecutionCapabilityRegistryStore pronto (sem I/O externo — EPC-24 Sprint 08).",
      storedRegistryCount: this.store.registryCount(),
      storedCapabilityCount: this.store.capabilityCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionCapabilityStatisticsResult> {
    const stamp = nowIso(this.runtime);
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  private factories() {
    return {
      createCapabilityId: this.runtime.createExecutionCapabilityId ?? createExecutionCapabilityId,
      createDefinitionId: this.runtime.createDefinitionId ?? createCapabilityDefinitionId,
      createDescriptorId: this.runtime.createDescriptorId ?? createCapabilityDescriptorId,
      createCategoryId: this.runtime.createCategoryId ?? createCapabilityCategoryId,
      createRegistryId:
        this.runtime.createExecutionCapabilityRegistryId ?? createExecutionCapabilityRegistryId,
    };
  }

  async registerCapability(input: RegisterCapabilityInput): Promise<RegisterCapabilityResult> {
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

    const stamp = nowIso(this.runtime);
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
    const stamp = nowIso(this.runtime);
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
