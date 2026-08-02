/**
 * Provider / factory pública do StorageProviderPort (STORAGE-01).
 *
 * Application / Storage Manager Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  StorageProviderFactory,
  createStorageProviderFactory,
} from "../factory/storage-provider-factory";
import type { StorageProviderPort } from "../ports/storage-provider-port";
import type { StorageProviderBackend, StorageProviderOptions } from "../ports/types";
import {
  createSupabaseStorageBackend,
  type SupabaseStorageClientLike,
} from "../adapters/supabase-storage-backend";

let sharedFactory: StorageProviderFactory | undefined;

function getSharedFactory(): StorageProviderFactory {
  if (!sharedFactory) {
    sharedFactory = createStorageProviderFactory();
  }
  return sharedFactory;
}

/**
 * Cria o StorageProviderPort para o provedor solicitado.
 *
 * Default da factory: `supabase` (STORAGE-01 oficial).
 * Sem backend injetado, usa in-memory (seguro para composition root / testes).
 * Para I/O real com Supabase, use createBoundStorageProviderPort(client).
 */
export function createStorageProviderPort(
  options: StorageProviderOptions = {},
): StorageProviderPort {
  return getSharedFactory().create(options);
}

/**
 * Cria StorageProviderPort com backend Supabase homologado ligado ao client.
 * Caminho oficial para captura / produto — sem acesso direto a storage.from.
 */
export function createBoundStorageProviderPort(
  client: SupabaseStorageClientLike,
  options: Omit<StorageProviderOptions, "backend"> = {},
): StorageProviderPort {
  const backend: StorageProviderBackend = createSupabaseStorageBackend(client);
  return createStorageProviderFactory({ backend }).create({
    provider: options.provider ?? "supabase",
    backend,
  });
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getStorageProviderFactory(): StorageProviderFactory {
  return getSharedFactory();
}
