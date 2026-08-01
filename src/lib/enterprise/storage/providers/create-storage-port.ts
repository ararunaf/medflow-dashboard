/**
 * Provider / factory do StoragePort — inversão de dependência (EPC-02).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor diretamente no Domain.
 */
import { MockStorageAdapter } from "../adapters/mock-storage-adapter";
import { SupabaseStorageAdapter } from "../adapters/supabase-storage-adapter";
import type { StoragePort } from "../ports/storage-port";
import type { StorageProviderOptions } from "../ports/types";

/**
 * Cria o StoragePort para o provedor solicitado.
 *
 * Default de produção: Supabase (comportamento atual encapsulado).
 * Provedores futuros (Azure Blob, S3, GCS, NAS, Local, SharePoint) lançam
 * erro explícito até haver adapter dedicado — evita fallback silencioso.
 */
export function createStoragePort(options: StorageProviderOptions = {}): StoragePort {
  const provider = options.provider ?? "supabase";

  switch (provider) {
    case "supabase":
      return new SupabaseStorageAdapter();
    case "mock":
      return new MockStorageAdapter({ provider: "mock" });
    case "test":
      return new MockStorageAdapter({ provider: "test" });
    case "azure-blob":
    case "s3":
    case "gcs":
    case "nas":
    case "local":
    case "sharepoint":
      throw new Error(
        `Storage adapter para "${provider}" ainda não implementado. ` +
          `Use "supabase" (default) ou "mock"/"test" até a sprint correspondente.`,
      );
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Provedor de storage desconhecido: ${String(_exhaustive)}`);
    }
  }
}
