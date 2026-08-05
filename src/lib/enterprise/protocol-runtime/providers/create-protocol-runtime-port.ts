/**
 * ProtocolRuntimeProvider — factory pública do ProtocolRuntimePort (C-07).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  ProtocolRuntimeFactory,
  createProtocolRuntimeFactory,
} from "../factory/protocol-runtime-factory";
import type { ProtocolRuntimePort } from "../ports/protocol-runtime-port";
import type { ProtocolRuntimeOptions } from "../ports/types";

let sharedFactory: ProtocolRuntimeFactory | undefined;

function getSharedFactory(): ProtocolRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createProtocolRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ProtocolRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-07 oficial).
 */
export function createProtocolRuntimePort(
  options: ProtocolRuntimeOptions = {},
): ProtocolRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getProtocolRuntimeFactory(): ProtocolRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getProtocolRuntimePort().
 */
export function getProtocolRuntimePort(options: ProtocolRuntimeOptions = {}): ProtocolRuntimePort {
  return createProtocolRuntimePort(options);
}

/** Alias explícito do Provider (C-07). */
export const ProtocolRuntimeProvider = {
  create: createProtocolRuntimePort,
  get: getProtocolRuntimePort,
  getFactory: getProtocolRuntimeFactory,
};
