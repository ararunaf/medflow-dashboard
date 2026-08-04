/**
 * OCRRuntimeFactory — instancia o adapter correto (F3-CAP-05 + DIP-03 preservado).
 *
 * Sem lógica de negócio. Sem OCR real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → OCRRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultOCRRuntimeAdapter, MockOCRRuntimeAdapter } from "../adapters";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type {
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeOptions,
  OCRRuntimeProviderId,
} from "../ports/types";
import {
  OCRRuntimeRegistry,
  createDefaultOCRRuntimeRegistry,
} from "../registry/ocr-runtime-registry";
import type { OCRRuntimeStore } from "../store";

export type OCRRuntimeFactoryOptions = {
  registry?: OCRRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: OCRRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o OCRRuntimePort pedido.
 */
export class OCRRuntimeFactory {
  private readonly registry: OCRRuntimeRegistry;
  private readonly store?: OCRRuntimeStore;
  private readonly enterpriseDeps?: OCRRuntimeEnterpriseDeps;

  constructor(options: OCRRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultOCRRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): OCRRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: OCRRuntimeOptions = {}): OCRRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `OCR Runtime provider "${provider}" não está registrado no OCRRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: OCRRuntimeProviderId,
    enterpriseDeps?: OCRRuntimeEnterpriseDeps,
  ): OCRRuntimePort {
    switch (provider) {
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
      case "default":
        return new DefaultOCRRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultOCRRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`OCR Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createOCRRuntimeFactory(options: OCRRuntimeFactoryOptions = {}): OCRRuntimeFactory {
  return new OCRRuntimeFactory(options);
}
