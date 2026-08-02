/**
 * DocumentClassificationProviderFactory — instancia o adapter correto (CLASS-01).
 *
 * Sem lógica de negócio. Sem IA. Sem HTTP.
 * Posição na arquitetura:
 *   Application → DocumentClassificationProviderPort → Adapter ← Factory ← Registry
 */
import {
  DefaultDocumentClassificationAdapter,
  MockDocumentClassificationAdapter,
} from "../adapters";
import type { DocumentClassificationProviderPort } from "../ports/document-classification-provider-port";
import type {
  DocumentClassificationProviderId,
  DocumentClassificationProviderOptions,
} from "../ports/types";
import {
  DocumentClassificationProviderRegistry,
  createDefaultDocumentClassificationProviderRegistry,
} from "../registry/document-classification-provider-registry";

export type DocumentClassificationProviderFactoryOptions = {
  registry?: DocumentClassificationProviderRegistry;
};

/**
 * Factory responsável por materializar o DocumentClassificationProviderPort pedido.
 */
export class DocumentClassificationProviderFactory {
  private readonly registry: DocumentClassificationProviderRegistry;

  constructor(options: DocumentClassificationProviderFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultDocumentClassificationProviderRegistry();
  }

  getRegistry(): DocumentClassificationProviderRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentClassificationProviderOptions = {}): DocumentClassificationProviderPort {
    const provider = options.provider ?? "rule-based";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Document classification provider "${provider}" não está registrado no DocumentClassificationProviderRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(
    provider: DocumentClassificationProviderId,
  ): DocumentClassificationProviderPort {
    switch (provider) {
      case "mock":
        return new MockDocumentClassificationAdapter({ provider: "mock" });
      case "test":
        return new MockDocumentClassificationAdapter({ provider: "test" });
      case "default":
        return new DefaultDocumentClassificationAdapter({ provider: "default" });
      case "rule-based":
        return new DefaultDocumentClassificationAdapter({ provider: "rule-based" });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Document classification provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentClassificationProviderFactory(
  options: DocumentClassificationProviderFactoryOptions = {},
): DocumentClassificationProviderFactory {
  return new DocumentClassificationProviderFactory(options);
}
