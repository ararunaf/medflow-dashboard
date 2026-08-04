/**
 * Identidade do Enterprise Batch Runtime — C-06 / ECS-01.
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11):
 * este Runtime é exclusivamente a fundação estrutural para lotes corporativos
 * futuros — sem processamento em lote, sem filas, sem workers.
 */

export const BATCH_RUNTIME_IDENTITY = {
  name: "Enterprise Batch Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Batch Runtime Foundation — vendor-agnostic structural foundation for corporate batch transactional units (no batch processing, queues, workers, retry, scheduler, or parallelism).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createBatchRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let batchSeq = 0;
let documentSeq = 0;
let contextSeq = 0;
let policySeq = 0;

/** Gera id estrutural para BatchManifest canônicos (C-06). */
export function createBatchId(prefix = "batch"): string {
  batchSeq += 1;
  return `${prefix}-${batchSeq.toString(36)}`;
}

/** Gera id estrutural para BatchDocument canônicos (C-06). */
export function createBatchDocumentId(prefix = "batch-document"): string {
  documentSeq += 1;
  return `${prefix}-${documentSeq.toString(36)}`;
}

/** Gera id estrutural para BatchContext (C-06). */
export function createBatchContextId(prefix = "batch-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Gera id estrutural para BatchPolicy canônicas (C-06). */
export function createBatchPolicyId(prefix = "batch-policy"): string {
  policySeq += 1;
  return `${prefix}-${policySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllBatchRuntimeIdSequences(): void {
  batchSeq = 0;
  documentSeq = 0;
  contextSeq = 0;
  policySeq = 0;
}

/** Alias de reset. */
export function resetBatchRuntimeIdSequences(): void {
  resetAllBatchRuntimeIdSequences();
}
