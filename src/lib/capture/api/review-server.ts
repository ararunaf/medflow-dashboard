/**
 * Server functions — Workspace de Revisão (MEDICFLOW-REVIEW-WORKSPACE-01).
 * EPC-24D: execução/leitura exclusivamente via Enterprise Runtime gateways.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  optionalString,
  requireObject,
  requireString,
  runMutation,
  runQuery,
} from "@/lib/server/fn-helpers";
import {
  getReviewWorkspaceSnapshotViaEnterprise,
  setReviewApprovalViaEnterprise,
} from "../enterprise/process-review-via-enterprise";
import type { ReviewApprovalStatus } from "../review/types";

function parseSessionId(raw: unknown): { sessionId: string } {
  return {
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  };
}

function parseApprovalInput(raw: unknown) {
  const obj = requireObject(raw);
  const status = requireString(obj.status, "status") as ReviewApprovalStatus;
  return {
    sessionId: requireString(obj.sessionId, "sessionId"),
    status,
    note: optionalString(obj.note, "note"),
  };
}

export const getReviewWorkspaceFn = createServerFn({ method: "GET" })
  .inputValidator(parseSessionId)
  .handler(async ({ data }) => {
    return runQuery((ctx) => getReviewWorkspaceSnapshotViaEnterprise(ctx, data.sessionId));
  });

export const setReviewApprovalFn = createServerFn({ method: "POST" })
  .inputValidator(parseApprovalInput)
  .handler(async ({ data }) => {
    return runMutation((ctx) => setReviewApprovalViaEnterprise(ctx, data));
  });
