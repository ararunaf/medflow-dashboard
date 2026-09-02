/**
 * Hooks de leitura operacional (TanStack Query).
 *
 * Cada hook:
 *  - retorna o resultado já desempacotado (`unwrap`) — erros viram
 *    `OperationalError` capturado pelo `error` do React Query;
 *  - usa key fortemente tipada do `opsKeys`;
 *  - mantém `staleTime` curto (5–15 s) para refletir alterações
 *    operacionais sem polling agressivo, deixando o usuário disparar
 *    `refetch` quando precisar.
 *
 * Estes hooks NÃO assumem realtime; estão prontos para receber
 * `invalidate` quando ele for ligado em fase futura.
 */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import {
  getDashboardFn,
  getMyAvailabilityFn,
  getMyContextFn,
  listMyAssignmentsFn,
  listMyShiftsFn,
  listMySwapsFn,
  listOpenShiftsFn,
  listPendingSwapsFn,
  listShiftsRangeFn,
  listSwapTargetProfessionalsFn,
  type AssignmentListItem,
  type AvailabilityWindowItem,
  type DashboardSummary,
  type MyContext,
  type ShiftListItem,
  type SwapListItem,
  type SwapTargetProfessional,
} from "@/lib/operations/api";

const DEFAULT_STALE_MS = 10_000;

type ReadOpts = {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean | "always";
};

// -------------------------------------------------------------------------
// Dashboard

export const dashboardQueryOptions = () =>
  queryOptions<DashboardSummary>({
    queryKey: opsKeys.dashboard(),
    queryFn: async () => unwrap(await getDashboardFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useDashboardQuery(opts: ReadOpts = {}) {
  return useQuery({ ...dashboardQueryOptions(), ...opts });
}

// -------------------------------------------------------------------------
// Shifts

export const openShiftsQueryOptions = () =>
  queryOptions<ShiftListItem[]>({
    queryKey: opsKeys.shiftsOpen(),
    queryFn: async () => unwrap(await listOpenShiftsFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useOpenShiftsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...openShiftsQueryOptions(), ...opts });
}

export const myShiftsQueryOptions = () =>
  queryOptions<ShiftListItem[]>({
    queryKey: opsKeys.shiftsMine(),
    queryFn: async () => unwrap(await listMyShiftsFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useMyShiftsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...myShiftsQueryOptions(), ...opts });
}

export const shiftsRangeQueryOptions = (fromISO?: string, toISO?: string) =>
  queryOptions<ShiftListItem[]>({
    queryKey: opsKeys.shiftsRange(fromISO, toISO),
    queryFn: async () => unwrap(await listShiftsRangeFn({ data: { fromISO, toISO } })),
    staleTime: DEFAULT_STALE_MS,
  });

export function useShiftsRangeQuery(fromISO?: string, toISO?: string, opts: ReadOpts = {}) {
  return useQuery({ ...shiftsRangeQueryOptions(fromISO, toISO), ...opts });
}

// -------------------------------------------------------------------------
// Assignments (atribuições do user)

export const myAssignmentsQueryOptions = () =>
  queryOptions<AssignmentListItem[]>({
    queryKey: opsKeys.assignmentsMine(),
    queryFn: async () => unwrap(await listMyAssignmentsFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useMyAssignmentsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...myAssignmentsQueryOptions(), ...opts });
}

// -------------------------------------------------------------------------
// Swaps

export const mySwapsQueryOptions = () =>
  queryOptions<SwapListItem[]>({
    queryKey: opsKeys.swapsMine(),
    queryFn: async () => unwrap(await listMySwapsFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useMySwapsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...mySwapsQueryOptions(), ...opts });
}

export const pendingSwapsQueryOptions = () =>
  queryOptions<SwapListItem[]>({
    queryKey: opsKeys.swapsPending(),
    queryFn: async () => unwrap(await listPendingSwapsFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function usePendingSwapsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...pendingSwapsQueryOptions(), ...opts });
}

export const swapTargetProfessionalsQueryOptions = () =>
  queryOptions<SwapTargetProfessional[]>({
    queryKey: opsKeys.swapTargets(),
    queryFn: async () => unwrap(await listSwapTargetProfessionalsFn()),
    staleTime: 60_000,
  });

export function useSwapTargetProfessionalsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...swapTargetProfessionalsQueryOptions(), ...opts });
}

// -------------------------------------------------------------------------
// Availability

export const myAvailabilityQueryOptions = () =>
  queryOptions<AvailabilityWindowItem[]>({
    queryKey: opsKeys.availabilityMine(),
    queryFn: async () => unwrap(await getMyAvailabilityFn()),
    staleTime: 30_000,
  });

export function useMyAvailabilityQuery(opts: ReadOpts = {}) {
  return useQuery({ ...myAvailabilityQueryOptions(), ...opts });
}

// -------------------------------------------------------------------------
// Me / contexto

export const myContextQueryOptions = () =>
  queryOptions<MyContext>({
    queryKey: opsKeys.me(),
    queryFn: async () => unwrap(await getMyContextFn()),
    staleTime: 60_000,
  });

export function useMyContextQuery(opts: ReadOpts = {}) {
  return useQuery({ ...myContextQueryOptions(), ...opts });
}
