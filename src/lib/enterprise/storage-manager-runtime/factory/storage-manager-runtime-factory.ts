/**
 * StorageManagerRuntimeFactory — instancia o adapter correto (DIP-05).
 *
 * Sem lógica de negócio. Sem armazenamento real. Sem banco. Sem HTTP. Sem upload.
 * Posição na arquitetura:
 *   Enterprise Runtime → Capture Engine Runtime → OCR Runtime
 *     → Document Classification Runtime → StorageManagerRuntimePort
 *     → Adapter ← Factory ← Provider
 */
import { DefaultStorageManagerRuntimeAdapter, MockStorageManagerRuntimeAdapter } from "../adapters";
import type { StorageManagerRuntimePort } from "../ports/storage-manager-runtime-port";
import type {
  StorageManagerRuntimeEnterpriseDeps,
  StorageManagerRuntimeProviderId,
  StorageManagerRuntimeProviderOptions,
} from "../ports/types";
import type { StorageManagerRuntimeStore } from "../store";

export type StorageManagerRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: StorageManagerRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: StorageManagerRuntimeStore;
  /** Ports Enterprise default para provider `default`. */
  enterpriseDeps?: StorageManagerRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o StorageManagerRuntimePort pedido.
 */
export class StorageManagerRuntimeFactory {
  private readonly defaultProvider: StorageManagerRuntimeProviderId;
  private readonly store?: StorageManagerRuntimeStore;
  private readonly enterpriseDeps?: StorageManagerRuntimeEnterpriseDeps;

  constructor(options: StorageManagerRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: StorageManagerRuntimeProviderOptions = {}): StorageManagerRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: StorageManagerRuntimeProviderId,
    enterpriseDeps?: StorageManagerRuntimeEnterpriseDeps,
  ): StorageManagerRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'StorageManagerRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getDocumentClassificationRuntimePort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultStorageManagerRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockStorageManagerRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockStorageManagerRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de storage-manager-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createStorageManagerRuntimeFactory(
  options: StorageManagerRuntimeFactoryOptions = {},
): StorageManagerRuntimeFactory {
  return new StorageManagerRuntimeFactory(options);
}
