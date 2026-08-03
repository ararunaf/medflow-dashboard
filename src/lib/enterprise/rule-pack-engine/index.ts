/**
 * Enterprise Rule Pack Engine — Ports & Adapters (TISS-03).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → DefaultRulePackEngineAdapter → InMemoryRulePackEngineStore
 *
 * TISS-03: mecanismo genérico de interpretação/execução de Rule Packs.
 * Sem XML real. Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem regras de negócio específicas. Sem acesso direto ao Rule Pack Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Conhecimento TISS exclusivamente via TISSCatalogPort.
 */
export type {
  CanonicalRule,
  CanonicalRuleAction,
  CanonicalRuleCondition,
  CanonicalRuleExecution,
  CanonicalRuleExecutionResult,
  CanonicalRuleExecutionStatus,
  CanonicalRuleFinding,
  CanonicalRulePack,
  CanonicalRulePackStatus,
  CanonicalRuleSeverity,
  CanonicalRuleStatus,
  ExecutePackInput,
  ExecutePackResult,
  GetExecutionInput,
  GetExecutionResult,
  InterpretPackInput,
  InterpretPackResult,
  ListExecutionsInput,
  ListExecutionsResult,
  ListPacksInput,
  ListPacksResult,
  LoadPackInput,
  LoadPackResult,
  RulePackEngineCapabilities,
  RulePackEngineEnterpriseDeps,
  RulePackEngineHealth,
  RulePackEngineInfo,
  RulePackEngineOperationEnvelope,
  RulePackEngineOperationalControls,
  RulePackEngineOptions,
  RulePackEnginePort,
  RulePackEnginePortCapabilities,
  RulePackEngineProviderId,
  RulePackEngineProviderMetadata,
  RulePackEngineRegistration,
  RulePackEngineStatus,
  RulePackEngineStructuredLog,
  RulePackEngineTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES,
  DEFAULT_RULE_PACK_ENGINE_CAPABILITIES,
  createRulePackEngineRequestId,
  createRulePackExecutionId,
  createRulePackFindingId,
  createRulePackId,
  defineRulePackEngineCapabilities,
  emptyRulePackEngineCapabilities,
  resetRulePackEngineIdSequences,
} from "./ports";

export {
  DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID,
  DEFAULT_RULE_PACK_ENGINE_VERSION,
  DEFAULT_MOCK_RULE_PACK_ENGINE_VERSION,
  DefaultRulePackEngineAdapter,
  EnterpriseRulePackEngineAdapter,
  MOCK_RULE_PACK_ENGINE_ADAPTER_ID,
  MockRulePackEngineAdapter,
  type DefaultRulePackEngineAdapterOptions,
  type MockRulePackEngineAdapterOptions,
} from "./adapters";

export {
  RulePackEngineFactory,
  createRulePackEngineFactory,
  type RulePackEngineFactoryOptions,
} from "./factory";

export {
  BUILTIN_RULE_PACK_ENGINE_PROVIDER_COUNT,
  RulePackEngineRegistry,
  createDefaultRulePackEngineRegistry,
  type RulePackEngineRegistrySnapshot,
} from "./registry";

export {
  DEFAULT_STRUCTURAL_RULE_PACK_CODE,
  IN_MEMORY_RULE_PACK_ENGINE_STORE_ID,
  InMemoryRulePackEngineStore,
  MINIMAL_STRUCTURAL_RULE_PACKS,
  type InMemoryRulePackEngineStoreOptions,
  type RulePackEngineStore,
} from "./store";

export {
  RulePackEngineProvider,
  createRulePackEnginePort,
  getRulePackEngineFactory,
} from "./providers";

export { getRulePackEngineHealthSummary, type RulePackEngineHealthSummary } from "./demo";
