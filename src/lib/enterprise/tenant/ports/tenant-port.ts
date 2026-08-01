/**
 * TenantPort — contrato único de identidade organizacional (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-10A: fundação arquitetural genérica.
 * NÃO conhece usuários, autenticação, RBAC, permissões, contratos,
 * operadoras, Rule Packs, AI Providers, Storage, Document Identity ou Workflow.
 *
 * Tenant representa uma ORGANIZAÇÃO — nunca um tipo específico de negócio.
 */
import type {
  CreateTenantInput,
  CreateTenantResult,
  GetTenantInput,
  GetTenantResult,
  ListTenantsInput,
  ListTenantsResult,
  TenantCapabilities,
  TenantHealth,
  TenantProviderId,
} from "./types";

export interface TenantPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: TenantProviderId;

  /** Verificação leve de prontidão (sem alterar tenants). */
  health(): Promise<TenantHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TenantCapabilities;

  /** Cria / registra um Tenant canônico. */
  createTenant(input: CreateTenantInput): Promise<CreateTenantResult>;

  /** Obtém um Tenant por TenantId. */
  getTenant(input: GetTenantInput): Promise<GetTenantResult>;

  /** Lista Tenants (filtros estruturais opcionais). */
  listTenants(input?: ListTenantsInput): Promise<ListTenantsResult>;
}
