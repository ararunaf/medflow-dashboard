/**
 * Enterprise Contract Rule Binding — Ports & Adapters (EPC-17).
 *
 * Fluxo oficial:
 *   Application → ContractRuleBindingPort → ContractRuleBindingAdapter
 *     → ContractRuleBindingStore → ContractRuleBindingFactory
 *     → ContractRuleBindingProvider
 *
 * Arquitetura de vinculação:
 *   Contract → Contract Rule Binding → Rule Pack → Rule Engine → Expression Engine
 *
 * Domain/Application NÃO devem importar Rule Engine, Expression Engine,
 * TISS, OCR, AI Auditor, Workflow operacional ou validação contratual.
 *
 * Binding representa uma ASSOCIAÇÃO CANÔNICA entre Contrato e Rule Pack.
 * Nunca executa regras. Nunca interpreta cláusulas.
 * Nenhuma validação contratual é implementada nesta sprint.
 */
export type {
  BindRulePackInput,
  BindRulePackResult,
  BindingConfigurationReference,
  BindingExecutionOrder,
  BindingId,
  BindingMetadataReference,
  BindingPolicy,
  BindingPriority,
  BindingStatus,
  BindingTag,
  BindingVersion,
  ContractReference,
  ContractRuleBinding,
  ContractRuleBindingCapabilities,
  ContractRuleBindingHealth,
  ContractRuleBindingPort,
  ContractRuleBindingProviderId,
  ContractRuleBindingProviderOptions,
  GetBindingInput,
  GetBindingResult,
  ListBindingsInput,
  ListBindingsResult,
  RulePackReference,
  UnbindRulePackInput,
  UnbindRulePackResult,
} from "./ports";

export {
  BINDING_POLICIES,
  BINDING_STATUSES,
  createBindingId,
  defineBindingConfigurationReference,
  defineBindingMetadataReference,
  defineContractReference,
  defineRulePackReference,
  isBindingPolicy,
  isBindingStatus,
  listBindingPolicies,
  listBindingStatuses,
} from "./ports";

export {
  DEFAULT_CONTRACT_RULE_BINDING_ADAPTER_ID,
  DefaultContractRuleBindingAdapter,
  MockContractRuleBindingAdapter,
  type DefaultContractRuleBindingRuntime,
  type MockContractRuleBindingAdapterOptions,
} from "./adapters";

export {
  DEFAULT_CONTRACT_RULE_BINDING_STORE_ID,
  DefaultContractRuleBindingStore,
  type DefaultContractRuleBindingStoreOptions,
  type StoredContractRuleBinding,
  type ContractRuleBindingStore,
} from "./store";

export {
  ContractRuleBindingFactory,
  createContractRuleBindingFactory,
  type ContractRuleBindingFactoryOptions,
} from "./factory";

export { createContractRuleBindingPort } from "./providers";

export { getContractRuleBindingHealthSummary, type ContractRuleBindingHealthSummary } from "./demo";
