/**
 * Helpers de referências opacas — EPC-11.
 *
 * Somente infraestrutura. NÃO resolve referências.
 * NÃO carrega Rule Packs / Workflows / Metadata / Configuration.
 * NÃO valida contratos.
 */
import type {
  Contract,
  ContractAttachment,
  ContractClause,
  ContractConfigurationReference,
  ContractMetadataReference,
  ContractReference,
  ContractRulePackReference,
  ContractSection,
  ContractWorkflowReference,
} from "./types";

/** Define uma referência opaca a Rule Pack. */
export function defineRulePackReference(
  options: ContractRulePackReference = {},
): ContractRulePackReference {
  return { ...options };
}

/** Define uma referência opaca a Workflow. */
export function defineWorkflowReference(
  options: ContractWorkflowReference = {},
): ContractWorkflowReference {
  return { ...options };
}

/** Define uma referência opaca a Metadata. */
export function defineMetadataReference(
  options: ContractMetadataReference = {},
): ContractMetadataReference {
  return { ...options };
}

/** Define uma referência opaca a Configuration. */
export function defineConfigurationReference(
  options: ContractConfigurationReference = {},
): ContractConfigurationReference {
  return { ...options };
}

/** Define um anexo estrutural (sem I/O). */
export function defineAttachment(options: ContractAttachment = {}): ContractAttachment {
  return { ...options };
}

/** Define uma cláusula genérica (sem validação). */
export function defineClause(options: ContractClause = {}): ContractClause {
  return { ...options };
}

/** Define uma seção genérica (sem validação). */
export function defineSection(options: ContractSection = {}): ContractSection {
  return { ...options };
}

/** Define uma referência genérica. */
export function defineReference(options: ContractReference = {}): ContractReference {
  return { ...options };
}

/** Lista packIds opacos declarados no contrato. */
export function listRulePackIds(contract: Contract): readonly string[] {
  return (contract.rulePackReferences ?? [])
    .map((ref) => ref.packId)
    .filter((id): id is string => id != null && id !== "");
}

/** Lista workflowIds opacos declarados no contrato. */
export function listWorkflowIds(contract: Contract): readonly string[] {
  return (contract.workflowReferences ?? [])
    .map((ref) => ref.workflowId)
    .filter((id): id is string => id != null && id !== "");
}

/** Conta anexos declarados. */
export function getAttachmentCount(contract: Contract): number {
  return (contract.attachmentReferences ?? []).length;
}

/** True se o contrato declara referência a um Rule Pack. */
export function referencesRulePack(contract: Contract, packId: string): boolean {
  return (contract.rulePackReferences ?? []).some((ref) => ref.packId === packId);
}

/** True se o contrato declara referência a um Workflow. */
export function referencesWorkflow(contract: Contract, workflowId: string): boolean {
  return (contract.workflowReferences ?? []).some((ref) => ref.workflowId === workflowId);
}
