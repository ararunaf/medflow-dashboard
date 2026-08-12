/**
 * ProtocolRuntimeFactory — instancia o adapter correto (C-07).
 *
 * Sem lógica de negócio. Sem protocolos concretos. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ProtocolRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultProtocolRuntimeAdapter,
  MockProtocolRuntimeAdapter,
  RealTissProtocolRuntimeAdapter,
} from "../adapters";
import type { ProtocolRuntimePort } from "../ports/protocol-runtime-port";
import type {
  ProtocolRuntimeEnterpriseDeps,
  ProtocolRuntimeOptions,
  ProtocolRuntimeProviderId,
} from "../ports/types";
import {
  ProtocolRuntimeRegistry,
  createDefaultProtocolRuntimeRegistry,
} from "../registry/protocol-runtime-registry";
import type { ProtocolRuntimeStore } from "../store";

export type ProtocolRuntimeFactoryOptions = {
  registry?: ProtocolRuntimeRegistry;
  store?: ProtocolRuntimeStore;
  enterpriseDeps?: ProtocolRuntimeEnterpriseDeps;
};

export class ProtocolRuntimeFactory {
  private readonly registry: ProtocolRuntimeRegistry;
  private readonly store?: ProtocolRuntimeStore;
  private readonly enterpriseDeps?: ProtocolRuntimeEnterpriseDeps;

  constructor(options: ProtocolRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultProtocolRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ProtocolRuntimeRegistry {
    return this.registry;
  }

  create(options: ProtocolRuntimeOptions = {}): ProtocolRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Protocol Runtime provider "${provider}" não está registrado no ProtocolRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ProtocolRuntimeProviderId,
    enterpriseDeps?: ProtocolRuntimeEnterpriseDeps,
  ): ProtocolRuntimePort {
    switch (provider) {
      case "mock":
        return new MockProtocolRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockProtocolRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultProtocolRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultProtocolRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissProtocolRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Protocol Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createProtocolRuntimeFactory(
  options: ProtocolRuntimeFactoryOptions = {},
): ProtocolRuntimeFactory {
  return new ProtocolRuntimeFactory(options);
}
