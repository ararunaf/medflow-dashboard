/**
 * Provider / factory do ContractRuleBindingPort — inversão de dependência (EPC-17).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultContractRuleBindingAdapter.
 */
import { createContractRuleBindingFactory } from "../factory/contract-rule-binding-factory";
import type { ContractRuleBindingPort } from "../ports/contract-rule-binding-port";
import type { ContractRuleBindingProviderOptions } from "../ports/types";

/**
 * Cria o ContractRuleBindingPort para o provedor solicitado.
 *
 * Default de produção: DefaultContractRuleBindingAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createContractRuleBindingPort(
  options: ContractRuleBindingProviderOptions = {},
): ContractRuleBindingPort {
  return createContractRuleBindingFactory().create(options);
}
