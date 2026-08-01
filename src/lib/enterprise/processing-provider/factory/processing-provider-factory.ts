/**
 * ProcessingProviderFactory — instancia o adapter correto (EPC-14).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem parsers. Sem banco.
 * Posição na arquitetura:
 *   Application → ProcessingProviderPort → Adapter ← Registry ← Factory ← Provider
 */
import { DefaultProcessingProviderAdapter, MockProcessingProviderAdapter } from "../adapters";
import type { ProcessingProviderPort } from "../ports/processing-provider-port";
import type {
  ProcessingProviderProviderId,
  ProcessingProviderProviderOptions,
} from "../ports/types";
import type { ProcessingProviderRegistry } from "../registry";

export type ProcessingProviderFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: ProcessingProviderProviderId;
  /** Registry compartilhado opcional para o adapter default. */
  registry?: ProcessingProviderRegistry;
};

/**
 * Factory responsável por materializar o ProcessingProviderPort pedido.
 */
export class ProcessingProviderFactory {
  private readonly defaultProvider: ProcessingProviderProviderId;
  private readonly registry?: ProcessingProviderRegistry;

  constructor(options: ProcessingProviderFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.registry = options.registry;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: ProcessingProviderProviderOptions = {}): ProcessingProviderPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ProcessingProviderProviderId): ProcessingProviderPort {
    switch (provider) {
      case "default":
        return new DefaultProcessingProviderAdapter(
          this.registry ? { registry: this.registry } : undefined,
        );
      case "mock":
        return new MockProcessingProviderAdapter({ provider: "mock" });
      case "test":
        return new MockProcessingProviderAdapter({ provider: "test" });
      case "database":
      case "remote":
        throw new Error(
          `ProcessingProvider adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de processing-provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createProcessingProviderFactory(
  options: ProcessingProviderFactoryOptions = {},
): ProcessingProviderFactory {
  return new ProcessingProviderFactory(options);
}
