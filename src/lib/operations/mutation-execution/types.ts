import type { OperationalMutationExecutionState } from "@/lib/database.types";
import type {
  OperationalSimulationResult,
  PolicyCheckResult,
} from "@/lib/operations/execution-sandbox/types";

/** Passo aplicado na ordem (para compensação / auditoria). */
export type AppliedForwardStep =
  | {
      kind: "operational_event";
      mutationId: string;
      eventId: string;
      entityType: string;
      entityId: string;
    }
  | {
      kind: "pending_assignment";
      mutationId: string;
      assignmentId: string;
      shiftId: string;
      professionalId: string;
    };

export type OperationalMutationExecutionDto = {
  id: string;
  tenantId: string;
  proposalId: string;
  sandboxRunId: string;
  actorProfileId: string;
  state: OperationalMutationExecutionState;
  approvalConfirmed: boolean;
  idempotencyKey: string | null;
  blockReason: string | null;
  policyChecksSnapshot: PolicyCheckResult[];
  explainabilityJson: Record<string, unknown>;
  appliedStepsJson: AppliedForwardStep[];
  resultPayload: Record<string, unknown>;
  rollbackPayload: Record<string, unknown>;
  affectedEntitiesJson: unknown[];
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExecuteSupervisedOperationalMutationsInput = {
  proposalId: string;
  sandboxRunId: string;
  /** Confirmação explícita humana no momento da execução (governança). */
  approvalConfirmed: boolean;
  /** Chave idempotente por tentativa de execução (ex.: UUID). */
  idempotencyKey: string;
};

export type RollbackSupervisedExecutionInput = {
  executionId: string;
};

export type ExecuteSupervisedOperationalMutationsResult = {
  execution: OperationalMutationExecutionDto;
  simulation: OperationalSimulationResult;
  idempotentReplay?: boolean;
};
