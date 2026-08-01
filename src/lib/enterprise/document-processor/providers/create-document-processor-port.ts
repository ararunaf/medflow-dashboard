/**
 * Provider / factory do DocumentProcessorPort — inversão de dependência (EPC-13).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultDocumentProcessorAdapter.
 */
import { createDocumentProcessorFactory } from "../factory/document-processor-factory";
import type { DocumentProcessorPort } from "../ports/document-processor-port";
import type { DocumentProcessorProviderOptions } from "../ports/types";

/**
 * Cria o DocumentProcessorPort para o provedor solicitado.
 *
 * Default de produção: DefaultDocumentProcessorAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createDocumentProcessorPort(
  options: DocumentProcessorProviderOptions = {},
): DocumentProcessorPort {
  return createDocumentProcessorFactory().create(options);
}
