import { buildLiveOperationalContextBundle } from "@/lib/operations/copilot-context/context-bundle-builders";
import {
  composeUnifiedOperationalNarrative,
  narrativeHeadlineFromBundle,
} from "@/lib/operations/copilot-context/operational-narrative-helpers";
import { normalizeCopilotLiveInput } from "@/lib/operations/copilot-context/semantic-adapters";
import type {
  OperationalContextBundle,
  OperationalContextPayload,
  OperationalCopilotContextLiveInput,
  OperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/types";
import { OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION } from "@/lib/operations/copilot-context/types";
import {
  OPERATIONAL_CONTEXT_SECTION_LABELS_PT,
  OPERATIONAL_CONTEXT_SECTION_ORDER,
} from "@/lib/operations/copilot-context/context-registry";

export function buildOperationalCopilotContextBundle(
  input: OperationalCopilotContextLiveInput,
): OperationalContextBundle {
  return buildLiveOperationalContextBundle(normalizeCopilotLiveInput(input));
}

export function buildOperationalSemanticSnapshot(
  bundle: OperationalContextBundle,
): OperationalSemanticSnapshot {
  const tagSet = new Set<string>();
  for (const key of OPERATIONAL_CONTEXT_SECTION_ORDER) {
    const sec = bundle.sections[key];
    if (!sec) continue;
    for (const t of sec.semanticTags) tagSet.add(t);
  }
  const coordinatorInsights = [
    bundle.coordinatorSummary.headline,
    bundle.coordinatorSummary.subhead,
    ...bundle.coordinatorSummary.priorityLines.slice(0, 4),
  ];
  const semanticHighlights = [
    ...bundle.sections.currentOperationalState.bullets.slice(0, 2),
    ...bundle.sections.currentRisks.bullets.slice(0, 2),
    ...bundle.sections.predictedDeterioration.bullets.slice(0, 2),
  ].slice(0, 8);

  return {
    schemaVersion: OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION,
    scope: bundle.scope,
    asOf: bundle.asOf,
    healthState: bundle.signals.healthState,
    consolidatedRiskScore: bundle.signals.consolidatedRiskScore,
    operationalHealthScore: bundle.signals.operationalHealthScore,
    semanticTags: [...tagSet].slice(0, 40),
    narrativeHeadline: narrativeHeadlineFromBundle(bundle),
    coordinatorInsights,
    semanticHighlights,
    priorityRecommendationIds: bundle.sections.coordinatorPriorities.orderedRecommendationIds.slice(
      0,
      12,
    ),
    fingerprint: bundle.explainability.fingerprint,
  };
}

export type OperationalContextPayloadOptions = {
  maxExecutiveSummaryChars?: number;
  maxBulletsPerSection?: number;
  maxReferences?: number;
};

export function buildOperationalContextPayload(
  bundle: OperationalContextBundle,
  opts: OperationalContextPayloadOptions = {},
): OperationalContextPayload {
  const maxExec = opts.maxExecutiveSummaryChars ?? 900;
  const maxBullets = opts.maxBulletsPerSection ?? 4;
  const maxRefs = opts.maxReferences ?? 48;

  const sectionDigests: OperationalContextPayload["sectionDigests"] = [];
  for (const key of OPERATIONAL_CONTEXT_SECTION_ORDER) {
    const sec = bundle.sections[key];
    if (!sec) continue;
    sectionDigests.push({
      key,
      title: OPERATIONAL_CONTEXT_SECTION_LABELS_PT[key],
      bullets: sec.bullets.slice(0, maxBullets),
    });
  }

  let executiveSummary = composeUnifiedOperationalNarrative(bundle);
  if (executiveSummary.length > maxExec) {
    executiveSummary = `${executiveSummary.slice(0, maxExec - 1)}…`;
  }

  return {
    schemaVersion: OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION,
    scope: bundle.scope,
    asOf: bundle.asOf,
    executiveSummary,
    coordinatorSummary: bundle.coordinatorSummary,
    sectionDigests,
    references: bundle.explainability.provenance.slice(0, maxRefs),
    fingerprint: bundle.explainability.fingerprint,
  };
}

export {
  OPERATIONAL_CONTEXT_SECTION_LABELS_PT,
  OPERATIONAL_CONTEXT_SECTION_ORDER,
} from "@/lib/operations/copilot-context/context-registry";
export { operationalTimelineSliceFromEventRows } from "@/lib/operations/copilot-context/timeline-context-adapter";
