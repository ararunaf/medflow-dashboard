import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildReleaseChecklistsFn,
  exportBackupByKindFn,
  getProductionReleaseBundleFn,
  getPublicLandingContentFn,
  runSmokeTestsFn,
  type ProductionReleaseBundle,
  type ReleaseChecklistInput,
} from "@/lib/production-release/api/production-release-server";
import type { BackupExportKind } from "@/lib/services/backup-readiness/backup-readiness-service";
import type { SmokeTestReport } from "@/lib/services/smoke-test/smoke-test-service";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import type { MutationResult, QueryResult } from "@/lib/server/fn-helpers";
import type { CommercialLandingContent } from "@/lib/services/commercial-landing/commercial-landing-service";

export function productionReleaseQueryOptions() {
  return queryOptions<ProductionReleaseBundle>({
    queryKey: opsKeys.productionRelease(),
    queryFn: async () =>
      unwrap((await getProductionReleaseBundleFn()) as QueryResult<ProductionReleaseBundle>),
    staleTime: 45_000,
  });
}

export function useProductionReleaseQuery() {
  return useQuery(productionReleaseQueryOptions());
}

export function publicLandingQueryOptions() {
  return queryOptions<CommercialLandingContent>({
    queryKey: opsKeys.publicLanding(),
    queryFn: async () => {
      const res = await getPublicLandingContentFn();
      if (!res.ok) throw new Error("Falha ao carregar landing.");
      return res.data;
    },
    staleTime: 300_000,
  });
}

export function usePublicLandingQuery() {
  return useQuery(publicLandingQueryOptions());
}

export function useRunSmokeTestsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<SmokeTestReport> =>
      unwrap((await runSmokeTestsFn({ data: {} })) as MutationResult<SmokeTestReport>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.productionRelease() });
    },
  });
}

export function useExportBackupMutation() {
  return useMutation({
    mutationFn: async (kind: BackupExportKind) =>
      unwrap((await exportBackupByKindFn({ data: { kind } })) as MutationResult<unknown>),
  });
}

export function useBuildReleaseChecklistsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReleaseChecklistInput) =>
      unwrap((await buildReleaseChecklistsFn({ data: input })) as QueryResult<unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.productionRelease() });
    },
  });
}
