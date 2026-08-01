/**
 * Enterprise Tenant Foundation — Ports & Adapters (EPC-10A).
 *
 * Fluxo oficial:
 *   Application → TenantPort → TenantAdapter
 *     → TenantStore → TenantFactory → TenantProvider
 *
 * Domain/Application NÃO devem importar usuários, autenticação, RBAC,
 * permissões, contratos, operadoras, Rule Packs, Storage ou Workflow.
 *
 * Tenant representa uma ORGANIZAÇÃO genérica.
 * Especializações de domínio e associações operacionais ficam na EPC-10B.
 */
export type {
  CreateTenantInput,
  CreateTenantResult,
  GetTenantInput,
  GetTenantResult,
  ListTenantsInput,
  ListTenantsResult,
  OrganizationName,
  OrganizationType,
  Tenant,
  TenantCapabilities,
  TenantCode,
  TenantConfigurationReference,
  TenantDeclaredCapability,
  TenantDisplayName,
  TenantExternalId,
  TenantHealth,
  TenantId,
  TenantMetadataReference,
  TenantPort,
  TenantProviderId,
  TenantProviderOptions,
  TenantStatus,
  TenantTag,
  TenantVersion,
} from "./ports";

export {
  ORGANIZATION_TYPES,
  TENANT_STATUSES,
  createTenantUuid,
  isOrganizationType,
  listOrganizationTypes,
} from "./ports";

export {
  DEFAULT_TENANT_ADAPTER_ID,
  DefaultTenantAdapter,
  MockTenantAdapter,
  type DefaultTenantRuntime,
  type MockTenantAdapterOptions,
} from "./adapters";

export {
  DEFAULT_TENANT_STORE_ID,
  DefaultTenantStore,
  type DefaultTenantStoreOptions,
  type StoredTenant,
  type TenantStore,
} from "./store";

export { TenantFactory, createTenantFactory, type TenantFactoryOptions } from "./factory";

export { createTenantPort } from "./providers";

export { getTenantHealthSummary, type TenantHealthSummary } from "./demo";
