/**
 * Helpers de identidade — EPC-24 Sprint 08 (Execution Capability Registry).
 *
 * Sem OCR, IA, parsers, banco, descoberta automática ou conhecimento clínico / TISS.
 */

let executionCapabilityRegistryIdSeq = 0;
let executionCapabilityIdSeq = 0;
let definitionIdSeq = 0;
let descriptorIdSeq = 0;
let categoryIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionCapabilityRegistryId(): string {
  executionCapabilityRegistryIdSeq += 1;
  return next("execution-capability-registry", executionCapabilityRegistryIdSeq);
}

export function createExecutionCapabilityId(): string {
  executionCapabilityIdSeq += 1;
  return next("execution-capability", executionCapabilityIdSeq);
}

export function createCapabilityDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-capability-definition", definitionIdSeq);
}

export function createCapabilityDescriptorId(): string {
  descriptorIdSeq += 1;
  return next("execution-capability-descriptor", descriptorIdSeq);
}

export function createCapabilityCategoryId(): string {
  categoryIdSeq += 1;
  return next("execution-capability-category", categoryIdSeq);
}

export function resetExecutionCapabilityRegistryIdSequence(): void {
  executionCapabilityRegistryIdSeq = 0;
}

export function resetExecutionCapabilityIdSequence(): void {
  executionCapabilityIdSeq = 0;
}

export function resetCapabilityDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetCapabilityDescriptorIdSequence(): void {
  descriptorIdSeq = 0;
}

export function resetCapabilityCategoryIdSequence(): void {
  categoryIdSeq = 0;
}

export function resetAllExecutionCapabilityRegistryIdSequences(): void {
  resetExecutionCapabilityRegistryIdSequence();
  resetExecutionCapabilityIdSequence();
  resetCapabilityDefinitionIdSequence();
  resetCapabilityDescriptorIdSequence();
  resetCapabilityCategoryIdSequence();
}
