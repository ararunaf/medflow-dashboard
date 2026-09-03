/**
 * Server function de leitura para o detalhe completo de um plantão — F4-S3.
 *
 * Ao contrário de `ShiftListItem` (queries/shifts.ts), que só expõe a
 * atribuição confirmada + uma contagem de pendentes (o suficiente para uma
 * lista), aqui vai o histórico completo: toda atribuição (qualquer status)
 * e toda solicitação de troca vinculada a este plantão específico.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database } from "@/lib/database.types";
import { SWAP_LIST_SELECT, toSwapListItem, type RawSwapRow, type SwapListItem } from "./swaps";

type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["schedules"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];
type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];
type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ShiftDetailAssignment = {
  assignmentId: string;
  professionalId: string;
  professionalName: string;
  status: AssignmentRow["assignment_status"];
  assignedAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

export type ShiftDetail = {
  shiftId: string;
  scheduleId: string;
  scheduleName: string;
  departmentId: string;
  departmentName: string;
  unitId: string | null;
  unitName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  startsAt: string;
  endsAt: string;
  status: ShiftRow["status"];
  roleRequired: string | null;
  assignments: ShiftDetailAssignment[];
  swaps: SwapListItem[];
};

const SHIFT_DETAIL_SELECT = `
  id, schedule_id, department_id, starts_at, ends_at, status, role_required,
  schedule:schedules!shifts_tenant_schedule_fk ( id, name ),
  department:departments!shifts_tenant_department_fk (
    id, name,
    unit:units!departments_tenant_unit_fk (
      id, name,
      hospital:hospitals!units_tenant_hospital_fk ( id, name )
    )
  ),
  assignments:shift_assignments!shift_assignments_tenant_shift_fk (
    id, professional_id, assignment_status, assigned_at, checked_in_at, checked_out_at,
    professional:professionals!shift_assignments_tenant_professional_fk (
      id, profile:profiles!professionals_profile_id_fkey ( id, full_name )
    )
  )
`;

type RawShiftDetailRow = Pick<
  ShiftRow,
  "id" | "schedule_id" | "department_id" | "starts_at" | "ends_at" | "status" | "role_required"
> & {
  schedule: Pick<ScheduleRow, "id" | "name"> | null;
  department:
    | (Pick<DepartmentRow, "id" | "name"> & {
        unit:
          | (Pick<UnitRow, "id" | "name"> & {
              hospital: Pick<HospitalRow, "id" | "name"> | null;
            })
          | null;
      })
    | null;
  assignments: Array<
    Pick<
      AssignmentRow,
      "id" | "professional_id" | "assignment_status" | "assigned_at" | "checked_in_at" | "checked_out_at"
    > & {
      professional:
        | (Pick<ProfessionalRow, "id"> & {
            profile: Pick<ProfileRow, "id" | "full_name"> | null;
          })
        | null;
    }
  >;
};

export const getShiftDetailFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown): { shiftId: string } => {
    const obj = requireObject(raw);
    return { shiftId: expectUuid(obj.shiftId, "shiftId") };
  })
  .handler(async ({ data }): Promise<QueryResult<ShiftDetail | null>> => {
    return runQuery(async (ctx) => {
      const { data: row, error } = await ctx.client
        .from("shifts")
        .select(SHIFT_DETAIL_SELECT)
        .eq("id", data.shiftId)
        .eq("tenant_id", ctx.tenantId)
        .maybeSingle()
        .returns<RawShiftDetailRow | null>();
      if (error) throw mapPostgresError(error);
      if (!row) return null;

      const { data: swapRows, error: swapErr } = await ctx.client
        .from("shift_swap_requests")
        .select(SWAP_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .eq("shift_id", data.shiftId)
        .order("requested_at", { ascending: false })
        .returns<RawSwapRow[]>();
      if (swapErr) throw mapPostgresError(swapErr);

      const assignments: ShiftDetailAssignment[] = row.assignments
        .map((a) => ({
          assignmentId: a.id,
          professionalId: a.professional_id,
          professionalName: a.professional?.profile?.full_name ?? "—",
          status: a.assignment_status,
          assignedAt: a.assigned_at,
          checkedInAt: a.checked_in_at,
          checkedOutAt: a.checked_out_at,
        }))
        .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));

      const detail: ShiftDetail = {
        shiftId: row.id,
        scheduleId: row.schedule_id,
        scheduleName: row.schedule?.name ?? "—",
        departmentId: row.department_id,
        departmentName: row.department?.name ?? "—",
        unitId: row.department?.unit?.id ?? null,
        unitName: row.department?.unit?.name ?? null,
        hospitalId: row.department?.unit?.hospital?.id ?? null,
        hospitalName: row.department?.unit?.hospital?.name ?? null,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        roleRequired: row.role_required && row.role_required.length > 0 ? row.role_required : null,
        assignments,
        swaps: (swapRows ?? []).map((s) => toSwapListItem(s, ctx.professionalId)),
      };
      return detail;
    });
  });
