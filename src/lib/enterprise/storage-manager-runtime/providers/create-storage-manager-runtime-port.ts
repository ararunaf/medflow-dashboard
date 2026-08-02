/**
 * StorageManagerRuntimeProvider — factory do Port (DIP-05).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 *
 * Default: DefaultStorageManagerRuntimeAdapter (exige enterpriseDeps).
 */
import { createStorageManagerRuntimeFactory } from "../factory/storage-manager-runtime-factory";
import type { StorageManagerRuntimePort } from "../ports/storage-manager-runtime-port";
import type { StorageManagerRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o StorageManagerRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultStorageManagerRuntimeAdapter
 * (Orchestrator + Classification Runtime estrutural via enterpriseDeps).
 */
export function createStorageManagerRuntimePort(
  options: StorageManagerRuntimeProviderOptions = {},
): StorageManagerRuntimePort {
  return createStorageManagerRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
