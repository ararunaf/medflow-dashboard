/**
 * Provider / factory do DocumentIdentityPort — inversão de dependência (EPC-08).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultDocumentIdentityAdapter.
 */
import { createDocumentIdentityFactory } from "../factory/document-identity-factory";
import type { DocumentIdentityPort } from "../ports/document-identity-port";
import type { DocumentIdentityProviderOptions } from "../ports/types";

/**
 * Cria o DocumentIdentityPort para o provedor solicitado.
 *
 * Default de produção: DefaultDocumentIdentityAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createDocumentIdentityPort(
  options: DocumentIdentityProviderOptions = {},
): DocumentIdentityPort {
  return createDocumentIdentityFactory().create(options);
}
