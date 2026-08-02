/**
 * OCRProviderFactory — instancia o adapter correto (EPC-15 / OCR-01).
 *
 * Sem lógica de negócio. HTTP Azure somente no AzureDocumentIntelligenceAdapter.
 * Posição na arquitetura:
 *   Application → OCRProviderPort → Adapter ← Factory ← Registry
 */
import { AzureDocumentIntelligenceAdapter, MockOCRProviderAdapter } from "../adapters";
import type { OCRProviderPort } from "../ports/ocr-provider-port";
import type { OCRProviderId, OCRProviderOptions } from "../ports/types";
import {
  OCRProviderRegistry,
  createDefaultOCRProviderRegistry,
} from "../registry/ocr-provider-registry";

export type OCRProviderFactoryOptions = {
  registry?: OCRProviderRegistry;
};

/**
 * Factory responsável por materializar o OCRProviderPort pedido.
 */
export class OCRProviderFactory {
  private readonly registry: OCRProviderRegistry;

  constructor(options: OCRProviderFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultOCRProviderRegistry();
  }

  getRegistry(): OCRProviderRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: OCRProviderOptions = {}): OCRProviderPort {
    const provider = options.provider ?? "mock";

    if (!this.registry.has(provider)) {
      throw new Error(`OCR provider "${provider}" não está registrado no OCRProviderRegistry.`);
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: OCRProviderId): OCRProviderPort {
    switch (provider) {
      case "mock":
        return new MockOCRProviderAdapter({ provider: "mock" });
      case "test":
        return new MockOCRProviderAdapter({ provider: "test" });
      case "default":
        return new MockOCRProviderAdapter({ provider: "default" });
      case "azure":
        return new AzureDocumentIntelligenceAdapter();
      default: {
        const _exhaustive: never = provider;
        throw new Error(`OCR provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createOCRProviderFactory(
  options: OCRProviderFactoryOptions = {},
): OCRProviderFactory {
  return new OCRProviderFactory(options);
}
