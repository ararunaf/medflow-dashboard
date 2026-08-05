/**
 * Identidade do Enterprise Protocol Runtime — C-07 / ECS-01.
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12):
 * este Runtime é exclusivamente a fundação estrutural para abstração de
 * protocolos — sem SOAP, REST, gRPC, mensageria, HTTP, TLS ou resolução
 * funcional.
 */

export const PROTOCOL_RUNTIME_IDENTITY = {
  name: "Enterprise Protocol Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Protocol Runtime Foundation — vendor-agnostic structural foundation for protocol abstraction (no SOAP, REST, gRPC, messaging, HTTP, TLS, or functional protocol resolution).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createProtocolRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let profileSeq = 0;
let contextSeq = 0;
let resolverSeq = 0;

/** Gera id estrutural para ProtocolProfile canônicos (C-07). */
export function createProtocolProfileId(prefix = "protocol-profile"): string {
  profileSeq += 1;
  return `${prefix}-${profileSeq.toString(36)}`;
}

/** Gera id estrutural para ProtocolContext (C-07). */
export function createProtocolContextId(prefix = "protocol-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Gera id estrutural para ProtocolResolver canônicos (C-07). */
export function createProtocolResolverId(prefix = "protocol-resolver"): string {
  resolverSeq += 1;
  return `${prefix}-${resolverSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllProtocolRuntimeIdSequences(): void {
  profileSeq = 0;
  contextSeq = 0;
  resolverSeq = 0;
}

/** Alias de reset. */
export function resetProtocolRuntimeIdSequences(): void {
  resetAllProtocolRuntimeIdSequences();
}
