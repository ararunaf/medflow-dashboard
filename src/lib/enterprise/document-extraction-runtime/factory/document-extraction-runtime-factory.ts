/**
 * DocumentExtractionRuntimeFactory — instancia o adapter correto (F3-CAP-07).
 *
 * Sem lógica de negócio. Sem extração real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → DocumentExtractionRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultDocumentExtractionRuntimeAdapter,
  MockDocumentExtractionRuntimeAdapter,
} from "../adapters";
import type { DocumentExtractionRuntimePort } from "../ports/document-extraction-runtime-port";
import type {
  DocumentExtractionRuntimeEnterpriseDeps,
  DocumentExtractionRuntimeOptions,
  DocumentExtractionRuntimeProviderId,
} from "../ports/types";
import {
  DocumentExtractionRuntimeRegistry,
  createDefaultDocumentExtractionRuntimeRegistry,
} from "../registry/document-extraction-runtime-registry";
import type { DocumentExtractionRuntimeStore } from "../store";

export type DocumentExtractionRuntimeFactoryOptions = {
  registry?: DocumentExtractionRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: DocumentExtractionRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o DocumentExtractionRuntimePort pedido.
 */
export class DocumentExtractionRuntimeFactory {
  private readonly registry: DocumentExtractionRuntimeRegistry;
  private readonly store?: DocumentExtractionRuntimeStore;
  private readonly enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps;

  constructor(options: DocumentExtractionRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultDocumentExtractionRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): DocumentExtractionRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentExtractionRuntimeOptions = {}): DocumentExtractionRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Document Extraction Runtime provider "${provider}" não está registrado no DocumentExtractionRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: DocumentExtractionRuntimeProviderId,
    enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps,
  ): DocumentExtractionRuntimePort {
    switch (provider) {
      case "mock":
        return new MockDocumentExtractionRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockDocumentExtractionRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultDocumentExtractionRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultDocumentExtractionRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Document Extraction Runtime provider desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentExtractionRuntimeFactory(
  options: DocumentExtractionRuntimeFactoryOptions = {},
): DocumentExtractionRuntimeFactory {
  return new DocumentExtractionRuntimeFactory(options);
}
