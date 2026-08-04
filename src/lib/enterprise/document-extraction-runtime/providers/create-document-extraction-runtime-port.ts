/**
 * DocumentExtractionRuntimeProvider — factory pública do DocumentExtractionRuntimePort (F3-CAP-07).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  DocumentExtractionRuntimeFactory,
  createDocumentExtractionRuntimeFactory,
} from "../factory/document-extraction-runtime-factory";
import type { DocumentExtractionRuntimePort } from "../ports/document-extraction-runtime-port";
import type { DocumentExtractionRuntimeOptions } from "../ports/types";

let sharedFactory: DocumentExtractionRuntimeFactory | undefined;

function getSharedFactory(): DocumentExtractionRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createDocumentExtractionRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o DocumentExtractionRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-07 oficial).
 */
export function createDocumentExtractionRuntimePort(
  options: DocumentExtractionRuntimeOptions = {},
): DocumentExtractionRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getDocumentExtractionRuntimeFactory(): DocumentExtractionRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getDocumentExtractionRuntimePort().
 */
export function getDocumentExtractionRuntimePort(
  options: DocumentExtractionRuntimeOptions = {},
): DocumentExtractionRuntimePort {
  return createDocumentExtractionRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-07). */
export const DocumentExtractionRuntimeProvider = {
  create: createDocumentExtractionRuntimePort,
  get: getDocumentExtractionRuntimePort,
  getFactory: getDocumentExtractionRuntimeFactory,
};
