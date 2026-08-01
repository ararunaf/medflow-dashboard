/**
 * DocumentIntakeFactory — instancia o adapter correto (EPC-12).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem upload. Sem banco.
 * Posição na arquitetura:
 *   Application → DocumentIntakePort → Adapter ← Factory ← Provider
 */
import { DefaultDocumentIntakeAdapter, MockDocumentIntakeAdapter } from "../adapters";
import type { DocumentIntakePort } from "../ports/document-intake-port";
import type { DocumentIntakeProviderId, DocumentIntakeProviderOptions } from "../ports/types";

export type DocumentIntakeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: DocumentIntakeProviderId;
};

/**
 * Factory responsável por materializar o DocumentIntakePort pedido.
 */
export class DocumentIntakeFactory {
  private readonly defaultProvider: DocumentIntakeProviderId;

  constructor(options: DocumentIntakeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentIntakeProviderOptions = {}): DocumentIntakePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: DocumentIntakeProviderId): DocumentIntakePort {
    switch (provider) {
      case "default":
        return new DefaultDocumentIntakeAdapter();
      case "mock":
        return new MockDocumentIntakeAdapter({ provider: "mock" });
      case "test":
        return new MockDocumentIntakeAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `Document Intake adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de document-intake desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentIntakeFactory(
  options: DocumentIntakeFactoryOptions = {},
): DocumentIntakeFactory {
  return new DocumentIntakeFactory(options);
}
