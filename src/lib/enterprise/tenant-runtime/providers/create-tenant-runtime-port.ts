/**
 * TenantRuntimeProvider — factory pública do TenantRuntimePort (S3-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  TenantRuntimeFactory,
  createTenantRuntimeFactory,
} from "../factory/tenant-runtime-factory";
import type { TenantRuntimePort } from "../ports/tenant-runtime-port";
import type { TenantRuntimeOptions } from "../ports/types";

let sharedFactory: TenantRuntimeFactory | undefined;

function getSharedFactory(): TenantRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createTenantRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o TenantRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (S3-02 oficial).
 */
export function createTenantRuntimePort(options: TenantRuntimeOptions = {}): TenantRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getTenantRuntimeFactory(): TenantRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getTenantRuntimePort().
 */
export function getTenantRuntimePort(options: TenantRuntimeOptions = {}): TenantRuntimePort {
  return createTenantRuntimePort(options);
}

/** Alias explícito do Provider (S3-02). */
export const TenantRuntimeProvider = {
  create: createTenantRuntimePort,
  get: getTenantRuntimePort,
  getFactory: getTenantRuntimeFactory,
};
