/**
 * Helpers de identidade — EPC-24 Sprint 14 (Execution Environment Registry).
 *
 * Sem OCR, IA, parsers, banco, seleção de ambientes ou conhecimento clínico / TISS.
 */

let executionEnvironmentRegistryIdSeq = 0;
let executionEnvironmentIdSeq = 0;
let definitionIdSeq = 0;
let scopeIdSeq = 0;
let categoryIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionEnvironmentRegistryId(): string {
  executionEnvironmentRegistryIdSeq += 1;
  return next("execution-environment-registry", executionEnvironmentRegistryIdSeq);
}

export function createExecutionEnvironmentId(): string {
  executionEnvironmentIdSeq += 1;
  return next("execution-environment", executionEnvironmentIdSeq);
}

export function createEnvironmentDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-environment-definition", definitionIdSeq);
}

export function createEnvironmentScopeId(): string {
  scopeIdSeq += 1;
  return next("execution-environment-scope", scopeIdSeq);
}

export function createEnvironmentCategoryId(): string {
  categoryIdSeq += 1;
  return next("execution-environment-category", categoryIdSeq);
}

export function resetExecutionEnvironmentRegistryIdSequence(): void {
  executionEnvironmentRegistryIdSeq = 0;
}

export function resetExecutionEnvironmentIdSequence(): void {
  executionEnvironmentIdSeq = 0;
}

export function resetEnvironmentDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetEnvironmentScopeIdSequence(): void {
  scopeIdSeq = 0;
}

export function resetEnvironmentCategoryIdSequence(): void {
  categoryIdSeq = 0;
}

export function resetAllExecutionEnvironmentRegistryIdSequences(): void {
  resetExecutionEnvironmentRegistryIdSequence();
  resetExecutionEnvironmentIdSequence();
  resetEnvironmentDefinitionIdSequence();
  resetEnvironmentScopeIdSequence();
  resetEnvironmentCategoryIdSequence();
}
