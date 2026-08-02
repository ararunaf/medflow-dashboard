/**
 * DocumentClassificationRuntimeFactory — instancia o adapter correto (DIP-04).
 *
 * Sem lógica de negócio. Sem classificação real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Enterprise Runtime → Capture Engine Runtime → OCR Runtime
 *     → DocumentClassificationRuntimePort → Adapter ← Factory ← Provider
 */
import {
  DefaultDocumentClassificationRuntimeAdapter,
  MockDocumentClassificationRuntimeAdapter,
} from "../adapters";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type {
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeProviderId,
  DocumentClassificationRuntimeProviderOptions,
} from "../ports/types";
import type { DocumentClassificationRuntimeStore } from "../store";

export type DocumentClassificationRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: DocumentClassificationRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: DocumentClassificationRuntimeStore;
  /** Ports Enterprise default para provider `default`. */
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o DocumentClassificationRuntimePort pedido.
 */
export class DocumentClassificationRuntimeFactory {
  private readonly defaultProvider: DocumentClassificationRuntimeProviderId;
  private readonly store?: DocumentClassificationRuntimeStore;
  private readonly enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;

  constructor(options: DocumentClassificationRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(
    options: DocumentClassificationRuntimeProviderOptions = {},
  ): DocumentClassificationRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: DocumentClassificationRuntimeProviderId,
    enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps,
  ): DocumentClassificationRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'DocumentClassificationRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getOCRRuntimePort + getDocumentClassificationProviderPort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultDocumentClassificationRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockDocumentClassificationRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockDocumentClassificationRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de document-classification-runtime desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentClassificationRuntimeFactory(
  options: DocumentClassificationRuntimeFactoryOptions = {},
): DocumentClassificationRuntimeFactory {
  return new DocumentClassificationRuntimeFactory(options);
}
