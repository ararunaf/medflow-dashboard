import type { OperationalContextBundle } from "@/lib/operations/copilot-context/types";

/** Narrativa curta unificada (legível por humanos / futuro LLM). */
export function composeUnifiedOperationalNarrative(bundle: OperationalContextBundle): string {
  const s = bundle.sections;
  const parts = [
    bundle.coordinatorSummary.headline,
    bundle.coordinatorSummary.subhead,
    s.currentOperationalState.bullets[0] ?? "",
    s.predictedDeterioration.bullets[0] ?? "",
    s.coordinatorPriorities.bullets[0] ?? "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export function narrativeHeadlineFromBundle(bundle: OperationalContextBundle): string {
  return bundle.coordinatorSummary.headline;
}
