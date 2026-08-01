/**
 * Provider / factory do AIAuditorPort — inversão de dependência (EPC-18 / FASE 5).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultMockAIAuditorAdapter.
 */
import { createAIAuditorFactory } from "../factory/ai-auditor-factory";
import type { AIAuditorPort } from "../ports/ai-auditor-port";
import type { AIAuditorProviderOptions } from "../ports/types";

/**
 * Cria o AIAuditorPort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultMockAIAuditorAdapter
 * (store + AI Orchestrator EPC-16).
 */
export function createAIAuditorPort(options: AIAuditorProviderOptions = {}): AIAuditorPort {
  return createAIAuditorFactory().create(options);
}
