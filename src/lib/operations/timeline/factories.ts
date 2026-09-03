/**
 * Fábricas de payloads de eventos operacionais — metadata normalizado para
 * consultas de timeline (shift_id, professional_id, etc.).
 */
import type { JsonObject, OperationalEventSeverity } from "@/lib/database.types";
import type {
  ShiftAssignmentRow,
  ShiftRow,
  ShiftSwapRequestRow,
} from "@/lib/services/operations/types";

export type OperationalEventPayload = {
  entity_type: "shift" | "assignment" | "swap" | "availability" | "alert" | "coordinator_action";
  entity_id: string;
  event_type:
    | "shift_created"
    | "shift_updated"
    | "shift_cancelled"
    | "assignment_created"
    | "assignment_confirmed"
    | "assignment_rejected"
    | "assignment_checked_in"
    | "assignment_checked_out"
    | "swap_requested"
    | "swap_approved"
    | "swap_denied"
    | "availability_updated"
    | "critical_alert_generated"
    | "operational_action_triggered";
  severity: OperationalEventSeverity;
  description: string;
  metadata: JsonObject;
};

export function shiftCreatedEvent(shift: ShiftRow): OperationalEventPayload {
  return {
    entity_type: "shift",
    entity_id: shift.id,
    event_type: "shift_created",
    severity: "info",
    description: "Plantão criado na escala.",
    metadata: {
      shift_id: shift.id,
      schedule_id: shift.schedule_id,
      department_id: shift.department_id,
      starts_at: shift.starts_at,
      ends_at: shift.ends_at,
    },
  };
}

export function shiftUpdatedEvent(
  shift: ShiftRow,
  previous?: ShiftRow | null,
): OperationalEventPayload {
  return {
    entity_type: "shift",
    entity_id: shift.id,
    event_type: "shift_updated",
    severity: "info",
    description: "Plantão atualizado.",
    metadata: {
      shift_id: shift.id,
      schedule_id: shift.schedule_id,
      previous_status: previous?.status ?? null,
      status: shift.status,
      starts_at: shift.starts_at,
      ends_at: shift.ends_at,
    },
  };
}

export function shiftCancelledEvent(shift: ShiftRow): OperationalEventPayload {
  return {
    entity_type: "shift",
    entity_id: shift.id,
    event_type: "shift_cancelled",
    severity: "warning",
    description: "Plantão cancelado.",
    metadata: {
      shift_id: shift.id,
      schedule_id: shift.schedule_id,
      status: shift.status,
    },
  };
}

export function assignmentCreatedEvent(row: ShiftAssignmentRow): OperationalEventPayload {
  return {
    entity_type: "assignment",
    entity_id: row.id,
    event_type: "assignment_created",
    severity: "info",
    description: "Nova atribuição de plantão registrada.",
    metadata: {
      assignment_id: row.id,
      shift_id: row.shift_id,
      professional_id: row.professional_id,
      assignment_status: row.assignment_status,
    },
  };
}

export function assignmentConfirmedEvent(row: ShiftAssignmentRow): OperationalEventPayload {
  return {
    entity_type: "assignment",
    entity_id: row.id,
    event_type: "assignment_confirmed",
    severity: "info",
    description: "Atribuição confirmada.",
    metadata: {
      assignment_id: row.id,
      shift_id: row.shift_id,
      professional_id: row.professional_id,
    },
  };
}

export function assignmentRejectedEvent(row: ShiftAssignmentRow): OperationalEventPayload {
  return {
    entity_type: "assignment",
    entity_id: row.id,
    event_type: "assignment_rejected",
    severity: "warning",
    description: "Atribuição recusada ou revogada.",
    metadata: {
      assignment_id: row.id,
      shift_id: row.shift_id,
      professional_id: row.professional_id,
    },
  };
}

export function assignmentCheckedInEvent(row: ShiftAssignmentRow): OperationalEventPayload {
  return {
    entity_type: "assignment",
    entity_id: row.id,
    event_type: "assignment_checked_in",
    severity: "info",
    description: "Check-in registrado no plantão.",
    metadata: {
      assignment_id: row.id,
      shift_id: row.shift_id,
      professional_id: row.professional_id,
      checked_in_at: row.checked_in_at,
    },
  };
}

export function assignmentCheckedOutEvent(row: ShiftAssignmentRow): OperationalEventPayload {
  return {
    entity_type: "assignment",
    entity_id: row.id,
    event_type: "assignment_checked_out",
    severity: "info",
    description: "Check-out registrado no plantão.",
    metadata: {
      assignment_id: row.id,
      shift_id: row.shift_id,
      professional_id: row.professional_id,
      checked_in_at: row.checked_in_at,
      checked_out_at: row.checked_out_at,
    },
  };
}

export function swapRequestedEvent(row: ShiftSwapRequestRow): OperationalEventPayload {
  return {
    entity_type: "swap",
    entity_id: row.id,
    event_type: "swap_requested",
    severity: "info",
    description: "Solicitação de troca de plantão criada.",
    metadata: {
      swap_id: row.id,
      shift_id: row.shift_id,
      requester_professional_id: row.requester_professional_id,
      target_professional_id: row.target_professional_id,
    },
  };
}

export function swapApprovedEvent(row: ShiftSwapRequestRow): OperationalEventPayload {
  return {
    entity_type: "swap",
    entity_id: row.id,
    event_type: "swap_approved",
    severity: "info",
    description: "Troca de plantão aprovada.",
    metadata: {
      swap_id: row.id,
      shift_id: row.shift_id,
      requester_professional_id: row.requester_professional_id,
      target_professional_id: row.target_professional_id,
    },
  };
}

export function swapDeniedEvent(row: ShiftSwapRequestRow): OperationalEventPayload {
  return {
    entity_type: "swap",
    entity_id: row.id,
    event_type: "swap_denied",
    severity: "warning",
    description: "Troca de plantão negada.",
    metadata: {
      swap_id: row.id,
      shift_id: row.shift_id,
      requester_professional_id: row.requester_professional_id,
      target_professional_id: row.target_professional_id,
    },
  };
}

export function availabilityUpdatedEvent(
  professionalId: string,
  windowCount: number,
): OperationalEventPayload {
  return {
    entity_type: "availability",
    entity_id: professionalId,
    event_type: "availability_updated",
    severity: "info",
    description: "Disponibilidade do profissional atualizada.",
    metadata: {
      professional_id: professionalId,
      window_count: windowCount,
    },
  };
}
