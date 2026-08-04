/**
 * Identidade do Enterprise Operator Runtime — C-04 / ECS-01.
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7):
 * este Runtime é exclusivamente a fundação estrutural para
 * OperatorCapabilityProfile — sem operadoras reais.
 */

export const OPERATOR_RUNTIME_IDENTITY = {
  name: "Enterprise Operator Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Operator Runtime Foundation — vendor-agnostic structural capability-profile foundation for future operators (no real operators, no conditional operator logic, no authentication, no SOAP/XML/REST functional).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createOperatorRuntimeRequestId(): string {
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
let requestSeq = 0;
let contextSeq = 0;
let responseSeq = 0;

/** Gera id estrutural para perfis Operator canônicos (C-04). */
export function createOperatorProfileId(prefix = "operator-profile"): string {
  profileSeq += 1;
  return `${prefix}-${profileSeq.toString(36)}`;
}

/** Gera id estrutural para respostas Operator canônicas (C-04). */
export function createOperatorResponseId(prefix = "operator-response"): string {
  responseSeq += 1;
  return `${prefix}-${responseSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos Operator canônicos (C-04). */
export function createOperatorRequestId(prefix = "operator-request"): string {
  requestSeq += 1;
  return `${prefix}-${requestSeq.toString(36)}`;
}

/** Gera id estrutural para OperatorContext (C-04). */
export function createOperatorContextId(prefix = "operator-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllOperatorRuntimeIdSequences(): void {
  profileSeq = 0;
  requestSeq = 0;
  contextSeq = 0;
  responseSeq = 0;
}

/** Alias de reset. */
export function resetOperatorRuntimeIdSequences(): void {
  resetAllOperatorRuntimeIdSequences();
}
