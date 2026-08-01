/**
 * Helpers de identidade — EPC-24 Sprint 11 (Execution Constraint Registry).
 *
 * Sem OCR, IA, parsers, banco, interpretação de restrições ou conhecimento clínico / TISS.
 */

let executionConstraintRegistryIdSeq = 0;
let executionConstraintIdSeq = 0;
let definitionIdSeq = 0;
let scopeIdSeq = 0;
let categoryIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionConstraintRegistryId(): string {
  executionConstraintRegistryIdSeq += 1;
  return next("execution-constraint-registry", executionConstraintRegistryIdSeq);
}

export function createExecutionConstraintId(): string {
  executionConstraintIdSeq += 1;
  return next("execution-constraint", executionConstraintIdSeq);
}

export function createConstraintDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-constraint-definition", definitionIdSeq);
}

export function createConstraintScopeId(): string {
  scopeIdSeq += 1;
  return next("execution-constraint-scope", scopeIdSeq);
}

export function createConstraintCategoryId(): string {
  categoryIdSeq += 1;
  return next("execution-constraint-category", categoryIdSeq);
}

export function resetExecutionConstraintRegistryIdSequence(): void {
  executionConstraintRegistryIdSeq = 0;
}

export function resetExecutionConstraintIdSequence(): void {
  executionConstraintIdSeq = 0;
}

export function resetConstraintDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetConstraintScopeIdSequence(): void {
  scopeIdSeq = 0;
}

export function resetConstraintCategoryIdSequence(): void {
  categoryIdSeq = 0;
}

export function resetAllExecutionConstraintRegistryIdSequences(): void {
  resetExecutionConstraintRegistryIdSequence();
  resetExecutionConstraintIdSequence();
  resetConstraintDefinitionIdSequence();
  resetConstraintScopeIdSequence();
  resetConstraintCategoryIdSequence();
}
