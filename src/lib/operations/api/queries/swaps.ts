/**
 * Server functions de leitura para trocas (shift_swap_requests).
 *
 * Para profissionais: lista trocas onde sou requester OU target.
 * Para managers: lista trocas pendentes do tenant para aprovação.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database } from "@/lib/database.types";

type SwapRow = Database["public"]["Tables"]["shift_swap_requests"]["Row"];
type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type SwapListItem = {
  swapId: string;
  status: SwapRow["status"];
  requestedAt: string;
  shiftId: string;
  requesterProfessionalId: string;
  requesterName: string | null;
  targetProfessionalId: string;
  targetName: string | null;
  isRequester: boolean;
  isTarget: boolean;
  shift: {
    startsAt: string;
    endsAt: string;
    departmentName: string;
  };
};

export const SWAP_LIST_SELECT = `
  id, status, requested_at, shift_id, requester_professional_id, target_professional_id,
  shift:shifts!shift_swap_requests_tenant_shift_fk (
    starts_at, ends_at,
    department:departments!shifts_tenant_department_fk ( id, name )
  ),
  requester:professionals!shift_swap_requests_tenant_requester_fk (
    id, profile:profiles!professionals_profile_id_fkey ( id, full_name )
  ),
  target:professionals!shift_swap_requests_tenant_target_fk (
    id, profile:profiles!professionals_profile_id_fkey ( id, full_name )
  )
`;

export type RawSwapRow = Pick<
  SwapRow,
  | "id"
  | "status"
  | "requested_at"
  | "shift_id"
  | "requester_professional_id"
  | "target_professional_id"
> & {
  shift:
    | (Pick<ShiftRow, "starts_at" | "ends_at"> & {
        department: Pick<DepartmentRow, "id" | "name"> | null;
      })
    | null;
  requester:
    | (Pick<ProfessionalRow, "id"> & {
        profile: Pick<ProfileRow, "id" | "full_name"> | null;
      })
    | null;
  target:
    | (Pick<ProfessionalRow, "id"> & {
        profile: Pick<ProfileRow, "id" | "full_name"> | null;
      })
    | null;
};

export function toSwapListItem(row: RawSwapRow, selfProfessionalId: string | null): SwapListItem {
  return {
    swapId: row.id,
    status: row.status,
    requestedAt: row.requested_at,
    shiftId: row.shift_id,
    requesterProfessionalId: row.requester_professional_id,
    requesterName: row.requester?.profile?.full_name ?? null,
    targetProfessionalId: row.target_professional_id,
    targetName: row.target?.profile?.full_name ?? null,
    isRequester: row.requester_professional_id === selfProfessionalId,
    isTarget: row.target_professional_id === selfProfessionalId,
    shift: {
      startsAt: row.shift?.starts_at ?? "",
      endsAt: row.shift?.ends_at ?? "",
      departmentName: row.shift?.department?.name ?? "—",
    },
  };
}

/**
 * Trocas vinculadas ao profissional autenticado (qualquer papel:
 * solicitante ou alvo). Para roles não-profissional, retorna lista vazia.
 */
export const listMySwapsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<SwapListItem[]>> => {
    return runQuery(async (ctx) => {
      if (!ctx.professionalId) return [];
      const { data, error } = await ctx.client
        .from("shift_swap_requests")
        .select(SWAP_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .or(
          `requester_professional_id.eq.${ctx.professionalId},target_professional_id.eq.${ctx.professionalId}`,
        )
        .order("requested_at", { ascending: false })
        .limit(50)
        .returns<RawSwapRow[]>();
      if (error) throw mapPostgresError(error);
      return (data ?? []).map((r) => toSwapListItem(r, ctx.professionalId));
    });
  },
);

/**
 * Trocas pendentes do tenant — visão para managers (coordinator/admin)
 * aprovarem ou negarem.
 */
export const listPendingSwapsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<SwapListItem[]>> => {
    return runQuery(async (ctx) => {
      const { data, error } = await ctx.client
        .from("shift_swap_requests")
        .select(SWAP_LIST_SELECT)
        .eq("tenant_id", ctx.tenantId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false })
        .limit(100)
        .returns<RawSwapRow[]>();
      if (error) throw mapPostgresError(error);
      return (data ?? []).map((r) => toSwapListItem(r, ctx.professionalId));
    });
  },
);
