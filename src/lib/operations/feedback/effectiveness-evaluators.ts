import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";
import type {
  AcceptanceTrendPoint,
  CoordinatorFeedbackSummary,
  OperationalRecommendationFeedbackRollupPayload,
  RecommendationEffectivenessMetrics,
} from "@/lib/operations/feedback/types";

function countOf(
  m: Partial<Record<OperationalRecommendationFeedbackType, number>>,
  k: OperationalRecommendationFeedbackType,
): number {
  return m[k] ?? 0;
}

export function evaluateRecommendationEffectiveness(
  rollups: OperationalRecommendationFeedbackRollupPayload,
): RecommendationEffectivenessMetrics {
  const c = rollups.countsByFeedbackType;
  const accepted = countOf(c, "accepted");
  const dismissed = countOf(c, "dismissed");
  const ignored = countOf(c, "ignored");
  const executed = countOf(c, "executed");
  const executionFailed = countOf(c, "execution_failed");
  const sampleSize =
    accepted + dismissed + ignored + executed + executionFailed || rollups.sampleSize;

  const execDenom = executed + executionFailed;
  const executionSuccessRate = execDenom > 0 ? executed / execDenom : null;

  const humanDenom = accepted + dismissed + ignored + executed + executionFailed;
  const alignmentRate = humanDenom > 0 ? (accepted + executed) / humanDenom : null;

  const scored = rollups.mitigationScoredTotal;
  const scoredMitigationSuccessRate = scored > 0 ? rollups.mitigationScoredSuccess / scored : null;

  return {
    sampleSize,
    accepted,
    dismissed,
    ignored,
    executed,
    executionFailed,
    executionSuccessRate,
    alignmentRate,
    scoredMitigationSuccessRate,
  };
}

export function buildCoordinatorFeedbackSummaries(
  rollups: OperationalRecommendationFeedbackRollupPayload,
): CoordinatorFeedbackSummary[] {
  const byActor = new Map<string, Partial<Record<OperationalRecommendationFeedbackType, number>>>();
  for (const row of rollups.byActorType) {
    const cur = byActor.get(row.actor_profile_id) ?? {};
    cur[row.feedback_type] = (cur[row.feedback_type] ?? 0) + row.c;
    byActor.set(row.actor_profile_id, cur);
  }
  const out: CoordinatorFeedbackSummary[] = [];
  for (const [actorProfileId, countsByFeedbackType] of byActor) {
    const total = Object.values(countsByFeedbackType).reduce((a, b) => a + (b ?? 0), 0);
    const accepted = countOf(countsByFeedbackType, "accepted");
    const executed = countOf(countsByFeedbackType, "executed");
    const humanDenom =
      (countsByFeedbackType.accepted ?? 0) +
      (countsByFeedbackType.dismissed ?? 0) +
      (countsByFeedbackType.ignored ?? 0) +
      (countsByFeedbackType.executed ?? 0) +
      (countsByFeedbackType.execution_failed ?? 0);
    out.push({
      actorProfileId,
      countsByFeedbackType,
      total,
      alignmentRate: humanDenom > 0 ? (accepted + executed) / humanDenom : null,
    });
  }
  return out.sort((a, b) => b.total - a.total);
}

export function buildAcceptanceTrendFromDaily(
  rollups: OperationalRecommendationFeedbackRollupPayload,
): AcceptanceTrendPoint[] {
  const byBucket = new Map<
    string,
    { accepted: number; executed: number; dismissed: number; ignored: number }
  >();
  for (const row of rollups.dailyByType) {
    const cur = byBucket.get(row.bucket) ?? { accepted: 0, executed: 0, dismissed: 0, ignored: 0 };
    if (row.feedback_type === "accepted") cur.accepted += row.c;
    if (row.feedback_type === "executed") cur.executed += row.c;
    if (row.feedback_type === "dismissed") cur.dismissed += row.c;
    if (row.feedback_type === "ignored") cur.ignored += row.c;
    byBucket.set(row.bucket, cur);
  }
  return [...byBucket.entries()]
    .map(([bucket, v]) => ({ bucket, ...v }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}
