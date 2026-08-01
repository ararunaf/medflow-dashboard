/**
 * Enterprise Contract Foundation — Ports & Adapters (EPC-11).
 *
 * Fluxo oficial:
 *   Application → ContractPort → ContractAdapter
 *     → ContractStore → ContractFactory → ContractProvider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, operadoras,
 * cooperativas, Unimed, Hapvida, Bradesco, OCR, IA, Rule Engine ou
 * Workflow de produto.
 *
 * Contract é apenas uma estrutura canônica genérica.
 * Ele NÃO contém regras e NÃO executa regras.
 * Especializações de domínio ficam FORA deste componente.
 */
export type {
  Contract,
  ContractAttachment,
  ContractCapabilities,
  ContractClause,
  ContractConfigurationReference,
  ContractDeclaredCapability,
  ContractDocumentIdentityReference,
  ContractHealth,
  ContractId,
  ContractMetadataReference,
  ContractName,
  ContractPort,
  ContractProviderId,
  ContractProviderOptions,
  ContractReference,
  ContractRulePackReference,
  ContractSection,
  ContractStatus,
  ContractTag,
  ContractVersion,
  ContractVersionInfo,
  ContractVersionLabel,
  ContractWorkflowReference,
  CreateContractInput,
  CreateContractResult,
  GetContractInput,
  GetContractResult,
  ListContractsInput,
  ListContractsResult,
} from "./ports";

export {
  CONTRACT_STATUSES,
  createContractId,
  defineAttachment,
  defineClause,
  defineConfigurationReference,
  defineContractVersion,
  defineMetadataReference,
  defineReference,
  defineRulePackReference,
  defineSection,
  defineWorkflowReference,
  getAttachmentCount,
  getVersionInfo,
  hasKnownStatus,
  isDraft,
  isPublished,
  listRulePackIds,
  listWorkflowIds,
  prepareRollbackTarget,
  referencesRulePack,
  referencesWorkflow,
  withVersionInfo,
} from "./ports";

export {
  DEFAULT_CONTRACT_ADAPTER_ID,
  DefaultContractAdapter,
  MockContractAdapter,
  type DefaultContractRuntime,
  type MockContractAdapterOptions,
} from "./adapters";

export {
  DEFAULT_CONTRACT_STORE_ID,
  DefaultContractStore,
  type DefaultContractStoreOptions,
  type ContractStore,
  type StoredContract,
} from "./store";

export { ContractFactory, createContractFactory, type ContractFactoryOptions } from "./factory";

export { createContractPort } from "./providers";

export { getContractHealthSummary, type ContractHealthSummary } from "./demo";
