/**
 * DocumentClassificationRuntimeFactory — instancia o adapter correto (F3-CAP-06 + DIP-04/CLASS-01 preservado).
 *
 * Sem lógica de negócio. Sem classificação real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → DocumentClassificationRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultDocumentClassificationRuntimeAdapter,
  MockDocumentClassificationRuntimeAdapter,
} from "../adapters";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type {
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeOptions,
  DocumentClassificationRuntimeProviderId,
} from "../ports/types";
import {
  DocumentClassificationRuntimeRegistry,
  createDefaultDocumentClassificationRuntimeRegistry,
} from "../registry/document-classification-runtime-registry";
import type { DocumentClassificationRuntimeStore } from "../store";

export type DocumentClassificationRuntimeFactoryOptions = {
  registry?: DocumentClassificationRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: DocumentClassificationRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o DocumentClassificationRuntimePort pedido.
 */
export class DocumentClassificationRuntimeFactory {
  private readonly registry: DocumentClassificationRuntimeRegistry;
  private readonly store?: DocumentClassificationRuntimeStore;
  private readonly enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;

  constructor(options: DocumentClassificationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultDocumentClassificationRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): DocumentClassificationRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentClassificationRuntimeOptions = {}): DocumentClassificationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Document Classification Runtime provider "${provider}" não está registrado no DocumentClassificationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: DocumentClassificationRuntimeProviderId,
    enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps,
  ): DocumentClassificationRuntimePort {
    switch (provider) {
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
      case "default":
        return new DefaultDocumentClassificationRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultDocumentClassificationRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Document Classification Runtime provider desconhecido: ${String(_exhaustive)}`,
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
