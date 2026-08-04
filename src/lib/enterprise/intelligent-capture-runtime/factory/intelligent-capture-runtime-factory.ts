/**
 * IntelligentCaptureRuntimeFactory — instancia o adapter correto (F3-CAP-04).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem captura automática.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → IntelligentCaptureRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultIntelligentCaptureRuntimeAdapter,
  MockIntelligentCaptureRuntimeAdapter,
} from "../adapters";
import type { IntelligentCaptureRuntimePort } from "../ports/intelligent-capture-runtime-port";
import type {
  IntelligentCaptureRuntimeEnterpriseDeps,
  IntelligentCaptureRuntimeOptions,
  IntelligentCaptureRuntimeProviderId,
} from "../ports/types";
import {
  IntelligentCaptureRuntimeRegistry,
  createDefaultIntelligentCaptureRuntimeRegistry,
} from "../registry/intelligent-capture-runtime-registry";
import type { IntelligentCaptureRuntimeStore } from "../store";

export type IntelligentCaptureRuntimeFactoryOptions = {
  registry?: IntelligentCaptureRuntimeRegistry;
  store?: IntelligentCaptureRuntimeStore;
  enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o IntelligentCaptureRuntimePort pedido.
 */
export class IntelligentCaptureRuntimeFactory {
  private readonly registry: IntelligentCaptureRuntimeRegistry;
  private readonly store?: IntelligentCaptureRuntimeStore;
  private readonly enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps;

  constructor(options: IntelligentCaptureRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultIntelligentCaptureRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): IntelligentCaptureRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: IntelligentCaptureRuntimeOptions = {}): IntelligentCaptureRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Intelligent Capture Runtime provider "${provider}" não está registrado no IntelligentCaptureRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: IntelligentCaptureRuntimeProviderId,
    enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps,
  ): IntelligentCaptureRuntimePort {
    switch (provider) {
      case "mock":
        return new MockIntelligentCaptureRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockIntelligentCaptureRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultIntelligentCaptureRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultIntelligentCaptureRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Intelligent Capture Runtime provider desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

/** Factory default da fundação. */
export function createIntelligentCaptureRuntimeFactory(
  options: IntelligentCaptureRuntimeFactoryOptions = {},
): IntelligentCaptureRuntimeFactory {
  return new IntelligentCaptureRuntimeFactory(options);
}
