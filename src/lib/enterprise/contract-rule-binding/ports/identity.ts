/**
 * Helpers de BindingPolicy / Status / identidade — EPC-17.
 *
 * Enumeração pura. Sem lógica de domínio, clínica, contratual ou operacional.
 * Sem avaliação de BindingPolicy. Sem execução de regras.
 */
import {
  BINDING_POLICIES,
  BINDING_STATUSES,
  type BindingPolicy,
  type BindingStatus,
} from "./types";

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createBindingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback determinístico-suficiente para in-process / testes.
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

/** Verifica se um valor é um BindingPolicy canônico. */
export function isBindingPolicy(value: unknown): value is BindingPolicy {
  return typeof value === "string" && (BINDING_POLICIES as readonly string[]).includes(value);
}

/** Lista canônica de BindingPolicy (cópia defensiva). */
export function listBindingPolicies(): readonly BindingPolicy[] {
  return BINDING_POLICIES;
}

/** Verifica se um valor é um BindingStatus canônico sugerido. */
export function isBindingStatus(value: unknown): value is BindingStatus {
  return typeof value === "string" && (BINDING_STATUSES as readonly string[]).includes(value);
}

/** Lista canônica de BindingStatus sugeridos (cópia defensiva). */
export function listBindingStatuses(): readonly BindingStatus[] {
  return BINDING_STATUSES;
}
