/**
 * Máquinas de estado puras (sem efeitos colaterais).
 *
 * Espelham — no nível da aplicação — as mesmas transições aceitas pelos
 * triggers Postgres em `20250512000002_operational_rbac_state.sql`,
 * garantindo erros previsíveis antes do round-trip ao banco.
 */
import type { AssignmentStatus, ScheduleStatus, ShiftStatus, SwapRequestStatus } from "./enums";

export const scheduleTransitions: Readonly<Record<ScheduleStatus, readonly ScheduleStatus[]>> = {
  draft: ["draft", "active", "archived"],
  active: ["active", "archived"],
  archived: ["archived"],
};

export const shiftTransitions: Readonly<Record<ShiftStatus, readonly ShiftStatus[]>> = {
  open: ["open", "assigned", "cancelled"],
  assigned: ["assigned", "open", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export const assignmentTransitions: Readonly<
  Record<AssignmentStatus, readonly AssignmentStatus[]>
> = {
  pending: ["pending", "confirmed", "rejected"],
  confirmed: ["confirmed", "rejected"],
  rejected: ["rejected"],
};

export const swapRequestTransitions: Readonly<
  Record<SwapRequestStatus, readonly SwapRequestStatus[]>
> = {
  pending: ["pending", "approved", "denied", "cancelled"],
  approved: ["approved"],
  denied: ["denied"],
  cancelled: ["cancelled"],
};

export function canTransition<S extends string>(
  table: Readonly<Record<S, readonly S[]>>,
  from: S,
  to: S,
): boolean {
  const allowed = table[from];
  return Array.isArray(allowed) && allowed.includes(to);
}
