/**
 * Provider / factory do TenantPort — inversão de dependência (EPC-10A).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultTenantAdapter.
 */
import { createTenantFactory } from "../factory/tenant-factory";
import type { TenantPort } from "../ports/tenant-port";
import type { TenantProviderOptions } from "../ports/types";

/**
 * Cria o TenantPort para o provedor solicitado.
 *
 * Default de produção: DefaultTenantAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createTenantPort(options: TenantProviderOptions = {}): TenantPort {
  return createTenantFactory().create(options);
}
