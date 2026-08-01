/**
 * Enterprise Rule Pack Management — Ports & Adapters (EPC-09).
 *
 * Fluxo oficial:
 *   Application → RulePackPort → RulePackAdapter
 *     → RulePackStore → RulePackFactory → RulePackProvider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, operadoras,
 * cooperativas, contratos, guias, pacientes, OCR, IA ou Workflow de produto.
 *
 * Rule Pack é apenas um contêiner versionado de regras.
 * Especializações de domínio ficam FORA deste componente.
 */
export type {
  CreatePackInput,
  CreatePackResult,
  DisablePackInput,
  DisablePackResult,
  EnablePackInput,
  EnablePackResult,
  GetPackInput,
  GetPackResult,
  ListPacksInput,
  ListPacksResult,
  PackId,
  RulePack,
  RulePackAuthor,
  RulePackCapabilities,
  RulePackCompatibility,
  RulePackDeclaredCapability,
  RulePackDependency,
  RulePackHealth,
  RulePackLifecycle,
  RulePackMetadataReference,
  RulePackName,
  RulePackPort,
  RulePackPriority,
  RulePackProviderId,
  RulePackProviderOptions,
  RulePackStatus,
  RulePackTag,
  RulePackVersion,
  RulePackVersionInfo,
  RuleReference,
} from "./ports";

export {
  RULE_PACK_LIFECYCLES,
  RULE_PACK_PRIORITIES,
  RULE_PACK_STATUSES,
  areRequiredDependenciesPresent,
  createPackId,
  defineDependency,
  defineVersionChain,
  dependsOn,
  getDependencyCount,
  getVersionInfo,
  hasLifecycle,
  hasVersionChain,
  listDependencyPackIds,
  partitionDependencies,
  withVersionInfo,
} from "./ports";

export {
  DEFAULT_RULE_PACK_ADAPTER_ID,
  DefaultRulePackAdapter,
  MockRulePackAdapter,
  type DefaultRulePackRuntime,
  type MockRulePackAdapterOptions,
} from "./adapters";

export {
  DEFAULT_RULE_PACK_STORE_ID,
  DefaultRulePackStore,
  type DefaultRulePackStoreOptions,
  type RulePackStore,
  type StoredRulePack,
} from "./store";

export { RulePackFactory, createRulePackFactory, type RulePackFactoryOptions } from "./factory";

export { createRulePackPort } from "./providers";

export { getRulePackHealthSummary, type RulePackHealthSummary } from "./demo";
