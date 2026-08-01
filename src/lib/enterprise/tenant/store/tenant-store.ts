/**
 * TenantStore — contrato interno do store (EPC-10A).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO armazena usuários ou permissões.
 */
import type { Tenant } from "../ports/types";

export type StoredTenant = Tenant;

export interface TenantStore {
  readonly storeId: string;

  getTenant(tenantId: string): StoredTenant | undefined;
  setTenant(tenant: StoredTenant): void;
  listTenants(): readonly StoredTenant[];
  removeTenant(tenantId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
