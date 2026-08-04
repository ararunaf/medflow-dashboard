/**
 * IntelligentCaptureRuntimeProvider — factory pública do IntelligentCaptureRuntimePort (F3-CAP-04).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  IntelligentCaptureRuntimeFactory,
  createIntelligentCaptureRuntimeFactory,
} from "../factory/intelligent-capture-runtime-factory";
import type { IntelligentCaptureRuntimePort } from "../ports/intelligent-capture-runtime-port";
import type { IntelligentCaptureRuntimeOptions } from "../ports/types";

let sharedFactory: IntelligentCaptureRuntimeFactory | undefined;

function getSharedFactory(): IntelligentCaptureRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createIntelligentCaptureRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o IntelligentCaptureRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-04 oficial).
 */
export function createIntelligentCaptureRuntimePort(
  options: IntelligentCaptureRuntimeOptions = {},
): IntelligentCaptureRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getIntelligentCaptureRuntimeFactory(): IntelligentCaptureRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getIntelligentCaptureRuntimePort().
 */
export function getIntelligentCaptureRuntimePort(
  options: IntelligentCaptureRuntimeOptions = {},
): IntelligentCaptureRuntimePort {
  return createIntelligentCaptureRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-04). */
export const IntelligentCaptureRuntimeProvider = {
  create: createIntelligentCaptureRuntimePort,
  get: getIntelligentCaptureRuntimePort,
  getFactory: getIntelligentCaptureRuntimeFactory,
};
