/**
 * Provider / factory pública do OCRProviderPort — inversão de dependência (EPC-15).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor diretamente no Domain.
 */
import { OCRProviderFactory, createOCRProviderFactory } from "../factory/ocr-provider-factory";
import type { OCRProviderPort } from "../ports/ocr-provider-port";
import type { OCRProviderOptions } from "../ports/types";

let sharedFactory: OCRProviderFactory | undefined;

function getSharedFactory(): OCRProviderFactory {
  if (!sharedFactory) {
    sharedFactory = createOCRProviderFactory();
  }
  return sharedFactory;
}

/**
 * Cria o OCRProviderPort para o provedor solicitado.
 *
 * Default da factory: `mock`. O Enterprise Runtime (OCR-01) resolve `azure`.
 */
export function createOCRProviderPort(options: OCRProviderOptions = {}): OCRProviderPort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getOCRProviderFactory(): OCRProviderFactory {
  return getSharedFactory();
}
