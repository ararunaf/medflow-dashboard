/**
 * Identidade do Enterprise Return Runtime — C-08 / ECS-01.
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14):
 * este Runtime é exclusivamente a fundação estrutural para retornos
 * corporativos — sem processamento de retorno, sem correlação automática,
 * sem reconciliação, sem parser XML, sem SOAP, sem operadoras.
 */

export const RETURN_RUNTIME_IDENTITY = {
  name: "Enterprise Return Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Return Runtime Foundation — vendor-agnostic structural foundation for corporate returns (no return processing, no automatic correlation, no reconciliation, no XML parser, no SOAP, no operators).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createReturnRuntimeRequestId(): string {
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

/** Gera id estrutural para ReturnManifest canônicos (C-08). */
export function createReturnManifestId(prefix = "return-manifest"): string {
  manifestSeq += 1;
  return `${prefix}-${manifestSeq.toString(36)}`;
}

/** Gera id estrutural para ReturnContext (C-08). */
export function createReturnContextId(prefix = "return-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Gera id estrutural para ReturnCorrelation canônicos (C-08). */
export function createReturnCorrelationId(prefix = "return-correlation"): string {
  correlationSeq += 1;
  return `${prefix}-${correlationSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllReturnRuntimeIdSequences(): void {
  manifestSeq = 0;
  contextSeq = 0;
  correlationSeq = 0;
}

/** Alias de reset. */
export function resetReturnRuntimeIdSequences(): void {
  resetAllReturnRuntimeIdSequences();
}
