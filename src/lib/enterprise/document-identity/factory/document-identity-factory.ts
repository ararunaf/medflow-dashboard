/**
 * DocumentIdentityFactory — instancia o adapter correto (EPC-08).
 *
 * Sem lógica de negócio. Sem OCR. Sem Storage real. Sem banco.
 * Posição na arquitetura:
 *   Application → DocumentIdentityPort → Adapter ← Factory ← Provider
 */
import { DefaultDocumentIdentityAdapter, MockDocumentIdentityAdapter } from "../adapters";
import type { DocumentIdentityPort } from "../ports/document-identity-port";
import type { DocumentIdentityProviderId, DocumentIdentityProviderOptions } from "../ports/types";

export type DocumentIdentityFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: DocumentIdentityProviderId;
};

/**
 * Factory responsável por materializar o DocumentIdentityPort pedido.
 */
export class DocumentIdentityFactory {
  private readonly defaultProvider: DocumentIdentityProviderId;

  constructor(options: DocumentIdentityFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentIdentityProviderOptions = {}): DocumentIdentityPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: DocumentIdentityProviderId): DocumentIdentityPort {
    switch (provider) {
      case "default":
        return new DefaultDocumentIdentityAdapter();
      case "mock":
        return new MockDocumentIdentityAdapter({ provider: "mock" });
      case "test":
        return new MockDocumentIdentityAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `Document Identity adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de document-identity desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentIdentityFactory(
  options: DocumentIdentityFactoryOptions = {},
): DocumentIdentityFactory {
  return new DocumentIdentityFactory(options);
}
