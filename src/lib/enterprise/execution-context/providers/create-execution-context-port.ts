/**
 * Provider / factory do ExecutionContextPort — inversão de dependência (EPC-24 Sprint 03).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultExecutionContextAdapter.
 */
import { createExecutionContextFactory } from "../factory/execution-context-factory";
import type { ExecutionContextPort } from "../ports/execution-context-port";
import type { ExecutionContextProviderOptions } from "../ports/types";

/**
 * Cria o ExecutionContextPort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultExecutionContextAdapter
 * (store in-process).
 */
export function createExecutionContextPort(
  options: ExecutionContextProviderOptions = {},
): ExecutionContextPort {
  return createExecutionContextFactory().create(options);
}
