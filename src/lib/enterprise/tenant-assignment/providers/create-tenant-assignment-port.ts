/**
 * Provider / factory do TenantAssignmentPort — inversão de dependência (EPC-10B).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor/store diretamente no Domain.
 *
 * Default: DefaultTenantAssignmentAdapter.
 */
import { createTenantAssignmentFactory } from "../factory/tenant-assignment-factory";
import type { TenantAssignmentPort } from "../ports/tenant-assignment-port";
import type { TenantAssignmentProviderOptions } from "../ports/types";

/**
 * Cria o TenantAssignmentPort para o provedor solicitado.
 *
 * Default de produção: DefaultTenantAssignmentAdapter (store in-process).
 * Provedores futuros (database / remote / registry) lançam erro explícito
 * até haver adapter dedicado — evita fallback silencioso.
 */
export function createTenantAssignmentPort(
  options: TenantAssignmentProviderOptions = {},
): TenantAssignmentPort {
  return createTenantAssignmentFactory().create(options);
}
