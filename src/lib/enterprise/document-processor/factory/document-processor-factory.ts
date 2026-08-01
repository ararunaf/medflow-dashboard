/**
 * DocumentProcessorFactory — instancia o adapter correto (EPC-13).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem parsers. Sem banco.
 * Posição na arquitetura:
 *   Application → DocumentProcessorPort → Adapter ← Factory ← Provider
 */
import { DefaultDocumentProcessorAdapter, MockDocumentProcessorAdapter } from "../adapters";
import type { DocumentProcessorPort } from "../ports/document-processor-port";
import type { DocumentProcessorProviderId, DocumentProcessorProviderOptions } from "../ports/types";

export type DocumentProcessorFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: DocumentProcessorProviderId;
};

/**
 * Factory responsável por materializar o DocumentProcessorPort pedido.
 */
export class DocumentProcessorFactory {
  private readonly defaultProvider: DocumentProcessorProviderId;

  constructor(options: DocumentProcessorFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentProcessorProviderOptions = {}): DocumentProcessorPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: DocumentProcessorProviderId): DocumentProcessorPort {
    switch (provider) {
      case "default":
        return new DefaultDocumentProcessorAdapter();
      case "mock":
        return new MockDocumentProcessorAdapter({ provider: "mock" });
      case "test":
        return new MockDocumentProcessorAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `DocumentProcessor adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de document-processor desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentProcessorFactory(
  options: DocumentProcessorFactoryOptions = {},
): DocumentProcessorFactory {
  return new DocumentProcessorFactory(options);
}
