/**
 * Hooks de métricas operacionais (command center).
 *
 * Uma única query agregada no servidor evita múltiplos round-trips e
 * rerenders em cascata; o realtime invalida `opsKeys.commandCenter()`.
 */
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getOperationalCommandCenterFn,
  type OperationalCommandCenterSnapshot,
} from "@/lib/operations/api/queries/command-center";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

const DEFAULT_STALE_MS = 10_000;

type ReadOpts = {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean | "always";
};

export const operationalCommandCenterQueryOptions = () =>
  queryOptions<OperationalCommandCenterSnapshot>({
    queryKey: opsKeys.commandCenter(),
    queryFn: async () => unwrap(await getOperationalCommandCenterFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useOperationalCommandCenterQuery(opts: ReadOpts = {}) {
  return useQuery({ ...operationalCommandCenterQueryOptions(), ...opts });
}
