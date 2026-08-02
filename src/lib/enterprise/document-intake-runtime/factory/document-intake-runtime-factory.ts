/**
 * DocumentIntakeRuntimeFactory — instancia o adapter correto (DIP-01).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem banco.
 * Posição na arquitetura:
 *   Enterprise Runtime → DocumentIntakeRuntimePort → Adapter ← Factory ← Provider
 */
import { DefaultDocumentIntakeRuntimeAdapter, MockDocumentIntakeRuntimeAdapter } from "../adapters";
import type { DocumentIntakeRuntimePort } from "../ports/document-intake-runtime-port";
import type {
  DocumentIntakeRuntimeEnterpriseDeps,
  DocumentIntakeRuntimeProviderId,
  DocumentIntakeRuntimeProviderOptions,
} from "../ports/types";
import type { DocumentIntakeRuntimeStore } from "../store";

export type DocumentIntakeRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: DocumentIntakeRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: DocumentIntakeRuntimeStore;
  /** Ports Enterprise default para provider `default`. */
  enterpriseDeps?: DocumentIntakeRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o DocumentIntakeRuntimePort pedido.
 */
export class DocumentIntakeRuntimeFactory {
  private readonly defaultProvider: DocumentIntakeRuntimeProviderId;
  private readonly store?: DocumentIntakeRuntimeStore;
  private readonly enterpriseDeps?: DocumentIntakeRuntimeEnterpriseDeps;

  constructor(options: DocumentIntakeRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: DocumentIntakeRuntimeProviderOptions = {}): DocumentIntakeRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: DocumentIntakeRuntimeProviderId,
    enterpriseDeps?: DocumentIntakeRuntimeEnterpriseDeps,
  ): DocumentIntakeRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'DocumentIntakeRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getDocumentIntakePort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultDocumentIntakeRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockDocumentIntakeRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockDocumentIntakeRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de document-intake-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createDocumentIntakeRuntimeFactory(
  options: DocumentIntakeRuntimeFactoryOptions = {},
): DocumentIntakeRuntimeFactory {
  return new DocumentIntakeRuntimeFactory(options);
}
