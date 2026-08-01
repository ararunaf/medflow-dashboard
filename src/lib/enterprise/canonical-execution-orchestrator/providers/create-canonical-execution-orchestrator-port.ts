/**
 * Provider / factory do CanonicalExecutionOrchestratorPort — inversão de dependência (EPC-24).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultCanonicalExecutionOrchestratorAdapter.
 */
import { createCanonicalExecutionOrchestratorFactory } from "../factory/canonical-execution-orchestrator-factory";
import type { CanonicalExecutionOrchestratorPort } from "../ports/canonical-execution-orchestrator-port";
import type { CanonicalExecutionOrchestratorProviderOptions } from "../ports/types";

/**
 * Cria o CanonicalExecutionOrchestratorPort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultCanonicalExecutionOrchestratorAdapter
 * (store in-process).
 */
export function createCanonicalExecutionOrchestratorPort(
  options: CanonicalExecutionOrchestratorProviderOptions = {},
): CanonicalExecutionOrchestratorPort {
  return createCanonicalExecutionOrchestratorFactory().create(options);
}
