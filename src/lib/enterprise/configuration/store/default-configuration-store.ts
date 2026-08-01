/**
 * DefaultConfigurationStore — store in-process padrão (EPC-03).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado / ligado a mecanismos existentes via runtime do adapter,
 * sem alterar Settings, Auth, Feature Flags ou Environment Manager do produto.
 */
import type { ConfigurationStore, StoredConfigurationEntry } from "./configuration-store";

export const DEFAULT_CONFIGURATION_STORE_ID = "default-in-process";

export type DefaultConfigurationStoreOptions = {
  /** Entradas iniciais (seed estrutural / testes). */
  seed?: readonly StoredConfigurationEntry[];
  /** Função para compor storage key a partir do entry (injetável). */
  composeKey?: (entry: StoredConfigurationEntry) => string;
};

function defaultComposeKey(entry: StoredConfigurationEntry): string {
  const layer = entry.scope?.layer ?? "application";
  const id = entry.scope?.id?.trim();
  const segment = id ? `${layer}:${id}` : layer;
  return `${segment}/${entry.key}`;
}

export class DefaultConfigurationStore implements ConfigurationStore {
  readonly storeId = DEFAULT_CONFIGURATION_STORE_ID;

  private readonly entries = new Map<string, StoredConfigurationEntry>();
  private readonly composeKey: (entry: StoredConfigurationEntry) => string;

  constructor(options: DefaultConfigurationStoreOptions = {}) {
    this.composeKey = options.composeKey ?? defaultComposeKey;
    for (const entry of options.seed ?? []) {
      this.entries.set(this.composeKey(entry), entry);
    }
  }

  get(storageKey: string): StoredConfigurationEntry | undefined {
    return this.entries.get(storageKey);
  }

  set(storageKey: string, entry: StoredConfigurationEntry): void {
    this.entries.set(storageKey, entry);
  }

  exists(storageKey: string): boolean {
    return this.entries.has(storageKey);
  }

  remove(storageKey: string): boolean {
    return this.entries.delete(storageKey);
  }

  list(prefix?: string): readonly StoredConfigurationEntry[] {
    const out: StoredConfigurationEntry[] = [];
    for (const [storageKey, entry] of this.entries) {
      if (
        prefix == null ||
        prefix === "" ||
        storageKey.startsWith(prefix) ||
        entry.key.startsWith(prefix)
      ) {
        out.push(entry);
      }
    }
    return out;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultConfigurationStore ready (${this.entries.size} entries).`,
    };
  }
}
