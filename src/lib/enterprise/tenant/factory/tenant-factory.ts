/**
 * TenantFactory — instancia o adapter correto (EPC-10A).
 *
 * Sem lógica de negócio. Sem usuários. Sem RBAC. Sem banco.
 * Posição na arquitetura:
 *   Application → TenantPort → Adapter ← Factory ← Provider
 */
import { DefaultTenantAdapter, MockTenantAdapter } from "../adapters";
import type { TenantPort } from "../ports/tenant-port";
import type { TenantProviderId, TenantProviderOptions } from "../ports/types";

export type TenantFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: TenantProviderId;
};

/**
 * Factory responsável por materializar o TenantPort pedido.
 */
export class TenantFactory {
  private readonly defaultProvider: TenantProviderId;

  constructor(options: TenantFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: TenantProviderOptions = {}): TenantPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: TenantProviderId): TenantPort {
    switch (provider) {
      case "default":
        return new DefaultTenantAdapter();
      case "mock":
        return new MockTenantAdapter({ provider: "mock" });
      case "test":
        return new MockTenantAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `Tenant adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de tenant desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTenantFactory(options: TenantFactoryOptions = {}): TenantFactory {
  return new TenantFactory(options);
}
