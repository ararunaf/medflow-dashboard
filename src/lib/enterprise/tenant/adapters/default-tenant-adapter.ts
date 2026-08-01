/**
 * DefaultTenantAdapter — adapter default de Tenant Foundation (EPC-10A).
 *
 * Encapsula o Default Tenant Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Auth / UI / APIs.
 * NÃO implementa usuários, RBAC, Rule Packs ou associações (EPC-10B).
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
} from "../ports/types";
import { DefaultTenantStore, type TenantStore } from "../store";

export const DEFAULT_TENANT_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultTenantRuntime = {
  /** Store ativo. Default: DefaultTenantStore in-process. */
  store?: TenantStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultTenantRuntime {
  return {
    store: new DefaultTenantStore(),
  };
}

function nowIso(runtime: DefaultTenantRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultTenantAdapter implements TenantPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultTenantRuntime;
  private readonly store: TenantStore;

  constructor(runtime: DefaultTenantRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultTenantStore();
  }

  capabilities(): TenantCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_TENANT_ADAPTER_ID,
      supportsCreateTenant: true,
      supportsGetTenant: true,
      supportsListTenants: true,
      supportsMetadataReference: true,
      supportsConfigurationReference: true,
      supportsOrganizationTypes: true,
    };
  }

  async health(): Promise<TenantHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ?? (probe.ok ? "Default tenant probe ok." : "Default tenant probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultTenantStore pronto (sem I/O externo — EPC-10A).",
    };
  }

  async createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
    const stamp = nowIso(this.runtime);
    const tenantId = input.tenant.tenantId ?? this.runtime.createId?.() ?? createTenantUuid();
    const existing = this.store.getTenant(tenantId);

    const tenant: Tenant = {
      ...input.tenant,
      tenantId,
      createdAt: existing?.createdAt ?? input.tenant.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.tenant.status ?? existing?.status ?? "draft",
    };

    this.store.setTenant(tenant);
    return {
      ok: true,
      tenantId,
      tenant,
      message: existing ? "tenant updated" : "tenant created",
    };
  }

  async getTenant(input: GetTenantInput): Promise<GetTenantResult> {
    const tenant = this.store.getTenant(input.tenantId);
    if (!tenant) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, tenant };
  }

  async listTenants(input: ListTenantsInput = {}): Promise<ListTenantsResult> {
    const tenants = this.store.listTenants().filter((tenant) => matchesList(tenant, input));
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
