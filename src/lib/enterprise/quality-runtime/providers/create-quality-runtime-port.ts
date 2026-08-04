/**
 * QualityRuntimeProvider — factory pública do QualityRuntimePort (F3-CAP-13).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  QualityRuntimeFactory,
  createQualityRuntimeFactory,
} from "../factory/quality-runtime-factory";
import type { QualityRuntimePort } from "../ports/quality-runtime-port";
import type { QualityRuntimeOptions } from "../ports/types";

let sharedFactory: QualityRuntimeFactory | undefined;

function getSharedFactory(): QualityRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createQualityRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o QualityRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-13 oficial).
 */
export function createQualityRuntimePort(options: QualityRuntimeOptions = {}): QualityRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getQualityRuntimeFactory(): QualityRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getQualityRuntimePort().
 */
export function getQualityRuntimePort(options: QualityRuntimeOptions = {}): QualityRuntimePort {
  return createQualityRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-13). */
export const QualityRuntimeProvider = {
  create: createQualityRuntimePort,
  get: getQualityRuntimePort,
  getFactory: getQualityRuntimeFactory,
};
