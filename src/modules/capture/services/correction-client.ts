/**
 * Cliente — consulta, decisão e download de CorrectionProposals.
 */
import {
  getCaptureCorrectionProposalsFn,
  getCaptureCorrectionProposalsJsonDownloadFn,
  runCaptureCorrectionAssistantFn,
  updateCaptureCorrectionProposalFn,
} from "@/lib/capture/api/capture-server";
import type {
  CorrectionProposalStore,
  CorrectionProposalSummaryMeta,
  GenerateCorrectionProposalsResult,
  UpdateCorrectionProposalInput,
} from "@/lib/capture/correction";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export type CaptureCorrectionProposalsView = {
  summary: CorrectionProposalSummaryMeta | null;
  store: CorrectionProposalStore | null;
};

type CorrectionProposalsFnData = {
  summary: unknown;
  store: unknown;
};

export async function fetchCaptureCorrectionProposals(
  sessionId: string,
): Promise<CaptureCorrectionProposalsView> {
  const res = (await getCaptureCorrectionProposalsFn({
    data: { sessionId },
  })) as QueryResult<CorrectionProposalsFnData>;
  const data = unwrap<CorrectionProposalsFnData>(res);
  return {
    summary: (data.summary as CorrectionProposalSummaryMeta | null) ?? null,
    store: (data.store as CorrectionProposalStore | null) ?? null,
  };
}

export async function generateCaptureCorrectionProposals(
  sessionId: string,
): Promise<CorrectionProposalStore> {
  const res = (await runCaptureCorrectionAssistantFn({
    data: { sessionId },
  })) as MutationResult<GenerateCorrectionProposalsResult>;
  return unwrap<GenerateCorrectionProposalsResult>(res).store;
}

export async function decideCaptureCorrectionProposal(
  sessionId: string,
  input: Omit<UpdateCorrectionProposalInput, "sessionId">,
): Promise<CorrectionProposalStore> {
  const res = (await updateCaptureCorrectionProposalFn({
    data: { sessionId, ...input },
  })) as MutationResult<CorrectionProposalStore>;
  return unwrap<CorrectionProposalStore>(res);
}

export async function downloadCorrectionProposalsJson(sessionId: string): Promise<string> {
  const res = (await getCaptureCorrectionProposalsJsonDownloadFn({
    data: { sessionId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(res).signedUrl;
}
