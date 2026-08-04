/**
 * DocumentClassificationRuntimeProvider — factory pública do DocumentClassificationRuntimePort
 * (F3-CAP-06 + DIP-04/CLASS-01 preservado).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  DocumentClassificationRuntimeFactory,
  createDocumentClassificationRuntimeFactory,
} from "../factory/document-classification-runtime-factory";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { DocumentClassificationRuntimeOptions } from "../ports/types";

let sharedFactory: DocumentClassificationRuntimeFactory | undefined;

function getSharedFactory(): DocumentClassificationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createDocumentClassificationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o DocumentClassificationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-06 oficial).
 * DIP-04/CLASS-01 preservado: enterpriseDeps.getOrchestratorPort + getOCRRuntimePort +
 * getDocumentClassificationProviderPort habilitam coordinateClassification()/classify()
 * reais quando presentes.
 */
export function createDocumentClassificationRuntimePort(
  options: DocumentClassificationRuntimeOptions = {},
): DocumentClassificationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getDocumentClassificationRuntimeFactory(): DocumentClassificationRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getDocumentClassificationRuntimePort().
 */
export function getDocumentClassificationRuntimePort(
  options: DocumentClassificationRuntimeOptions = {},
): DocumentClassificationRuntimePort {
  return createDocumentClassificationRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-06). */
export const DocumentClassificationRuntimeProvider = {
  create: createDocumentClassificationRuntimePort,
  get: getDocumentClassificationRuntimePort,
  getFactory: getDocumentClassificationRuntimeFactory,
};
