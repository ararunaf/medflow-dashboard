/**
 * OCRRuntimeFactory — instancia o adapter correto (DIP-03).
 *
 * Sem lógica de negócio. Sem OCR real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Enterprise Runtime → Capture Engine Runtime → OCRRuntimePort
 *     → Adapter ← Factory ← Provider
 */
import { DefaultOCRRuntimeAdapter, MockOCRRuntimeAdapter } from "../adapters";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type {
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeProviderId,
  OCRRuntimeProviderOptions,
} from "../ports/types";
import type { OCRRuntimeStore } from "../store";

export type OCRRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: OCRRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: OCRRuntimeStore;
  /** Ports Enterprise default para provider `default`. */
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o OCRRuntimePort pedido.
 */
export class OCRRuntimeFactory {
  private readonly defaultProvider: OCRRuntimeProviderId;
  private readonly store?: OCRRuntimeStore;
  private readonly enterpriseDeps?: OCRRuntimeEnterpriseDeps;

  constructor(options: OCRRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: OCRRuntimeProviderOptions = {}): OCRRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: OCRRuntimeProviderId,
    enterpriseDeps?: OCRRuntimeEnterpriseDeps,
  ): OCRRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'OCRRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getOCRProviderPort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultOCRRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockOCRRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockOCRRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de ocr-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createOCRRuntimeFactory(options: OCRRuntimeFactoryOptions = {}): OCRRuntimeFactory {
  return new OCRRuntimeFactory(options);
}
