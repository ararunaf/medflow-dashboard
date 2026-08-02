/**
 * Provider / factory pública do DocumentClassificationProviderPort (CLASS-01).
 *
 * Application / Classification Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  DocumentClassificationProviderFactory,
  createDocumentClassificationProviderFactory,
} from "../factory/document-classification-provider-factory";
import type { DocumentClassificationProviderPort } from "../ports/document-classification-provider-port";
import type { DocumentClassificationProviderOptions } from "../ports/types";

let sharedFactory: DocumentClassificationProviderFactory | undefined;

function getSharedFactory(): DocumentClassificationProviderFactory {
  if (!sharedFactory) {
    sharedFactory = createDocumentClassificationProviderFactory();
  }
  return sharedFactory;
}

/**
 * Cria o DocumentClassificationProviderPort para o provedor solicitado.
 *
 * Default da factory: `rule-based` (CLASS-01 oficial).
 */
export function createDocumentClassificationProviderPort(
  options: DocumentClassificationProviderOptions = {},
): DocumentClassificationProviderPort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getDocumentClassificationProviderFactory(): DocumentClassificationProviderFactory {
  return getSharedFactory();
}
