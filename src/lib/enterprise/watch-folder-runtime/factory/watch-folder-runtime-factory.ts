/**
 * WatchFolderRuntimeFactory — instancia o adapter correto (F3-CAP-02).
 *
 * Sem lógica de negócio. Sem Scanner real. Sem Local/Network/UNC/SMB/Azure Files. Sem FileSystemWatcher.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → WatchFolderRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultWatchFolderRuntimeAdapter, MockWatchFolderRuntimeAdapter } from "../adapters";
import type { WatchFolderRuntimePort } from "../ports/watch-folder-runtime-port";
import type {
  WatchFolderRuntimeEnterpriseDeps,
  WatchFolderRuntimeOptions,
  WatchFolderRuntimeProviderId,
} from "../ports/types";
import {
  WatchFolderRuntimeRegistry,
  createDefaultWatchFolderRuntimeRegistry,
} from "../registry/watch-folder-runtime-registry";
import type { WatchFolderRuntimeStore } from "../store";

export type WatchFolderRuntimeFactoryOptions = {
  registry?: WatchFolderRuntimeRegistry;
  store?: WatchFolderRuntimeStore;
  enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o WatchFolderRuntimePort pedido.
 */
export class WatchFolderRuntimeFactory {
  private readonly registry: WatchFolderRuntimeRegistry;
  private readonly store?: WatchFolderRuntimeStore;
  private readonly enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps;

  constructor(options: WatchFolderRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultWatchFolderRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): WatchFolderRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: WatchFolderRuntimeOptions = {}): WatchFolderRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Watch Folder Runtime provider "${provider}" não está registrado no WatchFolderRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: WatchFolderRuntimeProviderId,
    enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps,
  ): WatchFolderRuntimePort {
    switch (provider) {
      case "mock":
        return new MockWatchFolderRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockWatchFolderRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultWatchFolderRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultWatchFolderRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Watch Folder Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createWatchFolderRuntimeFactory(
  options: WatchFolderRuntimeFactoryOptions = {},
): WatchFolderRuntimeFactory {
  return new WatchFolderRuntimeFactory(options);
}
