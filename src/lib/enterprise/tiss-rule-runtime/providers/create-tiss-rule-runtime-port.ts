/**
 * Provider / factory do TISSRuleRuntimePort — inversão de dependência (EPC-23 / FASE 5).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultTISSRuleRuntimeAdapter.
 */
import { createTISSRuleRuntimeFactory } from "../factory/tiss-rule-runtime-factory";
import type { TISSRuleRuntimePort } from "../ports/tiss-rule-runtime-port";
import type { TISSRuleRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o TISSRuleRuntimePort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultTISSRuleRuntimeAdapter
 * (store in-process).
 */
export function createTISSRuleRuntimePort(
  options: TISSRuleRuntimeProviderOptions = {},
): TISSRuleRuntimePort {
  return createTISSRuleRuntimeFactory().create(options);
}
