/**
 * DocumentClassificationRuntimeProvider — factory do Port (DIP-04).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 *
 * Default: DefaultDocumentClassificationRuntimeAdapter (exige enterpriseDeps).
 */
import { createDocumentClassificationRuntimeFactory } from "../factory/document-classification-runtime-factory";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { DocumentClassificationRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o DocumentClassificationRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultDocumentClassificationRuntimeAdapter
 * (Orchestrator + OCR Runtime estrutural via enterpriseDeps).
 */
export function createDocumentClassificationRuntimePort(
  options: DocumentClassificationRuntimeProviderOptions = {},
): DocumentClassificationRuntimePort {
  return createDocumentClassificationRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
