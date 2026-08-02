/**
 * DocumentSearchRuntimeFactory — instancia o adapter correto (DIP-06).
 *
 * Sem lógica de negócio. Sem busca real. Sem indexação. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Enterprise Runtime → Capture Engine Runtime → OCR Runtime
 *     → Document Classification Runtime → Storage Manager Runtime
 *     → DocumentSearchRuntimePort → Adapter ← Factory ← Provider
 */
import { DefaultDocumentSearchRuntimeAdapter, MockDocumentSearchRuntimeAdapter } from "../adapters";
import type { DocumentSearchRuntimePort } from "../ports/document-search-runtime-port";
import type {
  DocumentSearchRuntimeEnterpriseDeps,
  DocumentSearchRuntimeProviderId,
  DocumentSearchRuntimeProviderOptions,
} from "../ports/types";
import type { DocumentSearchRuntimeStore } from "../store";

export type DocumentSearchRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: DocumentSearchRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: DocumentSearchRuntimeStore;
  /** Ports Enterprise default para provider `default`. */
  enterpriseDeps?: DocumentSearchRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o DocumentSearchRuntimePort pedido.
 */
export class DocumentSearchRuntimeFactory {
  private readonly defaultProvider: DocumentSearchRuntimeProviderId;
  private readonly store?: DocumentSearchRuntimeStore;
  private readonly enterpriseDeps?: DocumentSearchRuntimeEnterpriseDeps;

  constructor(options: DocumentSearchRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentSearchRuntimeProviderOptions = {}): DocumentSearchRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: DocumentSearchRuntimeProviderId,
    enterpriseDeps?: DocumentSearchRuntimeEnterpriseDeps,
  ): DocumentSearchRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'DocumentSearchRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getStorageManagerRuntimePort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultDocumentSearchRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockDocumentSearchRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockDocumentSearchRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de document-search-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentSearchRuntimeFactory(
  options: DocumentSearchRuntimeFactoryOptions = {},
): DocumentSearchRuntimeFactory {
  return new DocumentSearchRuntimeFactory(options);
}
