/**
 * Matriz RBAC do MedFlow-IA.
 *
 * Define as `Capability`s atômicas do domínio operacional e o mapeamento
 * estático `role -> Capability[]`. Os services consomem esta matriz via
 * `can()` / `assertCan()` antes de tocar o banco.
 *
 * Mantenha-a em sincronia com as policies/triggers Postgres
 * (migration `20250512000002_operational_rbac_state.sql`).
 */
import type { UserRole } from "@/lib/database.types";
import { PermissionError, UnauthenticatedError } from "@/lib/domain/operations/errors";

export type Capability =
  | "schedules:read"
  | "schedules:create"
  | "schedules:update"
  | "schedules:archive"
  | "shifts:read"
  | "shifts:create"
  | "shifts:update"
  | "shifts:cancel"
  | "hospitals:read"
  | "professional_hospitals:manage"
  | "assignments:read"
  | "assignments:assign:any"
  | "assignments:assign:self"
  | "assignments:confirm:any"
  | "assignments:confirm:self"
  | "assignments:reject:any"
  | "assignments:reject:self"
  | "swaps:read"
  | "swaps:request:self"
  | "swaps:cancel:self"
  | "swaps:approve"
  | "swaps:deny"
  | "availability:read"
  | "availability:update:any"
  | "availability:update:self"
  | "tiss:read"
  | "tiss:write"
  | "tuss:catalog:write"
  | "payouts:read"
  | "payouts:write"
  | "financial_closing:read"
  | "financial_closing:write"
  | "financial_closing:reopen"
  | "tenant_settings:read"
  | "tenant_settings:write"
  | "demo_seed:apply";

const READ_OPERATIONAL: readonly Capability[] = [
  "schedules:read",
  "shifts:read",
  "assignments:read",
  "swaps:read",
  "availability:read",
  "hospitals:read",
];

/** Leitura de fechamento/repasses — perfis financeiros e gestão; não profissional clínico. */
const READ_FINANCIAL: readonly Capability[] = ["payouts:read", "financial_closing:read"];

const COORDINATOR_CAPS: readonly Capability[] = [
  ...READ_OPERATIONAL,
  ...READ_FINANCIAL,
  "schedules:create",
  "schedules:update",
  "schedules:archive",
  "shifts:create",
  "shifts:update",
  "shifts:cancel",
  "assignments:assign:any",
  "assignments:confirm:any",
  "assignments:reject:any",
  "professional_hospitals:manage",
  "swaps:approve",
  "swaps:deny",
  "availability:update:any",
  "tiss:read",
  "tiss:write",
  "tuss:catalog:write",
  "payouts:write",
  "financial_closing:write",
  "tenant_settings:read",
];

const PROFESSIONAL_CAPS: readonly Capability[] = [
  ...READ_OPERATIONAL,
  "assignments:assign:self",
  "assignments:confirm:self",
  "assignments:reject:self",
  "swaps:request:self",
  "swaps:cancel:self",
  "availability:update:self",
  "tiss:read",
  "tenant_settings:read",
];

const FINANCIAL_CAPS: readonly Capability[] = [
  ...READ_OPERATIONAL,
  ...READ_FINANCIAL,
  "tiss:read",
  "tiss:write",
  "payouts:write",
  "financial_closing:write",
  "tenant_settings:read",
];

const ALL_CAPS: readonly Capability[] = Array.from(
  new Set<Capability>([...COORDINATOR_CAPS, ...PROFESSIONAL_CAPS, "demo_seed:apply"]),
);

/** Reabertura de competência travada/finalizada: apenas admins de tenant. */
const TENANT_ADMIN_CLOSING_CAPS: readonly Capability[] = [
  ...ALL_CAPS,
  "financial_closing:reopen",
  "tenant_settings:write",
  "demo_seed:apply",
];

export const roleCapabilities: Readonly<Record<UserRole, readonly Capability[]>> = {
  super_admin: TENANT_ADMIN_CLOSING_CAPS,
  tenant_admin: TENANT_ADMIN_CLOSING_CAPS,
  coordinator: COORDINATOR_CAPS,
  professional: PROFESSIONAL_CAPS,
  financial: FINANCIAL_CAPS,
};

export function can(role: UserRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  const caps = roleCapabilities[role];
  return Array.isArray(caps) && caps.includes(capability);
}

export function assertCan(
  role: UserRole | null | undefined,
  capability: Capability,
  message?: string,
): asserts role is UserRole {
  if (!role) {
    throw new UnauthenticatedError();
  }
  if (!can(role, capability)) {
    throw new PermissionError(message ?? `Role ${role} sem permissão para ${capability}.`, {
      role,
      capability,
    });
  }
}

export function isOperationalManager(role: UserRole | null | undefined): boolean {
  return role === "super_admin" || role === "tenant_admin" || role === "coordinator";
}

export function isTenantAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin" || role === "tenant_admin";
}
