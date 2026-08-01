/**
 * MockTenantAdapter — EPC-10A.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 */
import { createTenantUuid } from "../ports/organization";
import type { TenantPort } from "../ports/tenant-port";
import type {
  CreateTenantInput,
  CreateTenantResult,
  GetTenantInput,
  GetTenantResult,
  ListTenantsInput,
  ListTenantsResult,
  Tenant,
  TenantCapabilities,
  TenantHealth,
  TenantProviderId,
} from "../ports/types";

export type MockTenantAdapterOptions = {
  provider?: Extract<TenantProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  tenants?: readonly Tenant[];
  createId?: () => string;
  now?: () => string;
};

export class MockTenantAdapter implements TenantPort {
  readonly providerId: Extract<TenantProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly tenants = new Map<string, Tenant>();
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: MockTenantAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} tenant ready.`;
    this.createId = options.createId ?? createTenantUuid;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const tenant of options.tenants ?? []) {
      this.tenants.set(tenant.tenantId, tenant);
    }
  }

  capabilities(): TenantCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsCreateTenant: true,
      supportsGetTenant: true,
      supportsListTenants: true,
      supportsMetadataReference: true,
      supportsConfigurationReference: true,
      supportsOrganizationTypes: true,
    };
  }

  async health(): Promise<TenantHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
    const stamp = this.now();
    const tenantId = input.tenant.tenantId ?? this.createId();
    const existing = this.tenants.get(tenantId);

    const tenant: Tenant = {
      ...input.tenant,
      tenantId,
      createdAt: existing?.createdAt ?? input.tenant.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.tenant.status ?? existing?.status ?? "draft",
    };

    this.tenants.set(tenantId, tenant);
    return {
      ok: true,
      tenantId,
      tenant,
      message: existing ? "tenant updated" : "tenant created",
    };
  }

  async getTenant(input: GetTenantInput): Promise<GetTenantResult> {
    const tenant = this.tenants.get(input.tenantId);
    if (!tenant) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, tenant };
  }

  async listTenants(input: ListTenantsInput = {}): Promise<ListTenantsResult> {
    const tenants = [...this.tenants.values()].filter((tenant) => matchesList(tenant, input));
    return { ok: true, tenants };
  }
}

function matchesList(tenant: Tenant, input: ListTenantsInput): boolean {
  if (input.organizationType != null && tenant.organizationType !== input.organizationType) {
    return false;
  }
  if (input.status != null && tenant.status !== input.status) return false;
  if (input.tag != null && !(tenant.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !tenant.tenantId.startsWith(input.idPrefix)) return false;
  if (input.code != null && tenant.code !== input.code) return false;
  if (input.externalId != null && tenant.externalId !== input.externalId) return false;
  return true;
}
