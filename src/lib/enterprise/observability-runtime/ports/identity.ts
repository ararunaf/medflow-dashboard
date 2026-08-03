/**
 * Helpers de identidade — INF-09 Enterprise Observability Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createObservabilityRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let resultSeq = 0;
let scopeSeq = 0;
let signalSeq = 0;
let envelopeSeq = 0;

/** Gera id estrutural para resultados de Observability Runtime canônico. */
export function createObservabilityResultId(prefix = "obs-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para ObservabilityScopes canônicos. */
export function createObservabilityScopeId(prefix = "scope"): string {
  scopeSeq += 1;
  return `${prefix}-${scopeSeq.toString(36)}`;
}

/** Gera id estrutural para Signals canônicos. */
export function createObservabilitySignalId(prefix = "osig"): string {
  signalSeq += 1;
  return `${prefix}-${signalSeq.toString(36)}`;
}

/** Gera id estrutural para Envelopes canônicos. */
export function createObservabilityEnvelopeId(prefix = "oenv"): string {
  envelopeSeq += 1;
  return `${prefix}-${envelopeSeq.toString(36)}`;
}

export function resetObservabilityRuntimeIdSequences(): void {
  resultSeq = 0;
  scopeSeq = 0;
  signalSeq = 0;
  envelopeSeq = 0;
}
