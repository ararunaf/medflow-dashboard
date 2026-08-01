/**
 * TenantAssignmentFactory — instancia o adapter correto (EPC-10B).
 *
 * Sem lógica de negócio. Sem usuários. Sem RBAC. Sem banco.
 * Sem carregamento de Rule Packs / AI / Storage / Configuration / Documents.
 * Posição na arquitetura:
 *   Application → TenantAssignmentPort → Adapter ← Factory ← Provider
 */
import { DefaultTenantAssignmentAdapter, MockTenantAssignmentAdapter } from "../adapters";
import type { TenantAssignmentPort } from "../ports/tenant-assignment-port";
import type { TenantAssignmentProviderId, TenantAssignmentProviderOptions } from "../ports/types";

export type TenantAssignmentFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: TenantAssignmentProviderId;
};

/**
 * Factory responsável por materializar o TenantAssignmentPort pedido.
 */
export class TenantAssignmentFactory {
  private readonly defaultProvider: TenantAssignmentProviderId;

  constructor(options: TenantAssignmentFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: TenantAssignmentProviderOptions = {}): TenantAssignmentPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: TenantAssignmentProviderId): TenantAssignmentPort {
    switch (provider) {
      case "default":
        return new DefaultTenantAssignmentAdapter();
      case "mock":
        return new MockTenantAssignmentAdapter({ provider: "mock" });
      case "test":
        return new MockTenantAssignmentAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `TenantAssignment adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de tenant-assignment desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da camada. */
export function createTenantAssignmentFactory(
  options: TenantAssignmentFactoryOptions = {},
): TenantAssignmentFactory {
  return new TenantAssignmentFactory(options);
}
