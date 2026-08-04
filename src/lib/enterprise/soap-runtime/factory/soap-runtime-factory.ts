/**
 * SOAPRuntimeFactory — instancia o adapter correto (C-03).
 *
 * Sem lógica de negócio. Sem comunicação SOAP. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → SOAPRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultSOAPRuntimeAdapter, MockSOAPRuntimeAdapter } from "../adapters";
import type { SOAPRuntimePort } from "../ports/soap-runtime-port";
import type {
  SOAPRuntimeEnterpriseDeps,
  SOAPRuntimeOptions,
  SOAPRuntimeProviderId,
} from "../ports/types";
import {
  SOAPRuntimeRegistry,
  createDefaultSOAPRuntimeRegistry,
} from "../registry/soap-runtime-registry";
import type { SOAPRuntimeStore } from "../store";

export type SOAPRuntimeFactoryOptions = {
  registry?: SOAPRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: SOAPRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: SOAPRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o SOAPRuntimePort pedido.
 */
export class SOAPRuntimeFactory {
  private readonly registry: SOAPRuntimeRegistry;
  private readonly store?: SOAPRuntimeStore;
  private readonly enterpriseDeps?: SOAPRuntimeEnterpriseDeps;

  constructor(options: SOAPRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultSOAPRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): SOAPRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: SOAPRuntimeOptions = {}): SOAPRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `SOAP Runtime provider "${provider}" não está registrado no SOAPRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: SOAPRuntimeProviderId,
    enterpriseDeps?: SOAPRuntimeEnterpriseDeps,
  ): SOAPRuntimePort {
    switch (provider) {
      case "mock":
        return new MockSOAPRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockSOAPRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultSOAPRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultSOAPRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`SOAP Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createSOAPRuntimeFactory(
  options: SOAPRuntimeFactoryOptions = {},
): SOAPRuntimeFactory {
  return new SOAPRuntimeFactory(options);
}
