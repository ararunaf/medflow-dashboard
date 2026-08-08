/**
 * TissRetryEngine — H-08.
 *
 * Gerenciamento de tentativas automáticas (Retry) de integrações TISS.
 * Reutiliza TissCommunicationEngine, TissSoapEngine, TissAuthenticationEngine,
 * TissSubmissionEngine, TissBatchEngine, TissReturnProcessingEngine e TissStatusTrackingEngine.
 * Não implementa auditoria, integração genérica, envio, SOAP, autenticação,
 * processamento de retorno, rastreamento de status ou qualquer lógica das demais engines.
 */
import {
  H08_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissSubmissionEngine } from "../submission";
import { TissBatchEngine } from "../batch";
import { TissReturnProcessingEngine } from "../return-processing";

export interface TissRetryPolicy {
  readonly kind: "tiss-retry-policy";
  readonly policyId: string;
  readonly name: string;
  readonly maxAttempts: number;
  readonly delayMs: number;
  readonly backoffMultiplier: number;
  readonly retryableStatuses: readonly string[];
}

export interface TissRetryAttempt {
  readonly kind: "tiss-retry-attempt";
  readonly attemptId: string;
  readonly entityType: "submission" | "batch" | "return";
  readonly entityId: string;
  readonly policyId: string;
  readonly attemptNumber: number;
  readonly status: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface TissRetryResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly attempt?: TissRetryAttempt | null;
}

export interface TissRetryStats {
  readonly totalAttempts: number;
  readonly byEntity: Record<string, number>;
  readonly byPolicy: Record<string, number>;
  readonly byStatus: Record<string, number>;
}

export class TissRetryEngine {
  private readonly submission: TissSubmissionEngine;
  private readonly batch: TissBatchEngine;
  private readonly returns: TissReturnProcessingEngine;
  private readonly policies = new Map<string, TissRetryPolicy>();
  private readonly attempts = new Map<string, TissRetryAttempt[]>();

  constructor(
    submission: TissSubmissionEngine = new TissSubmissionEngine(),
    batch: TissBatchEngine = new TissBatchEngine(submission),
    returns: TissReturnProcessingEngine = new TissReturnProcessingEngine(submission, batch),
  ) {
    this.submission = submission;
    this.batch = batch;
    this.returns = returns;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H08_TISS_INTEGRATION_CAPABILITIES;
  }

  registerPolicy(policy: TissRetryPolicy): TissRetryResult {
    if (!policy.policyId || policy.policyId.trim() === "") {
      return { ok: false, code: "TISS_RETRY_INVALID_POLICY_ID", message: "policyId is required" };
    }
    if (policy.maxAttempts <= 0) {
      return {
        ok: false,
        code: "TISS_RETRY_INVALID_MAX_ATTEMPTS",
        message: "maxAttempts must be positive",
      };
    }
    if (policy.delayMs < 0) {
      return {
        ok: false,
        code: "TISS_RETRY_INVALID_DELAY",
        message: "delayMs must be non-negative",
      };
    }
    if (policy.backoffMultiplier < 1) {
      return {
        ok: false,
        code: "TISS_RETRY_INVALID_BACKOFF",
        message: "backoffMultiplier must be >= 1",
      };
    }
    this.policies.set(policy.policyId, policy);
    return { ok: true, code: "TISS_RETRY_POLICY_REGISTERED", message: "policy registered" };
  }

  findPolicy(policyId: string): TissRetryPolicy | undefined {
    return this.policies.get(policyId);
  }

  scheduleAttempt(attempt: TissRetryAttempt): TissRetryResult {
    if (!attempt.attemptId || attempt.attemptId.trim() === "") {
      return { ok: false, code: "TISS_RETRY_INVALID_ATTEMPT_ID", message: "attemptId is required" };
    }
    if (!attempt.entityId || attempt.entityId.trim() === "") {
      return { ok: false, code: "TISS_RETRY_INVALID_ENTITY_ID", message: "entityId is required" };
    }
    if (!attempt.policyId || attempt.policyId.trim() === "") {
      return { ok: false, code: "TISS_RETRY_INVALID_POLICY_ID", message: "policyId is required" };
    }
    const policy = this.policies.get(attempt.policyId);
    if (!policy) {
      return {
        ok: false,
        code: "TISS_RETRY_POLICY_NOT_FOUND",
        message: `policy ${attempt.policyId} not found`,
      };
    }

    switch (attempt.entityType) {
      case "submission": {
        if (!this.submission.findSubmission(attempt.entityId)) {
          return {
            ok: false,
            code: "TISS_RETRY_SUBMISSION_NOT_FOUND",
            message: `submission ${attempt.entityId} not found`,
          };
        }
        break;
      }
      case "batch": {
        if (!this.batch.findBatch(attempt.entityId)) {
          return {
            ok: false,
            code: "TISS_RETRY_BATCH_NOT_FOUND",
            message: `batch ${attempt.entityId} not found`,
          };
        }
        break;
      }
      case "return": {
        if (!this.returns.findReturn(attempt.entityId)) {
          return {
            ok: false,
            code: "TISS_RETRY_RETURN_NOT_FOUND",
            message: `return ${attempt.entityId} not found`,
          };
        }
        break;
      }
      default:
        return {
          ok: false,
          code: "TISS_RETRY_INVALID_ENTITY_TYPE",
          message: `invalid entityType ${attempt.entityType}`,
        };
    }

    const previous = this.attempts.get(attempt.entityId) ?? [];
    if (previous.length >= policy.maxAttempts) {
      return {
        ok: false,
        code: "TISS_RETRY_MAX_ATTEMPTS_EXCEEDED",
        message: `max attempts ${policy.maxAttempts} exceeded for ${attempt.entityId}`,
      };
    }

    if (
      previous.length > 0 &&
      attempt.attemptNumber <= previous[previous.length - 1].attemptNumber
    ) {
      return {
        ok: false,
        code: "TISS_RETRY_INVALID_ATTEMPT_NUMBER",
        message: "attemptNumber must be increasing",
      };
    }

    previous.push(attempt);
    this.attempts.set(attempt.entityId, previous);
    return {
      ok: true,
      code: "TISS_RETRY_ATTEMPT_SCHEDULED",
      message: "attempt scheduled",
      attempt,
    };
  }

  attemptsForEntity(entityId: string): TissRetryAttempt[] {
    return this.attempts.get(entityId) ?? [];
  }

  listAllAttempts(): TissRetryAttempt[] {
    const all: TissRetryAttempt[] = [];
    for (const list of this.attempts.values()) all.push(...list);
    return all;
  }

  stats(): TissRetryStats {
    const all = this.listAllAttempts();
    const byEntity: Record<string, number> = {};
    const byPolicy: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const attempt of all) {
      byEntity[attempt.entityId] = (byEntity[attempt.entityId] ?? 0) + 1;
      byPolicy[attempt.policyId] = (byPolicy[attempt.policyId] ?? 0) + 1;
      byStatus[attempt.status] = (byStatus[attempt.status] ?? 0) + 1;
    }
    return { totalAttempts: all.length, byEntity, byPolicy, byStatus };
  }

  calculateDelayMs(policyId: string, attemptNumber: number): number | undefined {
    const policy = this.policies.get(policyId);
    if (!policy) return undefined;
    return policy.delayMs * Math.pow(policy.backoffMultiplier, attemptNumber - 1);
  }
}
