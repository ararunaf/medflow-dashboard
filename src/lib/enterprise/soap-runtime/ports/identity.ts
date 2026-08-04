/**
 * Identidade do Enterprise SOAP Runtime — C-03 / ECS-01.
 *
 * Identity:
 *   Enterprise SOAP Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5): este Runtime é exclusivamente
 * o encapsulador estrutural de transporte SOAP futuro — sem comunicação real.
 */

export const SOAP_RUNTIME_IDENTITY = {
  name: "Enterprise SOAP Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise SOAP Runtime Foundation — vendor-agnostic structural transport encapsulator for future SOAP communication (no real SOAP, no HTTP, no WSDL, no TLS, no certificate, no authentication).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createSOAPRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let responseSeq = 0;
let requestSeq = 0;
let contextSeq = 0;

/** Gera id estrutural para respostas SOAP canônicas (C-03). */
export function createSOAPResponseId(prefix = "soap-response"): string {
  responseSeq += 1;
  return `${prefix}-${responseSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos SOAP canônicos (C-03). */
export function createSOAPRequestId(prefix = "soap-request"): string {
  requestSeq += 1;
  return `${prefix}-${requestSeq.toString(36)}`;
}

/** Gera id estrutural para SOAPContext (C-03). */
export function createSOAPContextId(prefix = "soap-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllSOAPRuntimeIdSequences(): void {
  responseSeq = 0;
  requestSeq = 0;
  contextSeq = 0;
}

/** Alias de reset. */
export function resetSOAPRuntimeIdSequences(): void {
  resetAllSOAPRuntimeIdSequences();
}
