/**
 * Server functions de leitura para atribuições (shift_assignments).
 *
 * Foco no fluxo de auto-serviço do profissional: a UI precisa saber
 * qual atribuição corresponde a qual plantão para acionar
 * `confirmAssignmentFn` / `rejectAssignmentFn`.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database } from "@/lib/database.types";

type AssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];
type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["schedules"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];

export type AssignmentListItem = {
  assignmentId: string;
  shiftId: string;
  status: AssignmentRow["assignment_status"];
  assignedAt: string;
  shift: {
    startsAt: string;
    endsAt: string;
    status: ShiftRow["status"];
    roleRequired: string | null;
    scheduleId: string;
    scheduleName: string;
    departmentId: string;
    departmentName: string;
    unitName: string | null;
  };
};

const ASSIGNMENT_LIST_SELECT = `
  id, shift_id, assignment_status, assigned_at,
  shift:shifts!shift_assignments_tenant_shift_fk (
    starts_at, ends_at, status, role_required, schedule_id, department_id,
    schedule:schedules!shifts_tenant_schedule_fk ( id, name ),
    department:departments!shifts_tenant_department_fk (
      id, name,
      unit:units!departments_tenant_unit_fk ( id, name )
    )
  )
`;

type RawAssignmentRow = Pick<
  AssignmentRow,
  "id" | "shift_id" | "assignment_status" | "assigned_at"
> & {
  shift:
    | (Pick<
        ShiftRow,
        "starts_at" | "ends_at" | "status" | "role_required" | "schedule_id" | "department_id"
      > & {
        schedule: Pick<ScheduleRow, "id" | "name"> | null;
        department:
          | (Pick<DepartmentRow, "id" | "name"> & {
              unit: Pick<UnitRow, "id" | "name"> | null;
            })
          | null;
      })
    | null;
};

function toAssignmentListItem(row: RawAssignmentRow): AssignmentListItem | null {
  if (!row.shift) return null;
  return {
    assignmentId: row.id,
    shiftId: row.shift_id,
    status: row.assignment_status,
    assignedAt: row.assigned_at,
    shift: {
      startsAt: row.shift.starts_at,
      endsAt: row.shift.ends_at,
      status: row.shift.status,
      roleRequired:
        row.shift.role_required && row.shift.role_required.length > 0
          ? row.shift.role_required
          : null,
      scheduleId: row.shift.schedule_id,
      scheduleName: row.shift.schedule?.name ?? "—",
      departmentId: row.shift.department_id,
      departmentName: row.shift.department?.name ?? "—",
      unitName: row.shift.department?.unit?.name ?? null,
    },
  };
}

/**
 * Lista as atribuições do profissional autenticado (qualquer status).
 * Para usuários não-profissionais retorna lista vazia.
 */
export const listMyAssignmentsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<AssignmentListItem[]>> => {
    return runQuery(async (ctx) => {
      if (!ctx.professionalId) return [];
      const { data, error } = await ctx.client
        .from("shift_assignments")
        .select(ASSIGNMENT_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .eq("professional_id", ctx.professionalId)
        .order("assigned_at", { ascending: false })
        .limit(100)
        .returns<RawAssignmentRow[]>();
      if (error) throw mapPostgresError(error);
      return (data ?? [])
        .map(toAssignmentListItem)
        .filter((x): x is AssignmentListItem => x !== null);
    });
  },
);
