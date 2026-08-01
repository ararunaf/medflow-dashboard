/**
 * Helpers de identidade — EPC-24 Sprint 12 (Execution Requirement Registry).
 *
 * Sem OCR, IA, parsers, banco, validação de requisitos ou conhecimento clínico / TISS.
 */

let executionRequirementRegistryIdSeq = 0;
let executionRequirementIdSeq = 0;
let definitionIdSeq = 0;
let scopeIdSeq = 0;
let categoryIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionRequirementRegistryId(): string {
  executionRequirementRegistryIdSeq += 1;
  return next("execution-requirement-registry", executionRequirementRegistryIdSeq);
}

export function createExecutionRequirementId(): string {
  executionRequirementIdSeq += 1;
  return next("execution-requirement", executionRequirementIdSeq);
}

export function createRequirementDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-requirement-definition", definitionIdSeq);
}

export function createRequirementScopeId(): string {
  scopeIdSeq += 1;
  return next("execution-requirement-scope", scopeIdSeq);
}

export function createRequirementCategoryId(): string {
  categoryIdSeq += 1;
  return next("execution-requirement-category", categoryIdSeq);
}

export function resetExecutionRequirementRegistryIdSequence(): void {
  executionRequirementRegistryIdSeq = 0;
}

export function resetExecutionRequirementIdSequence(): void {
  executionRequirementIdSeq = 0;
}

export function resetRequirementDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetRequirementScopeIdSequence(): void {
  scopeIdSeq = 0;
}

export function resetRequirementCategoryIdSequence(): void {
  categoryIdSeq = 0;
}

export function resetAllExecutionRequirementRegistryIdSequences(): void {
  resetExecutionRequirementRegistryIdSequence();
  resetExecutionRequirementIdSequence();
  resetRequirementDefinitionIdSequence();
  resetRequirementScopeIdSequence();
  resetRequirementCategoryIdSequence();
}
