/**
 * ScannerRuntimeFactory — instancia o adapter correto (F3-CAP-01).
 *
 * Sem lógica de negócio. Sem Scanner real. Sem TWAIN/WIA/ISIS. Sem Drivers.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ScannerRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultScannerRuntimeAdapter, MockScannerRuntimeAdapter } from "../adapters";
import type { ScannerRuntimePort } from "../ports/scanner-runtime-port";
import type {
  ScannerRuntimeEnterpriseDeps,
  ScannerRuntimeOptions,
  ScannerRuntimeProviderId,
} from "../ports/types";
import {
  ScannerRuntimeRegistry,
  createDefaultScannerRuntimeRegistry,
} from "../registry/scanner-runtime-registry";
import type { ScannerRuntimeStore } from "../store";

export type ScannerRuntimeFactoryOptions = {
  registry?: ScannerRuntimeRegistry;
  store?: ScannerRuntimeStore;
  enterpriseDeps?: ScannerRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o ScannerRuntimePort pedido.
 */
export class ScannerRuntimeFactory {
  private readonly registry: ScannerRuntimeRegistry;
  private readonly store?: ScannerRuntimeStore;
  private readonly enterpriseDeps?: ScannerRuntimeEnterpriseDeps;

  constructor(options: ScannerRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultScannerRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ScannerRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: ScannerRuntimeOptions = {}): ScannerRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Scanner Runtime provider "${provider}" não está registrado no ScannerRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ScannerRuntimeProviderId,
    enterpriseDeps?: ScannerRuntimeEnterpriseDeps,
  ): ScannerRuntimePort {
    switch (provider) {
      case "mock":
        return new MockScannerRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockScannerRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultScannerRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultScannerRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Scanner Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createScannerRuntimeFactory(
  options: ScannerRuntimeFactoryOptions = {},
): ScannerRuntimeFactory {
  return new ScannerRuntimeFactory(options);
}
