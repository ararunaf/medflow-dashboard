/**
 * DefaultTenantStore — store in-process padrão (EPC-10A).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { StoredTenant, TenantStore } from "./tenant-store";

export const DEFAULT_TENANT_STORE_ID = "default-in-process";

export type DefaultTenantStoreOptions = {
  tenants?: readonly StoredTenant[];
};

export class DefaultTenantStore implements TenantStore {
  readonly storeId = DEFAULT_TENANT_STORE_ID;

  private readonly tenants = new Map<string, StoredTenant>();

  constructor(options: DefaultTenantStoreOptions = {}) {
    for (const tenant of options.tenants ?? []) {
      this.tenants.set(tenant.tenantId, tenant);
    }
  }

  getTenant(tenantId: string): StoredTenant | undefined {
    return this.tenants.get(tenantId);
  }

  setTenant(tenant: StoredTenant): void {
    this.tenants.set(tenant.tenantId, tenant);
  }

  listTenants(): readonly StoredTenant[] {
    return [...this.tenants.values()];
  }

  removeTenant(tenantId: string): boolean {
    return this.tenants.delete(tenantId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultTenantStore ready (${this.tenants.size} tenants).`,
    };
  }
}
