/**
 * Helpers de identidade — EPC-24 Sprint 10 (Execution Policy Registry).
 *
 * Sem OCR, IA, parsers, banco, interpretação de políticas ou conhecimento clínico / TISS.
 */

let executionPolicyRegistryIdSeq = 0;
let executionPolicyIdSeq = 0;
let definitionIdSeq = 0;
let scopeIdSeq = 0;
let categoryIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionPolicyRegistryId(): string {
  executionPolicyRegistryIdSeq += 1;
  return next("execution-policy-registry", executionPolicyRegistryIdSeq);
}

export function createExecutionPolicyId(): string {
  executionPolicyIdSeq += 1;
  return next("execution-policy", executionPolicyIdSeq);
}

export function createPolicyDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-policy-definition", definitionIdSeq);
}

export function createPolicyScopeId(): string {
  scopeIdSeq += 1;
  return next("execution-policy-scope", scopeIdSeq);
}

export function createPolicyCategoryId(): string {
  categoryIdSeq += 1;
  return next("execution-policy-category", categoryIdSeq);
}

export function resetExecutionPolicyRegistryIdSequence(): void {
  executionPolicyRegistryIdSeq = 0;
}

export function resetExecutionPolicyIdSequence(): void {
  executionPolicyIdSeq = 0;
}

export function resetPolicyDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetPolicyScopeIdSequence(): void {
  scopeIdSeq = 0;
}

export function resetPolicyCategoryIdSequence(): void {
  categoryIdSeq = 0;
}

export function resetAllExecutionPolicyRegistryIdSequences(): void {
  resetExecutionPolicyRegistryIdSequence();
  resetExecutionPolicyIdSequence();
  resetPolicyDefinitionIdSequence();
  resetPolicyScopeIdSequence();
  resetPolicyCategoryIdSequence();
}
