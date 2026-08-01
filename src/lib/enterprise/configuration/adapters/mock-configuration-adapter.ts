/**
 * MockConfigurationAdapter — EPC-03.
 *
 * Permite testes, homologação, benchmark e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
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
  ConfigurationProviderId,
  ConfigurationRemoveInput,
  ConfigurationRemoveResult,
  ConfigurationSetInput,
  ConfigurationSetResult,
} from "../ports/types";

export type MockConfigurationAdapterOptions = {
  provider?: Extract<ConfigurationProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  seed?: readonly ConfigurationEntry[];
};

export class MockConfigurationAdapter implements ConfigurationPort {
  readonly providerId: Extract<ConfigurationProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly entries = new Map<string, ConfigurationEntry>();

  constructor(options: MockConfigurationAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} configuration ready.`;

    for (const entry of options.seed ?? []) {
      const storageKey = composeConfigurationStorageKey(entry.key, entry.scope);
      this.entries.set(storageKey, entry);
    }
  }

  capabilities(): ConfigurationCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async get(input: ConfigurationGetInput): Promise<ConfigurationGetResult> {
    if (input.resolveHierarchy) {
      const scopes = buildResolutionScopes(input.resolutionContext);
      for (const scope of scopes) {
        const storageKey = composeConfigurationStorageKey(input.key, scope);
        const entry = this.entries.get(storageKey);
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
    const entry = this.entries.get(storageKey);
    if (!entry) {
      return { ok: false, key: input.key, message: "not found" };
    }
    return { ok: true, key: input.key, entry };
  }

  async set(input: ConfigurationSetInput): Promise<ConfigurationSetResult> {
    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    this.entries.set(storageKey, {
      key: input.key,
      value: input.value,
      scope: input.scope,
    });
    return { ok: true, key: input.key, message: "stored in memory" };
  }

  async exists(input: ConfigurationExistsInput): Promise<ConfigurationExistsResult> {
    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    return {
      ok: true,
      key: input.key,
      exists: this.entries.has(storageKey),
    };
  }

  async remove(input: ConfigurationRemoveInput): Promise<ConfigurationRemoveResult> {
    const storageKey = composeConfigurationStorageKey(input.key, input.scope);
    const removed = this.entries.delete(storageKey);
    return {
      ok: true,
      key: input.key,
      removed,
      message: removed ? "removed" : "not found",
    };
  }

  async list(input: ConfigurationListInput = {}): Promise<ConfigurationListResult> {
    const out: ConfigurationEntry[] = [];
    for (const [storageKey, entry] of this.entries) {
      if (input.scope) {
        const segment = composeConfigurationStorageKey("", input.scope).replace(/\/$/, "");
        if (!storageKey.startsWith(segment)) {
          continue;
        }
      }
      if (
        input.prefix &&
        !entry.key.startsWith(input.prefix) &&
        !storageKey.includes(input.prefix)
      ) {
        continue;
      }
      out.push(entry);
    }
    return { ok: true, entries: out };
  }
}
