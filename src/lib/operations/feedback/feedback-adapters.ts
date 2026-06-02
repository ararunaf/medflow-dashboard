import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";
import type {
  OperationalRecommendationFeedbackRollupPayload,
  RecommendationLatestFeedbackRow,
} from "@/lib/operations/feedback/types";

const FEEDBACK_TYPES: readonly OperationalRecommendationFeedbackType[] = [
  "accepted",
  "dismissed",
  "ignored",
  "executed",
  "execution_failed",
];

function isFeedbackType(v: string): v is OperationalRecommendationFeedbackType {
  return (FEEDBACK_TYPES as readonly string[]).includes(v);
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.length > 0) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** Normaliza payload JSON do RPC `get_operational_recommendation_feedback_rollups`. */
export function adaptOperationalRecommendationFeedbackRollups(
  raw: unknown,
): OperationalRecommendationFeedbackRollupPayload {
  if (raw == null || typeof raw !== "object") {
    return {
      sampleSize: 0,
      countsByFeedbackType: {},
      dailyByType: [],
      byActorType: [],
      byTriggerType: [],
      mitigationScoredSuccess: 0,
      mitigationScoredTotal: 0,
    };
  }
  const o = raw as Record<string, unknown>;
  const countsRaw = o.countsByFeedbackType;
  const countsByFeedbackType: Partial<Record<OperationalRecommendationFeedbackType, number>> = {};
  if (countsRaw != null && typeof countsRaw === "object" && !Array.isArray(countsRaw)) {
    for (const [k, v] of Object.entries(countsRaw as Record<string, unknown>)) {
      if (isFeedbackType(k)) countsByFeedbackType[k] = num(v);
    }
  }

  const dailyByType: OperationalRecommendationFeedbackRollupPayload["dailyByType"] = [];
  if (Array.isArray(o.dailyByType)) {
    for (const row of o.dailyByType) {
      if (row == null || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const bucket = typeof r.bucket === "string" ? r.bucket : "";
      const ft = typeof r.feedback_type === "string" ? r.feedback_type : "";
      if (!bucket || !isFeedbackType(ft)) continue;
      dailyByType.push({ bucket, feedback_type: ft, c: num(r.c) });
    }
  }

  const byActorType: OperationalRecommendationFeedbackRollupPayload["byActorType"] = [];
  if (Array.isArray(o.byActorType)) {
    for (const row of o.byActorType) {
      if (row == null || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const actor = typeof r.actor_profile_id === "string" ? r.actor_profile_id : "";
      const ft = typeof r.feedback_type === "string" ? r.feedback_type : "";
      if (!actor || !isFeedbackType(ft)) continue;
      byActorType.push({ actor_profile_id: actor, feedback_type: ft, c: num(r.c) });
    }
  }

  const byTriggerType: OperationalRecommendationFeedbackRollupPayload["byTriggerType"] = [];
  if (Array.isArray(o.byTriggerType)) {
    for (const row of o.byTriggerType) {
      if (row == null || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const tk = typeof r.trigger_key === "string" ? r.trigger_key : "";
      const ft = typeof r.feedback_type === "string" ? r.feedback_type : "";
      if (!tk || !isFeedbackType(ft)) continue;
      byTriggerType.push({ trigger_key: tk, feedback_type: ft, c: num(r.c) });
    }
  }

  return {
    sampleSize: num(o.sampleSize),
    countsByFeedbackType,
    dailyByType,
    byActorType,
    byTriggerType,
    mitigationScoredSuccess: num(o.mitigationScoredSuccess),
    mitigationScoredTotal: num(o.mitigationScoredTotal),
  };
}

export function adaptLatestOperationalRecommendationFeedbackRows(
  raw: unknown,
): RecommendationLatestFeedbackRow[] {
  if (!Array.isArray(raw)) return [];
  const out: RecommendationLatestFeedbackRow[] = [];
  for (const row of raw) {
    if (row == null || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const recommendation_id = typeof r.recommendation_id === "string" ? r.recommendation_id : "";
    const ft = typeof r.feedback_type === "string" ? r.feedback_type : "";
    if (!recommendation_id || !isFeedbackType(ft)) continue;
    let effectiveness_score: number | null = null;
    if (r.effectiveness_score != null) {
      const n = Number(r.effectiveness_score);
      if (Number.isFinite(n)) effectiveness_score = n;
    }
    const created_at = typeof r.created_at === "string" ? r.created_at : "";
    if (!created_at) continue;
    out.push({ recommendation_id, feedback_type: ft, effectiveness_score, created_at });
  }
  return out;
}
