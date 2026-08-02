/**
 * DocumentSearchRuntimeProvider — factory do Port (DIP-06).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 *
 * Default: DefaultDocumentSearchRuntimeAdapter (exige enterpriseDeps).
 */
import { createDocumentSearchRuntimeFactory } from "../factory/document-search-runtime-factory";
import type { DocumentSearchRuntimePort } from "../ports/document-search-runtime-port";
import type { DocumentSearchRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o DocumentSearchRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultDocumentSearchRuntimeAdapter
 * (Orchestrator + Storage Manager Runtime estrutural via enterpriseDeps).
 */
export function createDocumentSearchRuntimePort(
  options: DocumentSearchRuntimeProviderOptions = {},
): DocumentSearchRuntimePort {
  return createDocumentSearchRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
