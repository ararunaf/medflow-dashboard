/**
 * UploadRuntimeProvider — factory pública do UploadRuntimePort (F3-CAP-03).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  UploadRuntimeFactory,
  createUploadRuntimeFactory,
} from "../factory/upload-runtime-factory";
import type { UploadRuntimePort } from "../ports/upload-runtime-port";
import type { UploadRuntimeOptions } from "../ports/types";

let sharedFactory: UploadRuntimeFactory | undefined;

function getSharedFactory(): UploadRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createUploadRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o UploadRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-03 oficial).
 */
export function createUploadRuntimePort(options: UploadRuntimeOptions = {}): UploadRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getUploadRuntimeFactory(): UploadRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getUploadRuntimePort().
 */
export function getUploadRuntimePort(options: UploadRuntimeOptions = {}): UploadRuntimePort {
  return createUploadRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-03). */
export const UploadRuntimeProvider = {
  create: createUploadRuntimePort,
  get: getUploadRuntimePort,
  getFactory: getUploadRuntimeFactory,
};
