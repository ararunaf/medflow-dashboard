/**
 * TISSRuntimeFactory — instancia o adapter correto (TISS-01).
 */
import { DefaultTISSRuntimeAdapter, MockTISSRuntimeAdapter } from "../adapters";
import type { TISSRuntimePort } from "../ports/tiss-runtime-port";
import type {
  TISSRuntimeEnterpriseDeps,
  TISSRuntimeProviderId,
  TISSRuntimeProviderOptions,
} from "../ports/types";
import type { TISSRuntimeStore } from "../store";

export type TISSRuntimeFactoryOptions = {
  defaultProvider?: TISSRuntimeProviderId;
  store?: TISSRuntimeStore;
  enterpriseDeps?: TISSRuntimeEnterpriseDeps;
};

export class TISSRuntimeFactory {
  private readonly defaultProvider: TISSRuntimeProviderId;
  private readonly store?: TISSRuntimeStore;
  private readonly enterpriseDeps?: TISSRuntimeEnterpriseDeps;

  constructor(options: TISSRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  create(options: TISSRuntimeProviderOptions = {}): TISSRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: TISSRuntimeProviderId,
    enterpriseDeps?: TISSRuntimeEnterpriseDeps,
  ): TISSRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'TISSRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getTISSProviderPort + getTISSCatalogPort + getRulePackEnginePort + getXMLRuntimePort + getXMLGenerationRuntimePort + getXMLSerializerRuntimePort + getXMLSchemaRuntimePort + getXMLValidationRuntimePort + getXSDRuntimePort + getNamespaceRuntimePort + getQueueRuntimePort + getWorkerRuntimePort + getSchedulerRuntimePort + getPersistentQueueRuntimePort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultTISSRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockTISSRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockTISSRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de tiss-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createTISSRuntimeFactory(
  options: TISSRuntimeFactoryOptions = {},
): TISSRuntimeFactory {
  return new TISSRuntimeFactory(options);
}
