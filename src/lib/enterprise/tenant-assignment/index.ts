/**
 * Enterprise Tenant Assignment Objects — Ports & Adapters (EPC-10B).
 *
 * Fluxo oficial:
 *   Application → TenantAssignmentPort → TenantAssignmentAdapter
 *     → TenantAssignmentStore → TenantAssignmentFactory → TenantAssignmentProvider
 *
 * Domain/Application NÃO devem importar usuários, autenticação, RBAC,
 * permissões, contratos, operadoras, regras clínicas, TISS ou Workflow.
 *
 * Assignment representa uma ASSOCIAÇÃO CANÔNICA entre Tenant e outro
 * componente Enterprise. Nunca configuração, regra ou vínculo operacional.
 * Nenhuma ligação operacional é implementada nesta sprint.
 */
export type {
  AssignmentId,
  AssignmentMetadataReference,
  AssignmentPriority,
  AssignmentStatus,
  AssignmentTag,
  AssignmentVersion,
  CreateAssignmentInput,
  CreateAssignmentResult,
  GetAssignmentInput,
  GetAssignmentResult,
  ListAssignmentsInput,
  ListAssignmentsResult,
  TargetReference,
  TenantAIProviderAssignment,
  TenantAssignment,
  TenantAssignmentCapabilities,
  TenantAssignmentFields,
  TenantAssignmentHealth,
  TenantAssignmentKind,
  TenantAssignmentPort,
  TenantAssignmentProviderId,
  TenantAssignmentProviderOptions,
  TenantConfigurationAssignment,
  TenantDocumentAssignment,
  TenantReference,
  TenantRulePackAssignment,
  TenantStorageAssignment,
} from "./ports";

export {
  ASSIGNMENT_STATUSES,
  TENANT_ASSIGNMENT_KINDS,
  createAssignmentUuid,
  isAssignmentStatus,
  isTenantAssignmentKind,
  listAssignmentStatuses,
  listTenantAssignmentKinds,
} from "./ports";

export {
  DEFAULT_TENANT_ASSIGNMENT_ADAPTER_ID,
  DefaultTenantAssignmentAdapter,
  MockTenantAssignmentAdapter,
  type DefaultTenantAssignmentRuntime,
  type MockTenantAssignmentAdapterOptions,
} from "./adapters";

export {
  DEFAULT_TENANT_ASSIGNMENT_STORE_ID,
  DefaultTenantAssignmentStore,
  type DefaultTenantAssignmentStoreOptions,
  type StoredTenantAssignment,
  type TenantAssignmentStore,
} from "./store";

export {
  TenantAssignmentFactory,
  createTenantAssignmentFactory,
  type TenantAssignmentFactoryOptions,
} from "./factory";

export { createTenantAssignmentPort } from "./providers";

export { getTenantAssignmentHealthSummary, type TenantAssignmentHealthSummary } from "./demo";
