/**
 * OCRRuntimeProvider — factory pública do OCRRuntimePort (F3-CAP-05 + DIP-03 preservado).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { OCRRuntimeFactory, createOCRRuntimeFactory } from "../factory/ocr-runtime-factory";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { OCRRuntimeOptions } from "../ports/types";

let sharedFactory: OCRRuntimeFactory | undefined;

function getSharedFactory(): OCRRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createOCRRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o OCRRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-05 oficial).
 * DIP-03 preservado: enterpriseDeps.getOrchestratorPort + getOCRProviderPort
 * habilitam coordinateOcr()/process() reais quando presentes.
 */
export function createOCRRuntimePort(options: OCRRuntimeOptions = {}): OCRRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getOCRRuntimeFactory(): OCRRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getOCRRuntimePort().
 */
export function getOCRRuntimePort(options: OCRRuntimeOptions = {}): OCRRuntimePort {
  return createOCRRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-05). */
export const OCRRuntimeProvider = {
  create: createOCRRuntimePort,
  get: getOCRRuntimePort,
  getFactory: getOCRRuntimeFactory,
};
