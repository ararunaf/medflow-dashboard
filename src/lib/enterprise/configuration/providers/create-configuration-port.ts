/**
 * Provider / factory do ConfigurationPort — inversão de dependência (EPC-03).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 */
import { DefaultConfigurationAdapter } from "../adapters/default-configuration-adapter";
import { MockConfigurationAdapter } from "../adapters/mock-configuration-adapter";
import type { ConfigurationPort } from "../ports/configuration-port";
import type { ConfigurationProviderOptions } from "../ports/types";

/**
 * Cria o ConfigurationPort para o provedor solicitado.
 *
 * Default de produção: DefaultConfigurationAdapter (store in-process).
 * Provedores futuros (env / remote / database / redis) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createConfigurationPort(
  options: ConfigurationProviderOptions = {},
): ConfigurationPort {
  const provider = options.provider ?? "default";

  switch (provider) {
    case "default":
      return new DefaultConfigurationAdapter();
    case "mock":
      return new MockConfigurationAdapter({ provider: "mock" });
    case "test":
      return new MockConfigurationAdapter({ provider: "test" });
    case "env":
    case "remote":
    case "database":
    case "redis":
      throw new Error(
        `Configuration adapter para "${provider}" ainda não implementado. ` +
          `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
      );
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Provedor de configuração desconhecido: ${String(_exhaustive)}`);
    }
  }
}
