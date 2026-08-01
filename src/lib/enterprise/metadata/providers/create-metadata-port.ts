/**
 * Provider / factory do MetadataPort — inversão de dependência (EPC-04).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 */
import { DefaultMetadataAdapter } from "../adapters/default-metadata-adapter";
import { MockMetadataAdapter } from "../adapters/mock-metadata-adapter";
import type { MetadataPort } from "../ports/metadata-port";
import type { MetadataProviderOptions } from "../ports/types";

/**
 * Cria o MetadataPort para o provedor solicitado.
 *
 * Default de produção: DefaultMetadataAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createMetadataPort(options: MetadataProviderOptions = {}): MetadataPort {
  const provider = options.provider ?? "default";

  switch (provider) {
    case "default":
      return new DefaultMetadataAdapter();
    case "mock":
      return new MockMetadataAdapter({ provider: "mock" });
    case "test":
      return new MockMetadataAdapter({ provider: "test" });
    case "database":
    case "remote":
    case "registry":
      throw new Error(
        `Metadata adapter para "${provider}" ainda não implementado. ` +
          `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
      );
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Provedor de metadata desconhecido: ${String(_exhaustive)}`);
    }
  }
}
