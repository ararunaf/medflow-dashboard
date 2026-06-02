import { ValidationError } from "@/lib/domain/operations/errors";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import type {
  ExecutionSafetyEvaluation,
  OperationalSimulationResult,
} from "@/lib/operations/execution-sandbox/types";

export function assertApprovalConfirmed(flag: boolean): void {
  if (flag !== true) {
    throw new ValidationError(
      "Execução supervisionada exige confirmação explícita (approval_confirmed = true).",
    );
  }
}

export function assertProposalApprovedForExecution(proposal: OperationalActionProposalDto): void {
  if (proposal.effectiveState !== "approved") {
    throw new ValidationError("Somente propostas aprovadas podem ter mutações executadas.", {
      state: proposal.effectiveState,
    });
  }
}

export function assertSandboxRunSafeForExecution(input: {
  sandboxRowState: string;
  proposalId: string;
  runProposalId: string;
}): void {
  if (input.runProposalId !== input.proposalId) {
    throw new ValidationError("Sandbox run não corresponde à proposta informada.");
  }
  if (input.sandboxRowState !== "safe") {
    throw new ValidationError(
      `Execução exige simulação persistida com estado 'safe' (atual: ${input.sandboxRowState}).`,
    );
  }
}

export function assertPolicyChecksAllowExecution(safety: ExecutionSafetyEvaluation): void {
  const failed = safety.policyChecks.filter((c) => c.status === "fail");
  if (failed.length > 0) {
    throw new ValidationError("Policy checks com falha — execução bloqueada.", {
      failed: failed.map((f) => ({ id: f.id, detail: f.detail })),
    });
  }
}

export function parseSimulationResultSnapshot(
  raw: Record<string, unknown>,
): OperationalSimulationResult {
  if (raw.schemaVersion !== "1.0.0") {
    throw new ValidationError("Versão de snapshot de simulação incompatível.", {
      schemaVersion: raw.schemaVersion,
    });
  }
  if (typeof raw.simulationId !== "string") {
    throw new ValidationError("Snapshot de simulação inválido (simulationId).");
  }
  if (raw.state !== "safe") {
    throw new ValidationError("Snapshot não está em estado seguro para execução.");
  }
  const safety = raw.safety as ExecutionSafetyEvaluation | undefined;
  if (!safety || !Array.isArray(safety.policyChecks)) {
    throw new ValidationError("Snapshot sem bloco de safety auditável.");
  }
  assertPolicyChecksAllowExecution(safety);
  return raw as unknown as OperationalSimulationResult;
}
