/**
 * Provider / factory do ProcessingProviderPort — inversão de dependência (EPC-14).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultProcessingProviderAdapter.
 */
import { createProcessingProviderFactory } from "../factory/processing-provider-factory";
import type { ProcessingProviderPort } from "../ports/processing-provider-port";
import type { ProcessingProviderProviderOptions } from "../ports/types";

/**
 * Cria o ProcessingProviderPort para o mecanismo solicitado.
 *
 * Default de produção: DefaultProcessingProviderAdapter (registry in-process).
 * Mecanismos futuros (database / remote) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createProcessingProviderPort(
  options: ProcessingProviderProviderOptions = {},
): ProcessingProviderPort {
  return createProcessingProviderFactory().create(options);
}
