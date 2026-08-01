/**
 * Provider / factory do ContractPort — inversão de dependência (EPC-11).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultContractAdapter.
 */
import { createContractFactory } from "../factory/contract-factory";
import type { ContractPort } from "../ports/contract-port";
import type { ContractProviderOptions } from "../ports/types";

/**
 * Cria o ContractPort para o provedor solicitado.
 *
 * Default de produção: DefaultContractAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createContractPort(options: ContractProviderOptions = {}): ContractPort {
  return createContractFactory().create(options);
}
