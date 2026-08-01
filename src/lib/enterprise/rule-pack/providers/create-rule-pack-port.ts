/**
 * Provider / factory do RulePackPort — inversão de dependência (EPC-09).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultRulePackAdapter.
 */
import { createRulePackFactory } from "../factory/rule-pack-factory";
import type { RulePackPort } from "../ports/rule-pack-port";
import type { RulePackProviderOptions } from "../ports/types";

/**
 * Cria o RulePackPort para o provedor solicitado.
 *
 * Default de produção: DefaultRulePackAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createRulePackPort(options: RulePackProviderOptions = {}): RulePackPort {
  return createRulePackFactory().create(options);
}
