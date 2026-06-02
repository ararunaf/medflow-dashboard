import type { OrchestrationNarrativeEntry } from "./types";

export function appendOrchestrationNarrative(
  current: readonly OrchestrationNarrativeEntry[] | unknown,
  entry: Omit<OrchestrationNarrativeEntry, "at"> & { at?: string },
): OrchestrationNarrativeEntry[] {
  const base = Array.isArray(current) ? (current as OrchestrationNarrativeEntry[]) : [];
  const row: OrchestrationNarrativeEntry = {
    at: entry.at ?? new Date().toISOString(),
    actorProfileId: entry.actorProfileId,
    phase: entry.phase,
    message: entry.message,
    policyRefs: entry.policyRefs,
    proposalId: entry.proposalId,
    stepOrdinal: entry.stepOrdinal,
  };
  const next = [...base, row];
  if (next.length > 200) return next.slice(-200);
  return next;
}
