/**
 * Server function de dashboard — aggregator otimizado para a home.
 *
 * Em uma única RPC traz:
 *  - métricas básicas (open shifts, confirmed mine, pending swaps);
 *  - agenda do dia (shifts entre 00h e 24h locais ao servidor);
 *  - sinalização de disponibilidade do profissional.
 *
 * O cliente consome via `useDashboardQuery` e usa `staleTime` curto para
 * permitir refresh manual sem hit excessivo de banco.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database } from "@/lib/database.types";

type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];
type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type DashboardTodayItem = {
  shiftId: string;
  startsAt: string;
  endsAt: string;
  departmentName: string;
  unitName: string | null;
  status: ShiftRow["status"];
  confirmedProfessionalName: string | null;
};

export type DashboardSummary = {
  metrics: {
    openShifts: number;
    confirmedThisWeek: number;
    pendingSwaps: number;
    availableForShifts: boolean;
  };
  today: DashboardTodayItem[];
};

function startOfDayISO(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayISO(d: Date): string {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
function endOfWeekISO(d: Date): string {
  const x = new Date(d);
  const day = x.getDay();
  const distanceToSunday = 7 - day;
  x.setDate(x.getDate() + distanceToSunday);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

type RawTodayRow = Pick<ShiftRow, "id" | "starts_at" | "ends_at" | "status"> & {
  department:
    | (Pick<DepartmentRow, "id" | "name"> & {
        unit: { id: string; name: string } | null;
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

export const getDashboardFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<DashboardSummary>> => {
    return runQuery(async (ctx) => {
      const now = new Date();
      const todayStart = startOfDayISO(now);
      const todayEnd = endOfDayISO(now);
      const weekEnd = endOfWeekISO(now);

      const openShiftsP = ctx.client
        .from("shifts")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("status", "open");

      // Para contar "confirmados esta semana" buscamos as linhas com starts_at
      // embutido — evita filtros em recurso aninhado, que dependem de FK
      // explícita no Supabase. O volume aqui é pequeno (assignments do user).
      const confirmedAssignmentsP = ctx.professionalId
        ? ctx.client
            .from("shift_assignments")
            .select("id, shift:shifts!shift_assignments_tenant_shift_fk ( starts_at )")
            .eq("tenant_id", ctx.tenantId)
            .eq("professional_id", ctx.professionalId)
            .eq("assignment_status", "confirmed")
            .limit(200)
        : null;

      const pendingSwapsP = ctx.professionalId
        ? ctx.client
            .from("shift_swap_requests")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", ctx.tenantId)
            .or(
              `requester_professional_id.eq.${ctx.professionalId},target_professional_id.eq.${ctx.professionalId}`,
            )
            .eq("status", "pending")
        : ctx.client
            .from("shift_swap_requests")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", ctx.tenantId)
            .eq("status", "pending");

      const availabilityP = ctx.professionalId
        ? ctx.client
            .from("availability")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", ctx.tenantId)
            .eq("professional_id", ctx.professionalId)
            .eq("available", true)
        : null;

      const todayP = ctx.client
        .from("shifts")
        .select(
          `id, starts_at, ends_at, status,
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
           )`,
        )
        .eq("tenant_id", ctx.tenantId)
        .gte("starts_at", todayStart)
        .lte("starts_at", todayEnd)
        .order("starts_at", { ascending: true })
        .limit(8)
        .returns<RawTodayRow[]>();

      const [openRes, confirmedRes, pendingSwapsRes, availabilityRes, todayRes] = await Promise.all(
        [openShiftsP, confirmedAssignmentsP, pendingSwapsP, availabilityP, todayP],
      );

      if (openRes.error) throw mapPostgresError(openRes.error);
      if (confirmedRes && confirmedRes.error) throw mapPostgresError(confirmedRes.error);
      if (pendingSwapsRes.error) throw mapPostgresError(pendingSwapsRes.error);
      if (availabilityRes && availabilityRes.error) throw mapPostgresError(availabilityRes.error);
      if (todayRes.error) throw mapPostgresError(todayRes.error);

      const weekEndMs = new Date(weekEnd).getTime();
      const todayStartMs = new Date(todayStart).getTime();
      type ConfirmedRow = { id: string; shift: { starts_at: string } | null };
      const confirmedThisWeek = ((confirmedRes?.data as ConfirmedRow[] | null) ?? []).filter(
        (r) => {
          if (!r.shift) return false;
          const t = new Date(r.shift.starts_at).getTime();
          return t >= todayStartMs && t <= weekEndMs;
        },
      ).length;

      const today: DashboardTodayItem[] = (todayRes.data ?? []).map((row) => {
        const confirmed = row.assignments.find((a) => a.assignment_status === "confirmed") ?? null;
        return {
          shiftId: row.id,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          status: row.status,
          departmentName: row.department?.name ?? "—",
          unitName: row.department?.unit?.name ?? null,
          confirmedProfessionalName: confirmed?.professional?.profile?.full_name ?? null,
        };
      });

      return {
        metrics: {
          openShifts: openRes.count ?? 0,
          confirmedThisWeek,
          pendingSwaps: pendingSwapsRes.count ?? 0,
          availableForShifts: (availabilityRes?.count ?? 0) > 0,
        },
        today,
      };
    });
  },
);
