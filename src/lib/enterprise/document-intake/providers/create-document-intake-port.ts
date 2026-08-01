/**
 * Provider / factory do DocumentIntakePort — inversão de dependência (EPC-12).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultDocumentIntakeAdapter.
 */
import { createDocumentIntakeFactory } from "../factory/document-intake-factory";
import type { DocumentIntakePort } from "../ports/document-intake-port";
import type { DocumentIntakeProviderOptions } from "../ports/types";

/**
 * Cria o DocumentIntakePort para o provedor solicitado.
 *
 * Default de produção: DefaultDocumentIntakeAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createDocumentIntakePort(
  options: DocumentIntakeProviderOptions = {},
): DocumentIntakePort {
  return createDocumentIntakeFactory().create(options);
}
