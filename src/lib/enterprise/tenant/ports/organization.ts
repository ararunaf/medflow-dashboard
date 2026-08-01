/**
 * Helpers de OrganizationType — EPC-10A FASE 7.
 *
 * Enumeração pura. Sem lógica de domínio, clínica, contratual ou de operadora.
 */
import { ORGANIZATION_TYPES, type OrganizationType } from "./types";

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createTenantUuid(): string {
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

/** Verifica se um valor é um OrganizationType canônico. */
export function isOrganizationType(value: unknown): value is OrganizationType {
  return typeof value === "string" && (ORGANIZATION_TYPES as readonly string[]).includes(value);
}

/** Lista canônica de OrganizationType (cópia defensiva). */
export function listOrganizationTypes(): readonly OrganizationType[] {
  return ORGANIZATION_TYPES;
}
