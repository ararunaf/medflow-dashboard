/**
 * PipelineResolverFactory — instancia o adapter correto (EPC-24 Sprint 02).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Posição na arquitetura:
 *   Application → PipelineResolverPort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultPipelineResolverAdapter, MockPipelineResolverAdapter } from "../adapters";
import type { PipelineResolverPort } from "../ports/pipeline-resolver-port";
import type {
  OfficialPortRegistry,
  PipelineResolverProviderId,
  PipelineResolverProviderOptions,
} from "../ports/types";
import type { PipelineResolverStore } from "../store";

export type PipelineResolverFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: PipelineResolverProviderId;
  /** Store compartilhado opcional. */
  store?: PipelineResolverStore;
  /** Registry opcional de Ports oficiais (DI estrutural — sem invocação de negócio). */
  officialPorts?: OfficialPortRegistry;
};

/**
 * Factory responsável por materializar o PipelineResolverPort pedido.
 */
export class PipelineResolverFactory {
  private readonly defaultProvider: PipelineResolverProviderId;
  private readonly store?: PipelineResolverStore;
  private readonly officialPorts?: OfficialPortRegistry;

  constructor(options: PipelineResolverFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.officialPorts = options.officialPorts;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: PipelineResolverProviderOptions = {}): PipelineResolverPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: PipelineResolverProviderId): PipelineResolverPort {
    switch (provider) {
      case "default":
        return new DefaultPipelineResolverAdapter({
          store: this.store,
          officialPorts: this.officialPorts,
        });
      case "mock":
        return new MockPipelineResolverAdapter({
          provider: "mock",
          store: this.store,
          officialPorts: this.officialPorts,
        });
      case "test":
        return new MockPipelineResolverAdapter({
          provider: "test",
          store: this.store,
          officialPorts: this.officialPorts,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de pipeline-resolver desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createPipelineResolverFactory(
  options: PipelineResolverFactoryOptions = {},
): PipelineResolverFactory {
  return new PipelineResolverFactory(options);
}
