/**
 * Provider / factory do AIOrchestratorPort — inversão de dependência (EPC-16).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultAIOrchestratorAdapter.
 */
import { createAIOrchestratorFactory } from "../factory/ai-orchestrator-factory";
import type { AIOrchestratorPort } from "../ports/ai-orchestrator-port";
import type { AIOrchestratorProviderOptions } from "../ports/types";

/**
 * Cria o AIOrchestratorPort para o mecanismo solicitado.
 *
 * Default de produção: DefaultAIOrchestratorAdapter (store + EPC-07 registry).
 */
export function createAIOrchestratorPort(
  options: AIOrchestratorProviderOptions = {},
): AIOrchestratorPort {
  return createAIOrchestratorFactory().create(options);
}
