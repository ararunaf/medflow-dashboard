import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ensurePilotFeatureFlagsFn,
  exportPilotIncidentsFn,
  getPilotExecutionBundleFn,
  recordPilotAdoptionEventFn,
  reportPilotIncidentFn,
  setPilotFeatureFlagFn,
  submitPilotFeedbackFn,
  submitPilotSuggestionFn,
  updatePilotIncidentFn,
} from "@/lib/pilot-execution/api/pilot-execution-server";
import type { PilotExecutionBundle } from "@/lib/pilot-execution/api/pilot-execution-server";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import type { MutationResult, QueryResult } from "@/lib/server/fn-helpers";
import type { PilotAdoptionEventType } from "@/lib/services/pilot-execution";

export function pilotExecutionQueryOptions(onboardingPercent = 0) {
  return queryOptions<PilotExecutionBundle>({
    queryKey: opsKeys.pilotExecution(onboardingPercent),
    queryFn: async () =>
      unwrap(
        (await getPilotExecutionBundleFn({
          data: { onboardingPercent },
        })) as QueryResult<PilotExecutionBundle>,
      ),
    staleTime: 20_000,
  });
}

export function usePilotExecutionQuery(onboardingPercent = 0) {
  return useQuery(pilotExecutionQueryOptions(onboardingPercent));
}

function invalidatePilot(qc: ReturnType<typeof useQueryClient>, onboardingPercent = 0) {
  void qc.invalidateQueries({ queryKey: opsKeys.pilotExecution(onboardingPercent) });
}

export function useSubmitPilotFeedbackMutation(onboardingPercent = 0) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrap(await submitPilotFeedbackFn({ data: payload })),
    onSuccess: () => invalidatePilot(qc, onboardingPercent),
  });
}

export function useSubmitPilotSuggestionMutation(onboardingPercent = 0) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrap(await submitPilotSuggestionFn({ data: payload })),
    onSuccess: () => invalidatePilot(qc, onboardingPercent),
  });
}

export function useReportPilotIncidentMutation(onboardingPercent = 0) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrap(await reportPilotIncidentFn({ data: payload })),
    onSuccess: () => invalidatePilot(qc, onboardingPercent),
  });
}

export function useUpdatePilotIncidentMutation(onboardingPercent = 0) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrap(await updatePilotIncidentFn({ data: payload })),
    onSuccess: () => invalidatePilot(qc, onboardingPercent),
  });
}

export function useSetPilotFeatureFlagMutation(onboardingPercent = 0) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { flagKey: string; enabled: boolean }) =>
      unwrap(await setPilotFeatureFlagFn({ data: payload })),
    onSuccess: () => invalidatePilot(qc, onboardingPercent),
  });
}

export function useEnsurePilotFlagsMutation(onboardingPercent = 0) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await ensurePilotFeatureFlagsFn({ data: {} })),
    onSuccess: () => invalidatePilot(qc, onboardingPercent),
  });
}

export function useRecordPilotAdoptionMutation() {
  return useMutation({
    mutationFn: async (payload: {
      eventType: PilotAdoptionEventType;
      module: string;
      metadata?: Record<string, unknown>;
    }) => unwrap(await recordPilotAdoptionEventFn({ data: payload })),
  });
}

export function useExportPilotIncidentsMutation() {
  return useMutation({
    mutationFn: async () => unwrap(await exportPilotIncidentsFn()),
  });
}
