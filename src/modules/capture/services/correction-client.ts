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
  UpdateCorrectionProposalInput,
} from "@/lib/capture/correction";

export type CaptureCorrectionProposalsView = {
  summary: CorrectionProposalSummaryMeta | null;
  store: CorrectionProposalStore | null;
};

export async function fetchCaptureCorrectionProposals(
  sessionId: string,
): Promise<CaptureCorrectionProposalsView> {
  const res = await getCaptureCorrectionProposalsFn({ data: { sessionId } });
  return {
    summary: (res.data.summary as CorrectionProposalSummaryMeta | null) ?? null,
    store: (res.data.store as CorrectionProposalStore | null) ?? null,
  };
}

export async function generateCaptureCorrectionProposals(
  sessionId: string,
): Promise<CorrectionProposalStore> {
  const res = await runCaptureCorrectionAssistantFn({ data: { sessionId } });
  return res.data.store as CorrectionProposalStore;
}

export async function decideCaptureCorrectionProposal(
  sessionId: string,
  input: Omit<UpdateCorrectionProposalInput, "sessionId">,
): Promise<CorrectionProposalStore> {
  const res = await updateCaptureCorrectionProposalFn({
    data: { sessionId, ...input },
  });
  return res.data as CorrectionProposalStore;
}

export async function downloadCorrectionProposalsJson(sessionId: string): Promise<string> {
  const res = await getCaptureCorrectionProposalsJsonDownloadFn({ data: { sessionId } });
  return res.data.signedUrl;
}
