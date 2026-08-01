/**
 * Cliente — Workspace de Revisão.
 */
import { getReviewWorkspaceFn, setReviewApprovalFn } from "@/lib/capture/api/review-server";
import type { ReviewApprovalStatus } from "@/lib/capture/review";
import type { ReviewWorkspaceSnapshot } from "@/lib/capture/review/review-workspace-store";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export async function fetchReviewWorkspace(sessionId: string): Promise<ReviewWorkspaceSnapshot> {
  const res = (await getReviewWorkspaceFn({
    data: { sessionId },
  })) as QueryResult<ReviewWorkspaceSnapshot>;
  return unwrap<ReviewWorkspaceSnapshot>(res);
}

type ApprovalResult = {
  review: ReviewWorkspaceSnapshot["review"];
  sessionStatus: string;
};

export async function submitReviewApproval(input: {
  sessionId: string;
  status: ReviewApprovalStatus;
  note?: string;
}): Promise<ApprovalResult> {
  const res = (await setReviewApprovalFn({ data: input })) as MutationResult<ApprovalResult>;
  return unwrap<ApprovalResult>(res);
}
