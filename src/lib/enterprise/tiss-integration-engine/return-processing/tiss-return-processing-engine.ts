/**
 * TissReturnProcessingEngine — H-06.
 *
 * Processamento de retornos TISS.
 * Reutiliza TissSubmissionEngine (H-04) e TissBatchEngine (H-05).
 * Não implementa status tracking, retry, auditoria ou envio real.
 */
import {
  H06_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissSubmissionEngine } from "../submission";
import { TissBatchEngine } from "../batch";

export interface TissReturn {
  readonly kind: "tiss-return";
  readonly returnId: string;
  readonly submissionId?: string;
  readonly batchId?: string;
  readonly status: TissReturnStatus;
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
}

export type TissReturnStatus = "accepted" | "rejected" | "pending-correction" | "warning";

export interface TissReturnResult {
  readonly ok: boolean;
  readonly returnId?: string;
  readonly code: string;
  readonly message: string;
  readonly return?: TissReturn | null;
}

export interface TissReturnStats {
  readonly totalReturns: number;
  readonly returnIds: readonly string[];
  readonly byStatus: Record<TissReturnStatus, number>;
}

export class TissReturnProcessingEngine {
  private readonly submission: TissSubmissionEngine;
  private readonly batch: TissBatchEngine;
  private readonly returns = new Map<string, TissReturn>();

  constructor(
    submission: TissSubmissionEngine = new TissSubmissionEngine(),
    batch: TissBatchEngine = new TissBatchEngine(submission),
  ) {
    this.submission = submission;
    this.batch = batch;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H06_TISS_INTEGRATION_CAPABILITIES;
  }

  processReturn(returnItem: TissReturn): TissReturnResult {
    if (!returnItem.returnId || returnItem.returnId.trim() === "") {
      return {
        ok: false,
        code: "TISS_RETURN_INVALID_ID",
        message: "returnId is required",
      };
    }
    if (!returnItem.status) {
      return {
        ok: false,
        code: "TISS_RETURN_INVALID_STATUS",
        message: "status is required",
      };
    }
    if (!returnItem.submissionId && !returnItem.batchId) {
      return {
        ok: false,
        code: "TISS_RETURN_MISSING_REFERENCE",
        message: "submissionId or batchId is required",
      };
    }

    if (returnItem.submissionId) {
      const sub = this.submission.findSubmission(returnItem.submissionId);
      if (!sub) {
        return {
          ok: false,
          code: "TISS_RETURN_SUBMISSION_NOT_FOUND",
          message: `submission ${returnItem.submissionId} not found`,
        };
      }
    }

    if (returnItem.batchId) {
      const b = this.batch.findBatch(returnItem.batchId);
      if (!b) {
        return {
          ok: false,
          code: "TISS_RETURN_BATCH_NOT_FOUND",
          message: `batch ${returnItem.batchId} not found`,
        };
      }
    }

    this.returns.set(returnItem.returnId, returnItem);

    return {
      ok: true,
      returnId: returnItem.returnId,
      code: "TISS_RETURN_PROCESSED",
      message: "return processed",
      return: returnItem,
    };
  }

  findReturn(returnId: string): TissReturn | undefined {
    return this.returns.get(returnId);
  }

  listReturns(): TissReturn[] {
    return Array.from(this.returns.values());
  }

  stats(): TissReturnStats {
    const all = this.listReturns();
    const byStatus: Record<TissReturnStatus, number> = {
      accepted: 0,
      rejected: 0,
      "pending-correction": 0,
      warning: 0,
    };
    for (const item of all) {
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    }
    return {
      totalReturns: all.length,
      returnIds: all.map((r) => r.returnId),
      byStatus,
    };
  }
}
