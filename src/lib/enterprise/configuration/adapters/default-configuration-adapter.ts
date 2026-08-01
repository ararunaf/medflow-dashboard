/**
 * DefaultConfigurationAdapter — adapter default de configuração (EPC-03).
 *
 * Encapsula o Default Configuration Store (in-process) atrás do ConfigurationPort.
 * NÃO cria banco, NÃO cria migrations, NÃO altera persistência de produto,
 * NÃO altera Settings / Auth / Feature Flags / Environment Manager / Tenant.
 *
 * Runtime injetável permite seed/leitura de mecanismos existentes sem acoplar
 * o Port a detalhes de env/Vite/produto.
 */
import { buildResolutionScopes, composeConfigurationStorageKey } from "../ports/hierarchy";
import type { ConfigurationPort } from "../ports/configuration-port";
import type {
  ConfigurationCapabilities,
  ConfigurationEntry,
  ConfigurationExistsInput,
  ConfigurationExistsResult,
  ConfigurationGetInput,
  ConfigurationGetResult,
  ConfigurationHealth,
  ConfigurationListInput,
  ConfigurationListResult,
  ConfigurationRemoveInput,
  ConfigurationRemoveResult,
  ConfigurationSetInput,
  ConfigurationSetResult,
} from "../ports/types";
import {
  DefaultConfigurationStore,
  type ConfigurationStore,
  type StoredConfigurationEntry,
} from "../store";

export const DEFAULT_CONFIGURATION_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro a mecanismos existentes
 * sem alterar providers/settings de produção nesta sprint.
 */
export type DefaultConfigurationRuntime = {
  /** Store ativo. Default: DefaultConfigurationStore in-process. */
  store?: ConfigurationStore;
  /**
   * Leitura opcional de mecanismo legado (env/config atual).
   * EPC-03: não altera código de env/settings; só usa se injetado.
   */
  readLegacy?: (storageKey: string) => StoredConfigurationEntry | undefined;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
};

function defaultRuntime(): DefaultConfigurationRuntime {
  return {
    store: new DefaultConfigurationStore(),
  };
}

export class DefaultConfigurationAdapter implements ConfigurationPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultConfigurationRuntime;
  private readonly store: ConfigurationStore;

  constructor(runtime: DefaultConfigurationRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultConfigurationStore();
  }

  capabilities(): ConfigurationCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_CONFIGURATION_ADAPTER_ID,
      supportsGet: true,
      supportsSet: true,
      supportsExists: true,
      supportsRemove: true,
      supportsList: true,
      supportsHierarchicalResolution: true,
      supportsFeatureFlags: true,
    };
  }

  async health(): Promise<ConfigurationHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok ? "Default configuration probe ok." : "Default configuration probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultConfigurationStore pronto (sem I/O externo — EPC-03).",
    };
  }

  async get(input: ConfigurationGetInput): Promise<ConfigurationGetResult> {
    if (input.resolveHierarchy) {
      const scopes = buildResolutionScopes(input.resolutionContext);
      for (const scope of scopes) {
        const storageKey = composeConfigurationStorageKey(input.key, scope);
        const entry = this.readEntry(storageKey);
        if (entry) {
          return {
            ok: true,
            key: input.key,
            entry: {
              ...entry,
              resolvedFrom: scope.layer === "application" ? "default" : scope.layer,
            },
          };
        }
      }
      return { ok: false, key: input.key, message: "not found (hierarchy)" };
    }

    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    const entry = this.readEntry(storageKey);
    if (!entry) {
      return { ok: false, key: input.key, message: "not found" };
    }
    return { ok: true, key: input.key, entry };
  }

  async set(input: ConfigurationSetInput): Promise<ConfigurationSetResult> {
    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    const entry: ConfigurationEntry = {
      key: input.key,
      value: input.value,
      scope: input.scope,
    };
    this.store.set(storageKey, entry);
    return { ok: true, key: input.key, message: "stored" };
  }

  async exists(input: ConfigurationExistsInput): Promise<ConfigurationExistsResult> {
    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    const exists = this.store.exists(storageKey) || this.runtime.readLegacy?.(storageKey) != null;
    return { ok: true, key: input.key, exists };
  }

  async remove(input: ConfigurationRemoveInput): Promise<ConfigurationRemoveResult> {
    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    const removed = this.store.remove(storageKey);
    return {
      ok: true,
      key: input.key,
      removed,
      message: removed ? "removed" : "not found",
    };
  }

  async list(input: ConfigurationListInput = {}): Promise<ConfigurationListResult> {
    const prefix =
      input.scope != null
        ? composeConfigurationStorageKey(input.prefix ?? "", input.scope).replace(/\/$/, "")
        : input.prefix;

    const fromStore = this.store.list(prefix);
    return { ok: true, entries: fromStore };
  }

  private readEntry(storageKey: string): StoredConfigurationEntry | undefined {
    return this.store.get(storageKey) ?? this.runtime.readLegacy?.(storageKey);
  }
}
