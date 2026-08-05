/**
 * Identidade do Enterprise Corporate Workflow Runtime — C-10 / ECS-01.
 *
 * WORKFLOW IS PURE ORCHESTRATION (Regra Permanente nº 18):
 * este Runtime é exclusivamente a fundação estrutural para orquestração
 * corporativa — sem workflow funcional, sem BPM, sem decisão automática,
 * sem execução de runtime. Nunca valida XML, nunca reconcilia, nunca
 * autoriza, nunca gera SOAP, nunca fala com operadoras, nunca processa
 * lotes, nunca roda IA, e nunca implementa regras de domínio.
 */

export const WORKFLOW_RUNTIME_IDENTITY = {
  name: "Enterprise Corporate Workflow Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Corporate Workflow Runtime Foundation — vendor-agnostic pure orchestration foundation (no functional workflow, no BPM, no automatic decision, no runtime execution). WORKFLOW IS PURE ORCHESTRATION: exclusively orchestrates; never validates XML, reconciles, authorizes, generates SOAP, talks to operators, processes batches, runs AI, or implements domain rules.",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createWorkflowRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let manifestSeq = 0;
let contextSeq = 0;
let executionSeq = 0;
let resultSeq = 0;

/** Gera id estrutural para WorkflowManifest canônicos (C-10). */
export function createWorkflowManifestId(prefix = "workflow-manifest"): string {
  manifestSeq += 1;
  return `${prefix}-${manifestSeq.toString(36)}`;
}

/** Gera id estrutural para WorkflowContext (C-10). */
export function createWorkflowContextId(prefix = "workflow-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/**
 * Gera id estrutural para UMA WorkflowExecution específica (C-10).
 * IMPORTANTE: cada chamada produz um id novo — NUNCA reaproveitado entre execuções.
 */
export function createWorkflowExecutionId(prefix = "workflow-execution"): string {
  executionSeq += 1;
  return `${prefix}-${executionSeq.toString(36)}`;
}

/** Gera id estrutural para WorkflowExecutionResult (C-10). */
export function createWorkflowExecutionResultId(prefix = "workflow-execution-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllWorkflowRuntimeIdSequences(): void {
  manifestSeq = 0;
  contextSeq = 0;
  executionSeq = 0;
  resultSeq = 0;
}

/** Alias de reset. */
export function resetWorkflowRuntimeIdSequences(): void {
  resetAllWorkflowRuntimeIdSequences();
}
