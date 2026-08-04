/**
 * Identidade do Enterprise XML Validation Runtime — C-02 / ECS-01.
 *
 * Identity:
 *   Enterprise XML Validation Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const XML_VALIDATION_RUNTIME_IDENTITY = {
  name: "Enterprise XML Validation Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise XML Validation Runtime Foundation — vendor-agnostic structural entrypoint for future XML structure/schema/namespace/version/integrity validation (no real XML validation, no XSD, no parser, no automatic correction).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLValidationRuntimeRequestId(): string {
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
let validationSeq = 0;
let contextSeq = 0;

/** Gera id estrutural para resultados de XML Validation canônico (C-02). */
export function createXMLValidationResultId(prefix = "xml-val-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos/perfis de validação canônicos (C-02). */
export function createXMLValidationId(prefix = "xml-val"): string {
  validationSeq += 1;
  return `${prefix}-${validationSeq.toString(36)}`;
}

/** Gera id estrutural para XMLValidationContext (C-02). */
export function createXMLValidationContextId(prefix = "xml-val-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllXMLValidationRuntimeIdSequences(): void {
  resultSeq = 0;
  validationSeq = 0;
  contextSeq = 0;
}

/** Alias TISS-08. */
export function resetXMLValidationRuntimeIdSequences(): void {
  resetAllXMLValidationRuntimeIdSequences();
}
