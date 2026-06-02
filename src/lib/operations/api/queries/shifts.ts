/**
 * Server functions de leitura para plantões (shifts).
 *
 * Toda chamada roda sob o JWT do usuário autenticado — RLS garante o
 * isolamento por tenant. As funções abaixo retornam `QueryResult<T>`
 * (`{ ok: true, data } | { ok: false, error }`), permitindo que o cliente
 * trate erros de domínio sem stack traces vazadas.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database } from "@/lib/database.types";

type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["schedules"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];
type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Forma "achatada" usada pelas listagens da UI — combina shift + escala +
 * setor/unidade + (opcional) atribuição/profissional confirmado.
 */
export type ShiftListItem = {
  shiftId: string;
  scheduleId: string;
  scheduleName: string;
  departmentId: string;
  departmentName: string;
  unitId: string | null;
  unitName: string | null;
  startsAt: string;
  endsAt: string;
  status: ShiftRow["status"];
  roleRequired: string | null;
  confirmedAssignmentId: string | null;
  confirmedProfessionalId: string | null;
  confirmedProfessionalName: string | null;
  /** Contagem de atribuições `pending` neste plantão (atalhos operacionais / filtros). */
  pendingAssignmentCount: number;
  /**
   * Heurística alinhada ao agregador do command center: múltiplas pendências no mesmo plantão
   * ou plantão aberto com início já passado.
   */
  operationalConflictHint: boolean;
};

export const SHIFT_LIST_SELECT = `
  id, schedule_id, department_id, starts_at, ends_at, status, role_required,
  schedule:schedules!shifts_tenant_schedule_fk ( id, name ),
  department:departments!shifts_tenant_department_fk (
    id, name,
    unit:units!departments_tenant_unit_fk ( id, name )
  ),
  assignments:shift_assignments!shift_assignments_tenant_shift_fk (
    id, professional_id, assignment_status,
    professional:professionals!shift_assignments_tenant_professional_fk (
      id,
      profile:profiles!professionals_profile_id_fkey ( id, full_name )
    )
  )
`;

export type RawShiftRow = Pick<
  ShiftRow,
  "id" | "schedule_id" | "department_id" | "starts_at" | "ends_at" | "status" | "role_required"
> & {
  schedule: Pick<ScheduleRow, "id" | "name"> | null;
  department:
    | (Pick<DepartmentRow, "id" | "name"> & {
        unit: Pick<UnitRow, "id" | "name"> | null;
      })
    | null;
  assignments: Array<
    Pick<AssignmentRow, "id" | "professional_id" | "assignment_status"> & {
      professional:
        | (Pick<ProfessionalRow, "id"> & {
            profile: Pick<ProfileRow, "id" | "full_name"> | null;
          })
        | null;
    }
  >;
};

export function toShiftListItem(row: RawShiftRow): ShiftListItem {
  const assigns = row.assignments ?? [];
  const confirmed = assigns.find((a) => a.assignment_status === "confirmed") ?? null;
  let pendingAssignmentCount = 0;
  for (const a of assigns) {
    if (a.assignment_status === "pending") pendingAssignmentCount += 1;
  }
  const startMs = new Date(row.starts_at).getTime();
  const overdueOpen = row.status === "open" && !Number.isNaN(startMs) && startMs < Date.now();
  const operationalConflictHint = pendingAssignmentCount > 1 || overdueOpen;

  return {
    shiftId: row.id,
    scheduleId: row.schedule_id,
    scheduleName: row.schedule?.name ?? "—",
    departmentId: row.department_id,
    departmentName: row.department?.name ?? "—",
    unitId: row.department?.unit?.id ?? null,
    unitName: row.department?.unit?.name ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    roleRequired: row.role_required && row.role_required.length > 0 ? row.role_required : null,
    confirmedAssignmentId: confirmed?.id ?? null,
    confirmedProfessionalId: confirmed?.professional_id ?? null,
    confirmedProfessionalName: confirmed?.professional?.profile?.full_name ?? null,
    pendingAssignmentCount,
    operationalConflictHint,
  };
}

/**
 * Lista os plantões abertos (status='open') do tenant — vista do profissional
 * em busca de novos plantões. Ordenado por `starts_at` crescente, limitado.
 */
export const listOpenShiftsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<ShiftListItem[]>> => {
    return runQuery(async (ctx) => {
      const { data, error } = await ctx.client
        .from("shifts")
        .select(SHIFT_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .eq("status", "open")
        .order("starts_at", { ascending: true })
        .limit(50)
        .returns<RawShiftRow[]>();
      if (error) throw mapPostgresError(error);
      return (data ?? []).map(toShiftListItem);
    });
  },
);

/**
 * Lista os plantões com atribuição do profissional autenticado
 * (status pending/confirmed). Para roles managers retorna lista vazia
 * — managers usam a visão de escala (`listScheduleShiftsFn`).
 */
export const listMyShiftsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<ShiftListItem[]>> => {
    return runQuery(async (ctx) => {
      if (!ctx.professionalId) return [];

      const { data: assignments, error: assignErr } = await ctx.client
        .from("shift_assignments")
        .select("shift_id")
        .eq("tenant_id", ctx.tenantId)
        .eq("professional_id", ctx.professionalId)
        .in("assignment_status", ["pending", "confirmed"]);
      if (assignErr) throw mapPostgresError(assignErr);

      const shiftIds = Array.from(new Set((assignments ?? []).map((a) => a.shift_id)));
      if (shiftIds.length === 0) return [];

      const { data, error } = await ctx.client
        .from("shifts")
        .select(SHIFT_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .in("id", shiftIds)
        .order("starts_at", { ascending: true })
        .returns<RawShiftRow[]>();
      if (error) throw mapPostgresError(error);
      return (data ?? []).map(toShiftListItem);
    });
  },
);

/**
 * Lista shifts em um intervalo de datas — usado pela tela de escalas.
 * Faixa default: próximos 30 dias.
 */
export const listShiftsRangeFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown): { fromISO?: string; toISO?: string } => {
    if (raw == null) return {};
    if (typeof raw !== "object" || Array.isArray(raw)) return {};
    const obj = raw as Record<string, unknown>;
    const fromISO = typeof obj.fromISO === "string" ? obj.fromISO : undefined;
    const toISO = typeof obj.toISO === "string" ? obj.toISO : undefined;
    return { fromISO, toISO };
  })
  .handler(async ({ data }): Promise<QueryResult<ShiftListItem[]>> => {
    return runQuery(async (ctx) => {
      const now = new Date();
      const from = data.fromISO ? new Date(data.fromISO) : now;
      const to = data.toISO
        ? new Date(data.toISO)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: rows, error } = await ctx.client
        .from("shifts")
        .select(SHIFT_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .gte("starts_at", from.toISOString())
        .lte("starts_at", to.toISOString())
        .order("starts_at", { ascending: true })
        .limit(200)
        .returns<RawShiftRow[]>();
      if (error) throw mapPostgresError(error);
      return (rows ?? []).map(toShiftListItem);
    });
  });
