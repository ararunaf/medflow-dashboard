/**
 * Identidade do Enterprise Authorization Runtime — C-05 / ECS-01.
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9):
 * este Runtime é exclusivamente a fundação estrutural para seleção futura
 * de estratégias de autorização — sem autorização funcional.
 */

export const AUTHORIZATION_RUNTIME_IDENTITY = {
  name: "Enterprise Authorization Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Authorization Runtime Foundation — vendor-agnostic structural strategy-selection foundation for future authorization (no functional authorization, eligibility, SOAP/XML, operator integration).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createAuthorizationRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let strategySeq = 0;
let policySeq = 0;
let requestSeq = 0;
let contextSeq = 0;
let responseSeq = 0;

/** Gera id estrutural para AuthorizationStrategy canônicas (C-05). */
export function createAuthorizationStrategyId(prefix = "authorization-strategy"): string {
  strategySeq += 1;
  return `${prefix}-${strategySeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationPolicy canônicas (C-05). */
export function createAuthorizationPolicyId(prefix = "authorization-policy"): string {
  policySeq += 1;
  return `${prefix}-${policySeq.toString(36)}`;
}

/** Gera id estrutural para respostas Authorization canônicas (C-05). */
export function createAuthorizationResponseId(prefix = "authorization-response"): string {
  responseSeq += 1;
  return `${prefix}-${responseSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos Authorization canônicos (C-05). */
export function createAuthorizationRequestId(prefix = "authorization-request"): string {
  requestSeq += 1;
  return `${prefix}-${requestSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationContext (C-05). */
export function createAuthorizationContextId(prefix = "authorization-context"): string {
  contextSeq += 1;
  return `${prefix}-${contextSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllAuthorizationRuntimeIdSequences(): void {
  strategySeq = 0;
  policySeq = 0;
  requestSeq = 0;
  contextSeq = 0;
  responseSeq = 0;
}

/** Alias de reset. */
export function resetAuthorizationRuntimeIdSequences(): void {
  resetAllAuthorizationRuntimeIdSequences();
}
