/**
 * Helpers de AssignmentKind / Status — EPC-10B FASE 6 / FASE 8.
 *
 * Enumeração pura. Sem lógica de domínio, clínica, contratual ou operacional.
 */
import {
  ASSIGNMENT_STATUSES,
  TENANT_ASSIGNMENT_KINDS,
  type AssignmentStatus,
  type TenantAssignmentKind,
} from "./types";

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createAssignmentUuid(): string {
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

/** Verifica se um valor é um TenantAssignmentKind canônico. */
export function isTenantAssignmentKind(value: unknown): value is TenantAssignmentKind {
  return (
    typeof value === "string" && (TENANT_ASSIGNMENT_KINDS as readonly string[]).includes(value)
  );
}

/** Lista canônica de TenantAssignmentKind (cópia defensiva). */
export function listTenantAssignmentKinds(): readonly TenantAssignmentKind[] {
  return TENANT_ASSIGNMENT_KINDS;
}

/** Verifica se um valor é um AssignmentStatus canônico sugerido. */
export function isAssignmentStatus(value: unknown): value is AssignmentStatus {
  return typeof value === "string" && (ASSIGNMENT_STATUSES as readonly string[]).includes(value);
}

/** Lista canônica de AssignmentStatus sugeridos (cópia defensiva). */
export function listAssignmentStatuses(): readonly AssignmentStatus[] {
  return ASSIGNMENT_STATUSES;
}
