import { ValidationError } from "@/lib/domain/operations/errors";
import { OPERATIONAL_CONTEXT_SECTION_ORDER } from "@/lib/operations/copilot-context/context-registry";
import { OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION } from "@/lib/operations/copilot-context/types";
import type {
  ContextProvenanceRef,
  OperationalContextPayload,
  OperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/types";
import type { OperationalCopilotGptRequest } from "@/lib/operations/copilot-gpt/types";
import {
  OPERATIONAL_ALERT_RULE_IDS,
  type OperationalAlertRuleId,
  type OperationalAlertSeverity,
} from "@/lib/operations/alerts/types";
import {
  OPERATIONAL_KPI_IDS,
  type OperationalKpiId,
} from "@/lib/operations/analytics/kpi-registry";
import {
  OPERATIONAL_RECOMMENDATION_TRIGGERS,
  type OperationalRecommendationTrigger,
} from "@/lib/operations/recommendations/types";
import { OPERATIONAL_SCORE_IDS, type OperationalScoreId } from "@/lib/operations/scoring/types";

const MAX_QUESTION = 2000;
const MAX_PAYLOAD_JSON = 28_000;
const MAX_REFERENCES = 52;
const MAX_SECTION_DIGESTS = 14;
const MAX_BULLETS_PER_DIGEST = 6;

function requireNonNegativeInt(value: unknown, field: string): number {
  const n = requireFiniteNumber(value, field);
  if (!Number.isInteger(n) || n < 0) {
    throw new ValidationError(`Campo ${field} deve ser inteiro ≥ 0.`, { field });
  }
  return n;
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`Campo ${field} deve ser número finito.`, { field });
  }
  return value;
}

function requireString(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") {
    throw new ValidationError(`Campo ${field} deve ser texto.`, { field });
  }
  if (value.length === 0) {
    throw new ValidationError(`Campo ${field} é obrigatório.`, { field });
  }
  if (value.length > maxLen) {
    throw new ValidationError(`Campo ${field} excede ${maxLen} caracteres.`, { field });
  }
  return value;
}

function optionalString(value: unknown, field: string, maxLen: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`Campo ${field} deve ser texto.`, { field });
  }
  if (value.length > maxLen) {
    throw new ValidationError(`Campo ${field} excede ${maxLen} caracteres.`, { field });
  }
  return value;
}

const SCORE_ID_SET = new Set<string>(OPERATIONAL_SCORE_IDS);
const ALERT_SEVERITIES = new Set<OperationalAlertSeverity>(["critical", "warning", "info"]);
const ALERT_ID_SET = new Set<string>(Object.values(OPERATIONAL_ALERT_RULE_IDS));
const KPI_ID_SET = new Set<string>(OPERATIONAL_KPI_IDS);
const RECOMMENDATION_TRIGGER_SET = new Set<string>(OPERATIONAL_RECOMMENDATION_TRIGGERS);

function parseProvenanceRef(raw: unknown): ContextProvenanceRef {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("Referência de proveniência inválida.", { field: "references" });
  }
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (kind === "score") {
    const id = requireString(o.id, "ref.score.id", 64);
    if (!SCORE_ID_SET.has(id)) {
      throw new ValidationError("ID de score inválido.", { field: "ref.score.id" });
    }
    return {
      kind: "score",
      id: id as OperationalScoreId,
      value: requireFiniteNumber(o.value, "ref.score.value"),
    };
  }
  if (kind === "alert") {
    const severity = requireString(
      o.severity,
      "ref.alert.severity",
      16,
    ) as OperationalAlertSeverity;
    if (!ALERT_SEVERITIES.has(severity)) {
      throw new ValidationError("Severidade de alerta inválida.", { field: "ref.alert.severity" });
    }
    const alertId = requireString(o.id, "ref.alert.id", 64);
    if (!ALERT_ID_SET.has(alertId)) {
      throw new ValidationError("ID de alerta inválido.", { field: "ref.alert.id" });
    }
    return {
      kind: "alert",
      id: alertId as OperationalAlertRuleId,
      severity,
    };
  }
  if (kind === "recommendation") {
    const trigger = requireString(o.trigger, "ref.recommendation.trigger", 120);
    if (!RECOMMENDATION_TRIGGER_SET.has(trigger)) {
      throw new ValidationError("Gatilho de recomendação inválido.", {
        field: "ref.recommendation.trigger",
      });
    }
    return {
      kind: "recommendation",
      id: requireString(o.id, "ref.recommendation.id", 80),
      trigger: trigger as OperationalRecommendationTrigger,
    };
  }
  if (kind === "forecast") {
    return {
      kind: "forecast",
      projection: requireString(o.projection, "ref.forecast.projection", 240),
    };
  }
  if (kind === "kpi") {
    const kpiId = requireString(o.id, "ref.kpi.id", 64);
    if (!KPI_ID_SET.has(kpiId)) {
      throw new ValidationError("ID de KPI inválido.", { field: "ref.kpi.id" });
    }
    return {
      kind: "kpi",
      id: kpiId as OperationalKpiId,
      note: optionalString(o.note, "ref.kpi.note", 240),
    };
  }
  if (kind === "timeline_event") {
    return { kind: "timeline_event", id: requireString(o.id, "ref.timeline_event.id", 80) };
  }
  if (kind === "feedback_signal") {
    return { kind: "feedback_signal", id: requireString(o.id, "ref.feedback_signal.id", 80) };
  }
  throw new ValidationError("Tipo de referência de proveniência desconhecido.", {
    field: "references",
  });
}

export function expectOperationalContextPayload(value: unknown): OperationalContextPayload {
  const obj = value as Record<string, unknown>;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new ValidationError("Payload operacional inválido.", {
      field: "operationalContextPayload",
    });
  }
  if (obj.schemaVersion !== OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION) {
    throw new ValidationError("Versão de schema do contexto incompatível.", {
      field: "schemaVersion",
    });
  }
  const fingerprint = requireString(obj.fingerprint, "fingerprint", 96);
  if (!/^opctx_[0-9a-f]{1,16}$/.test(fingerprint)) {
    throw new ValidationError("Fingerprint operacional inválido.", { field: "fingerprint" });
  }
  const scope = requireString(obj.scope, "scope", 32);
  if (scope !== "live_command_center" && scope !== "analytics_period" && scope !== "merged") {
    throw new ValidationError("Escopo operacional inválido.", { field: "scope" });
  }
  const asOf = requireString(obj.asOf, "asOf", 40);
  const executiveSummary = requireString(obj.executiveSummary, "executiveSummary", 1200);
  const coordinatorSummary = obj.coordinatorSummary;
  if (
    !coordinatorSummary ||
    typeof coordinatorSummary !== "object" ||
    Array.isArray(coordinatorSummary)
  ) {
    throw new ValidationError("coordinatorSummary inválido.", { field: "coordinatorSummary" });
  }
  const cs = coordinatorSummary as Record<string, unknown>;
  const subheadRaw = cs.subhead;
  if (typeof subheadRaw !== "string" || subheadRaw.length > 400) {
    throw new ValidationError("subhead inválido.", { field: "subhead" });
  }
  const priorityLines = cs.priorityLines;
  if (
    !Array.isArray(priorityLines) ||
    priorityLines.some((x) => typeof x !== "string" || (x as string).length > 400)
  ) {
    throw new ValidationError("priorityLines inválido.", { field: "priorityLines" });
  }

  const sectionDigestsRaw = obj.sectionDigests;
  if (!Array.isArray(sectionDigestsRaw)) {
    throw new ValidationError("sectionDigests deve ser lista.", { field: "sectionDigests" });
  }
  if (sectionDigestsRaw.length > MAX_SECTION_DIGESTS) {
    throw new ValidationError("sectionDigests excede limite.", { field: "sectionDigests" });
  }
  const sectionDigests: OperationalContextPayload["sectionDigests"] = [];
  for (const row of sectionDigestsRaw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new ValidationError("Item de sectionDigests inválido.", { field: "sectionDigests" });
    }
    const r = row as Record<string, unknown>;
    const keyRaw = requireString(r.key, "section.key", 48);
    if (
      !OPERATIONAL_CONTEXT_SECTION_ORDER.includes(
        keyRaw as (typeof OPERATIONAL_CONTEXT_SECTION_ORDER)[number],
      )
    ) {
      throw new ValidationError("Chave de seção desconhecida.", { field: "sectionDigests.key" });
    }
    const key = keyRaw as OperationalContextPayload["sectionDigests"][number]["key"];
    const title = requireString(r.title, "section.title", 120);
    const bullets = r.bullets;
    if (!Array.isArray(bullets) || bullets.some((b) => typeof b !== "string")) {
      throw new ValidationError("Bullets de seção inválidos.", { field: "sectionDigests" });
    }
    sectionDigests.push({
      key,
      title,
      bullets: (bullets as string[]).slice(0, MAX_BULLETS_PER_DIGEST).map((b) => b.slice(0, 500)),
    });
  }

  const referencesRaw = obj.references;
  if (!Array.isArray(referencesRaw)) {
    throw new ValidationError("references deve ser lista.", { field: "references" });
  }
  if (referencesRaw.length > MAX_REFERENCES) {
    throw new ValidationError("references excede limite.", { field: "references" });
  }
  const references: ContextProvenanceRef[] = referencesRaw.map(parseProvenanceRef);

  const payload: OperationalContextPayload = {
    schemaVersion: OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION,
    scope: scope as OperationalContextPayload["scope"],
    asOf,
    executiveSummary,
    coordinatorSummary: {
      headline: requireString(cs.headline, "headline", 400),
      subhead: subheadRaw,
      priorityLines: (priorityLines as string[]).slice(0, 12),
      criticalAlertCount: requireNonNegativeInt(cs.criticalAlertCount, "criticalAlertCount"),
      warningAlertCount: requireNonNegativeInt(cs.warningAlertCount, "warningAlertCount"),
      openRecommendationCount: requireNonNegativeInt(
        cs.openRecommendationCount,
        "openRecommendationCount",
      ),
      urgentRecommendationCount: requireNonNegativeInt(
        cs.urgentRecommendationCount,
        "urgentRecommendationCount",
      ),
    },
    sectionDigests,
    references,
    fingerprint,
  };

  const json = JSON.stringify(payload);
  if (json.length > MAX_PAYLOAD_JSON) {
    throw new ValidationError("Payload operacional excede limite seguro para o modelo.", {
      field: "operationalContextPayload",
    });
  }

  return payload;
}

export function expectOperationalSemanticSnapshot(value: unknown): OperationalSemanticSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("semanticSnapshot inválido.", { field: "semanticSnapshot" });
  }
  const o = value as Record<string, unknown>;
  if (o.schemaVersion !== OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION) {
    throw new ValidationError("Versão de schema do snapshot semântico incompatível.", {
      field: "semanticSnapshot.schemaVersion",
    });
  }
  const fingerprint = requireString(o.fingerprint, "semanticSnapshot.fingerprint", 96);
  if (!/^opctx_[0-9a-f]{1,16}$/.test(fingerprint)) {
    throw new ValidationError("Fingerprint do snapshot semântico inválido.", {
      field: "semanticSnapshot.fingerprint",
    });
  }
  const semanticTags = o.semanticTags;
  if (
    !Array.isArray(semanticTags) ||
    semanticTags.some((t) => typeof t !== "string" || (t as string).length > 80)
  ) {
    throw new ValidationError("semanticTags inválido.", { field: "semanticTags" });
  }
  const coordinatorInsights = o.coordinatorInsights;
  if (
    !Array.isArray(coordinatorInsights) ||
    coordinatorInsights.some((t) => typeof t !== "string" || (t as string).length > 400)
  ) {
    throw new ValidationError("coordinatorInsights inválido.", { field: "coordinatorInsights" });
  }
  const semanticHighlights = o.semanticHighlights;
  if (
    !Array.isArray(semanticHighlights) ||
    semanticHighlights.some((t) => typeof t !== "string" || (t as string).length > 400)
  ) {
    throw new ValidationError("semanticHighlights inválido.", { field: "semanticHighlights" });
  }
  const priorityRecommendationIds = o.priorityRecommendationIds;
  if (
    !Array.isArray(priorityRecommendationIds) ||
    priorityRecommendationIds.some((t) => typeof t !== "string" || (t as string).length > 80)
  ) {
    throw new ValidationError("priorityRecommendationIds inválido.", {
      field: "priorityRecommendationIds",
    });
  }

  return {
    schemaVersion: OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION,
    scope: requireString(
      o.scope,
      "semanticSnapshot.scope",
      32,
    ) as OperationalSemanticSnapshot["scope"],
    asOf: requireString(o.asOf, "semanticSnapshot.asOf", 40),
    healthState: requireString(o.healthState, "healthState", 48),
    consolidatedRiskScore: requireFiniteNumber(o.consolidatedRiskScore, "consolidatedRiskScore"),
    operationalHealthScore: requireFiniteNumber(o.operationalHealthScore, "operationalHealthScore"),
    semanticTags: (semanticTags as string[]).slice(0, 48),
    narrativeHeadline: requireString(o.narrativeHeadline, "narrativeHeadline", 400),
    coordinatorInsights: (coordinatorInsights as string[]).slice(0, 12),
    semanticHighlights: (semanticHighlights as string[]).slice(0, 12),
    priorityRecommendationIds: (priorityRecommendationIds as string[]).slice(0, 16),
    fingerprint,
  };
}

export function expectOperationalCopilotGptRequest(raw: unknown): OperationalCopilotGptRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("Corpo da requisição inválido.", { field: "payload" });
  }
  const obj = raw as Record<string, unknown>;
  const mode = obj.mode;
  if (mode !== "chat" && mode !== "executive_narrative") {
    throw new ValidationError("mode inválido.", { field: "mode" });
  }
  const question =
    mode === "chat"
      ? requireString(obj.question, "question", MAX_QUESTION)
      : optionalString(obj.question, "question", MAX_QUESTION);

  if (mode === "chat" && (!question || question.trim().length === 0)) {
    throw new ValidationError("Pergunta obrigatória no modo chat.", { field: "question" });
  }

  const operationalContextPayload = expectOperationalContextPayload(obj.operationalContextPayload);
  const semanticSnapshot = expectOperationalSemanticSnapshot(obj.semanticSnapshot);

  if (semanticSnapshot.fingerprint !== operationalContextPayload.fingerprint) {
    throw new ValidationError("Fingerprint do snapshot não coincide com o payload.", {
      field: "fingerprint",
    });
  }

  return {
    mode,
    question: mode === "chat" ? question!.trim() : undefined,
    operationalContextPayload,
    semanticSnapshot,
  };
}
