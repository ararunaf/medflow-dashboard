/**
 * UploadRuntimeFactory — instancia o adapter correto (F3-CAP-03).
 *
 * Sem lógica de negócio. Sem Scanner real. Sem Upload Web/Desktop/Mobile/API real. Sem storage providers. Sem FileSystemWatcher.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → UploadRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultUploadRuntimeAdapter, MockUploadRuntimeAdapter } from "../adapters";
import type { UploadRuntimePort } from "../ports/upload-runtime-port";
import type {
  UploadRuntimeEnterpriseDeps,
  UploadRuntimeOptions,
  UploadRuntimeProviderId,
} from "../ports/types";
import {
  UploadRuntimeRegistry,
  createDefaultUploadRuntimeRegistry,
} from "../registry/upload-runtime-registry";
import type { UploadRuntimeStore } from "../store";

export type UploadRuntimeFactoryOptions = {
  registry?: UploadRuntimeRegistry;
  store?: UploadRuntimeStore;
  enterpriseDeps?: UploadRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o UploadRuntimePort pedido.
 */
export class UploadRuntimeFactory {
  private readonly registry: UploadRuntimeRegistry;
  private readonly store?: UploadRuntimeStore;
  private readonly enterpriseDeps?: UploadRuntimeEnterpriseDeps;

  constructor(options: UploadRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultUploadRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): UploadRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: UploadRuntimeOptions = {}): UploadRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Upload Runtime provider "${provider}" não está registrado no UploadRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: UploadRuntimeProviderId,
    enterpriseDeps?: UploadRuntimeEnterpriseDeps,
  ): UploadRuntimePort {
    switch (provider) {
      case "mock":
        return new MockUploadRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockUploadRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultUploadRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultUploadRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Upload Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createUploadRuntimeFactory(
  options: UploadRuntimeFactoryOptions = {},
): UploadRuntimeFactory {
  return new UploadRuntimeFactory(options);
}
