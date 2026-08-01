/**
 * Helpers de identidade — EPC-24 Sprint 09 (Execution Dependency Registry).
 *
 * Sem OCR, IA, parsers, banco, resolução de dependências ou conhecimento clínico / TISS.
 */

let executionDependencyRegistryIdSeq = 0;
let executionDependencyIdSeq = 0;
let definitionIdSeq = 0;
let graphIdSeq = 0;
let nodeIdSeq = 0;
let edgeIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionDependencyRegistryId(): string {
  executionDependencyRegistryIdSeq += 1;
  return next("execution-dependency-registry", executionDependencyRegistryIdSeq);
}

export function createExecutionDependencyId(): string {
  executionDependencyIdSeq += 1;
  return next("execution-dependency", executionDependencyIdSeq);
}

export function createDependencyDefinitionId(): string {
  definitionIdSeq += 1;
  return next("execution-dependency-definition", definitionIdSeq);
}

export function createDependencyGraphId(): string {
  graphIdSeq += 1;
  return next("execution-dependency-graph", graphIdSeq);
}

export function createDependencyNodeId(): string {
  nodeIdSeq += 1;
  return next("execution-dependency-node", nodeIdSeq);
}

export function createDependencyEdgeId(): string {
  edgeIdSeq += 1;
  return next("execution-dependency-edge", edgeIdSeq);
}

export function resetExecutionDependencyRegistryIdSequence(): void {
  executionDependencyRegistryIdSeq = 0;
}

export function resetExecutionDependencyIdSequence(): void {
  executionDependencyIdSeq = 0;
}

export function resetDependencyDefinitionIdSequence(): void {
  definitionIdSeq = 0;
}

export function resetDependencyGraphIdSequence(): void {
  graphIdSeq = 0;
}

export function resetDependencyNodeIdSequence(): void {
  nodeIdSeq = 0;
}

export function resetDependencyEdgeIdSequence(): void {
  edgeIdSeq = 0;
}

export function resetAllExecutionDependencyRegistryIdSequences(): void {
  resetExecutionDependencyRegistryIdSequence();
  resetExecutionDependencyIdSequence();
  resetDependencyDefinitionIdSequence();
  resetDependencyGraphIdSequence();
  resetDependencyNodeIdSequence();
  resetDependencyEdgeIdSequence();
}
