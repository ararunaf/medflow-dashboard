/**
 * Helpers de identidade — EPC-24 Sprint 13 (Execution Resource Registry).
 *
 * Sem OCR, IA, parsers, banco, validação de recursos ou conhecimento clínico / TISS.
 */

let executionResourceRegistryIdSeq = 0;
let executionResourceIdSeq = 0;
let definitionIdSeq = 0;
let scopeIdSeq = 0;
let categoryIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionResourceRegistryId(): string {
  executionResourceRegistryIdSeq += 1;
  return next("execution-resource-registry", executionResourceRegistryIdSeq);
}

export function createExecutionResourceId(): string {
  executionResourceIdSeq += 1;
  return next("execution-resource", executionResourceIdSeq);
}

export function createResourceDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-resource-definition", definitionIdSeq);
}

export function createResourceScopeId(): string {
  scopeIdSeq += 1;
  return next("execution-resource-scope", scopeIdSeq);
}

export function createResourceCategoryId(): string {
  categoryIdSeq += 1;
  return next("execution-resource-category", categoryIdSeq);
}

export function resetExecutionResourceRegistryIdSequence(): void {
  executionResourceRegistryIdSeq = 0;
}

export function resetExecutionResourceIdSequence(): void {
  executionResourceIdSeq = 0;
}

export function resetResourceDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetResourceScopeIdSequence(): void {
  scopeIdSeq = 0;
}

export function resetResourceCategoryIdSequence(): void {
  categoryIdSeq = 0;
}

export function resetAllExecutionResourceRegistryIdSequences(): void {
  resetExecutionResourceRegistryIdSequence();
  resetExecutionResourceIdSequence();
  resetResourceDefinitionIdSequence();
  resetResourceScopeIdSequence();
  resetResourceCategoryIdSequence();
}
