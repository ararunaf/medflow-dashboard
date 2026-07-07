/**
 * Cliente — Workspace de Revisão.
 */
import { getReviewWorkspaceFn, setReviewApprovalFn } from "@/lib/capture/api/review-server";
import type { ReviewApprovalStatus } from "@/lib/capture/review";
import type { ReviewWorkspaceSnapshot } from "@/lib/capture/review/review-workspace-store";

export async function fetchReviewWorkspace(sessionId: string): Promise<ReviewWorkspaceSnapshot> {
  const res = await getReviewWorkspaceFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}

export async function submitReviewApproval(input: {
  sessionId: string;
  status: ReviewApprovalStatus;
  note?: string;
}): Promise<{ review: ReviewWorkspaceSnapshot["review"]; sessionStatus: string }> {
  const res = await setReviewApprovalFn({ data: input });
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}
