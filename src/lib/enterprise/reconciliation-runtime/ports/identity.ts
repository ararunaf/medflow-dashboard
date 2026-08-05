/**
 * Identidade do Enterprise Reconciliation Runtime — C-09 / ECS-01.
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16):
 * este Runtime é exclusivamente a fundação estrutural para reconciliação
 * corporativa — sem reconciliação funcional, sem matching automático,
 * sem resolução de conflitos, sem workflow.
 */

export const RECONCILIATION_RUNTIME_IDENTITY = {
  name: "Enterprise Reconciliation Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Reconciliation Runtime Foundation — vendor-agnostic structural foundation for corporate reconciliation (no functional reconciliation, no automatic matching, no conflict resolution, no workflow).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createReconciliationRuntimeRequestId(): string {
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
let correlationSeq = 0;
let resultSeq = 0;

/** Gera id estrutural para ReconciliationManifest canônicos (C-09). */
export function createReconciliationManifestId(prefix = "reconciliation-manifest"): string {
  manifestSeq += 1;
  return `${prefix}-${manifestSeq.toString(36)}`;
}

/** Gera id estrutural para ReconciliationContext (C-09). */
export function createReconciliationContextId(prefix = "reconciliation-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Gera id estrutural para ReconciliationCorrelation canônicos (C-09). */
export function createReconciliationCorrelationId(prefix = "reconciliation-correlation"): string {
  correlationSeq += 1;
  return `${prefix}-${correlationSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalReconciliationResult (C-09). */
export function createCanonicalReconciliationResultId(
  prefix = "canonical-reconciliation-result",
): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllReconciliationRuntimeIdSequences(): void {
  manifestSeq = 0;
  contextSeq = 0;
  correlationSeq = 0;
  resultSeq = 0;
}

/** Alias de reset. */
export function resetReconciliationRuntimeIdSequences(): void {
  resetAllReconciliationRuntimeIdSequences();
}
