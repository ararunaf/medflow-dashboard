/**
 * TissBatchEngine — H-05.
 *
 * Catálogo de lotes de submissões TISS.
 * Reutiliza TissSubmissionEngine (H-04) e sua cadeia.
 * Não processa retornos, status, retry ou auditoria.
 */
import {
  H05_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissSubmissionEngine } from "../submission";

export interface TissBatch {
  readonly kind: "tiss-batch";
  readonly batchId: string;
  readonly name: string;
  readonly submissionIds: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface TissBatchResult {
  readonly ok: boolean;
  readonly batchId?: string;
  readonly code: string;
  readonly message: string;
  readonly batch?: TissBatch | null;
}

export interface TissBatchStats {
  readonly totalBatches: number;
  readonly batchIds: readonly string[];
  readonly totalSubmissions: number;
  readonly submissionIds: readonly string[];
}

export class TissBatchEngine {
  private readonly submission: TissSubmissionEngine;
  private readonly batches = new Map<string, TissBatch>();

  constructor(submission: TissSubmissionEngine = new TissSubmissionEngine()) {
    this.submission = submission;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H05_TISS_INTEGRATION_CAPABILITIES;
  }

  registerBatch(batch: TissBatch): TissBatchResult {
    if (!batch.batchId || batch.batchId.trim() === "") {
      return {
        ok: false,
        code: "TISS_BATCH_INVALID_BATCH_ID",
        message: "batchId is required",
      };
    }
    if (!batch.name || batch.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_BATCH_INVALID_NAME",
        message: "name is required",
      };
    }
    if (!batch.submissionIds || batch.submissionIds.length === 0) {
      return {
        ok: false,
        code: "TISS_BATCH_EMPTY_SUBMISSIONS",
        message: "submissionIds cannot be empty",
      };
    }

    for (const submissionId of batch.submissionIds) {
      const sub = this.submission.findSubmission(submissionId);
      if (!sub) {
        return {
          ok: false,
          code: "TISS_BATCH_SUBMISSION_NOT_FOUND",
          message: `submission ${submissionId} not found`,
        };
      }
    }

    this.batches.set(batch.batchId, batch);

    return {
      ok: true,
      batchId: batch.batchId,
      code: "TISS_BATCH_REGISTERED",
      message: "batch registered",
      batch,
    };
  }

  findBatch(batchId: string): TissBatch | undefined {
    return this.batches.get(batchId);
  }

  listBatches(): TissBatch[] {
    return Array.from(this.batches.values());
  }

  stats(): TissBatchStats {
    const all = this.listBatches();
    const allSubmissionIds = new Set<string>();
    for (const batch of all) {
      for (const id of batch.submissionIds) allSubmissionIds.add(id);
    }
    return {
      totalBatches: all.length,
      batchIds: all.map((b) => b.batchId),
      totalSubmissions: allSubmissionIds.size,
      submissionIds: Array.from(allSubmissionIds),
    };
  }
}
