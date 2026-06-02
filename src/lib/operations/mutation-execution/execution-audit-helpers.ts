import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import type {
  OperationalSimulationResult,
  PolicyCheckResult,
} from "@/lib/operations/execution-sandbox/types";
import type { AppliedForwardStep } from "@/lib/operations/mutation-execution/types";

export function buildExecutionExplainability(input: {
  proposal: OperationalActionProposalDto;
  simulation: OperationalSimulationResult;
  sandboxRunId: string;
}): Record<string, unknown> {
  return {
    schemaVersion: "1.0.0",
    proposalId: input.proposal.id,
    proposalTitle: input.proposal.title,
    proposalActionKind: input.proposal.actionKind,
    proposalReferences: input.proposal.references,
    proposalRationale: input.proposal.operationalRationale,
    simulationId: input.simulation.simulationId,
    sandboxRunId: input.sandboxRunId,
    simulationExplainability: input.simulation.explainability,
    rollbackPreview: input.simulation.rollbackPreview,
    policyReferences: input.simulation.safety.policyChecks.map((c) => ({
      id: c.id,
      label: c.label,
      status: c.status,
    })),
  };
}

export function snapshotPolicyChecks(checks: readonly PolicyCheckResult[]): PolicyCheckResult[] {
  return checks.map((c) => ({ ...c }));
}

export function summarizeAffectedFromSimulation(
  simulation: OperationalSimulationResult,
): unknown[] {
  return simulation.impact.affectedEntities.map((e) => ({
    kind: e.kind,
    id: e.id,
    label: e.label,
    impactSeverity: e.impactSeverity,
    tags: e.tags,
  }));
}

export function buildExecutionResultPayload(input: {
  simulation: OperationalSimulationResult;
  appliedSteps: AppliedForwardStep[];
  headline: string;
}): Record<string, unknown> {
  return {
    headline: input.headline,
    simulationId: input.simulation.simulationId,
    mutationsApplied: input.appliedSteps.length,
    projectedForecast: input.simulation.impact.projectedForecast,
    overallSeverity: input.simulation.impact.overallSeverity,
    appliedStepKinds: input.appliedSteps.map((s) => s.kind),
  };
}

export function buildRollbackAuditPayload(input: {
  executionId: string;
  reversedSteps: number;
  detail: string;
}): Record<string, unknown> {
  return {
    executionId: input.executionId,
    reversedSteps: input.reversedSteps,
    detail: input.detail,
    at: new Date().toISOString(),
  };
}
