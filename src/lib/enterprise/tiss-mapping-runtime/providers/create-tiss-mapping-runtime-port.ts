/**
 * TISSMappingRuntimeProvider — factory pública do TISSMappingRuntimePort (F3-CAP-11).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  TISSMappingRuntimeFactory,
  createTISSMappingRuntimeFactory,
} from "../factory/tiss-mapping-runtime-factory";
import type { TISSMappingRuntimePort } from "../ports/tiss-mapping-runtime-port";
import type { TISSMappingRuntimeOptions } from "../ports/types";

let sharedFactory: TISSMappingRuntimeFactory | undefined;

function getSharedFactory(): TISSMappingRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createTISSMappingRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o TISSMappingRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-11 oficial).
 */
export function createTISSMappingRuntimePort(
  options: TISSMappingRuntimeOptions = {},
): TISSMappingRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getTISSMappingRuntimeFactory(): TISSMappingRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getTISSMappingRuntimePort().
 */
export function getTISSMappingRuntimePort(
  options: TISSMappingRuntimeOptions = {},
): TISSMappingRuntimePort {
  return createTISSMappingRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-11). */
export const TISSMappingRuntimeProvider = {
  create: createTISSMappingRuntimePort,
  get: getTISSMappingRuntimePort,
  getFactory: getTISSMappingRuntimeFactory,
};
