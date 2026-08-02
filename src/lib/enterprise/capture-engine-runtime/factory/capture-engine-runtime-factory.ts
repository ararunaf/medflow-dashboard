/**
 * CaptureEngineRuntimeFactory — instancia o adapter correto (DIP-02).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem banco.
 * Posição na arquitetura:
 *   Enterprise Runtime → CaptureEngineRuntimePort → Adapter ← Factory ← Provider
 */
import { DefaultCaptureEngineRuntimeAdapter, MockCaptureEngineRuntimeAdapter } from "../adapters";
import type { CaptureEngineRuntimePort } from "../ports/capture-engine-runtime-port";
import type {
  CaptureEngineRuntimeEnterpriseDeps,
  CaptureEngineRuntimeProviderId,
  CaptureEngineRuntimeProviderOptions,
} from "../ports/types";
import type { CaptureEngineRuntimeStore } from "../store";

export type CaptureEngineRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: CaptureEngineRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: CaptureEngineRuntimeStore;
  /** Ports Enterprise default para provider `default`. */
  enterpriseDeps?: CaptureEngineRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o CaptureEngineRuntimePort pedido.
 */
export class CaptureEngineRuntimeFactory {
  private readonly defaultProvider: CaptureEngineRuntimeProviderId;
  private readonly store?: CaptureEngineRuntimeStore;
  private readonly enterpriseDeps?: CaptureEngineRuntimeEnterpriseDeps;

  constructor(options: CaptureEngineRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: CaptureEngineRuntimeProviderOptions = {}): CaptureEngineRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: CaptureEngineRuntimeProviderId,
    enterpriseDeps?: CaptureEngineRuntimeEnterpriseDeps,
  ): CaptureEngineRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'CaptureEngineRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getDocumentIntakeRuntimePort + getOCRRuntimePort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultCaptureEngineRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockCaptureEngineRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockCaptureEngineRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de capture-engine-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createCaptureEngineRuntimeFactory(
  options: CaptureEngineRuntimeFactoryOptions = {},
): CaptureEngineRuntimeFactory {
  return new CaptureEngineRuntimeFactory(options);
}
