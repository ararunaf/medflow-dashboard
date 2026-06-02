/**
 * Fundação de contexto operacional semântico para copiloto (sem LLM / embeddings).
 * Estruturas estáveis, auditáveis e derivadas de snapshots já materializados.
 */
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalAlert, OperationalAlertRuleId } from "@/lib/operations/alerts/types";
import type { OperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";
import type { OperationalKpiId } from "@/lib/operations/analytics/kpi-registry";
import type { OperationalRecommendation } from "@/lib/operations/recommendations/types";
import type { OperationalHealthState, OperationalScoreId } from "@/lib/operations/scoring/types";

export const OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION = "1.0.0";

export type OperationalCopilotContextScope = "live_command_center" | "analytics_period" | "merged";

/** Referência explícita para rastreabilidade (auditoria / futuro prompt). */
export type ContextProvenanceRef =
  | { kind: "score"; id: OperationalScoreId; value: number }
  | { kind: "alert"; id: OperationalAlertRuleId; severity: OperationalAlert["severity"] }
  | { kind: "recommendation"; id: string; trigger: OperationalRecommendation["trigger"] }
  | { kind: "forecast"; projection: string }
  | { kind: "kpi"; id: OperationalKpiId; note?: string }
  | { kind: "timeline_event"; id: string }
  | { kind: "feedback_signal"; id: string };

export type OperationalContextExplainability = {
  deterministic: true;
  derivedFrom: OperationalCopilotContextScope;
  /** Resumo estável dos insumos usados (não inclui PII além do que já está no snapshot). */
  sourceSummary: string[];
  provenance: ContextProvenanceRef[];
  /** Impressão digital leve dos sinais principais — reproduzível no cliente. */
  fingerprint: string;
};

export type ContextSectionBase = {
  title: string;
  bullets: string[];
  semanticTags: string[];
};

export type OperationalContextSections = {
  currentOperationalState: ContextSectionBase & {
    urgencyLabel: string;
    pressureLabel: string;
  };
  currentRisks: ContextSectionBase;
  predictedDeterioration: ContextSectionBase & {
    forecastProjection: string;
  };
  operationalPressure: ContextSectionBase;
  coordinatorPriorities: ContextSectionBase & {
    orderedRecommendationIds: string[];
  };
  recommendationHighlights: ContextSectionBase & {
    topItems: Pick<OperationalRecommendation, "id" | "title" | "state" | "trigger">[];
  };
  recentOperationalEvents: ContextSectionBase & {
    timelineAttached: boolean;
  };
  learningSignals: ContextSectionBase;
  /** Opcional: só preenchido quando analytics é anexado ao bundle (evita recomputar RPC). */
  kpiTrendDigest: ContextSectionBase | null;
};

/** Resumo executivo para coordenação (priorização humana). */
export type CoordinatorContextSummary = {
  headline: string;
  subhead: string;
  priorityLines: string[];
  criticalAlertCount: number;
  warningAlertCount: number;
  openRecommendationCount: number;
  urgentRecommendationCount: number;
};

/**
 * Bundle unificado de contexto operacional — unidade principal da fundação do copiloto.
 */
export type OperationalContextBundle = {
  schemaVersion: typeof OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION;
  scope: OperationalCopilotContextScope;
  asOf: string;
  window: { fromISO: string; toISO: string };
  /** Sinais numéricos canônicos (espelho do scoring de origem, sem recomputar). */
  signals: {
    healthState: OperationalHealthState;
    consolidatedRiskScore: number;
    operationalHealthScore: number;
  };
  coordinatorSummary: CoordinatorContextSummary;
  sections: OperationalContextSections;
  explainability: OperationalContextExplainability;
};

/**
 * Snapshot semântico operacional: camada compacta para telemetria, cache e futuros consumidores.
 */
export type OperationalSemanticSnapshot = {
  schemaVersion: typeof OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION;
  scope: OperationalCopilotContextScope;
  asOf: string;
  healthState: string;
  consolidatedRiskScore: number;
  operationalHealthScore: number;
  semanticTags: string[];
  narrativeHeadline: string;
  coordinatorInsights: string[];
  semanticHighlights: string[];
  /** IDs de recomendações priorizadas (ordem estável). */
  priorityRecommendationIds: string[];
  fingerprint: string;
};

/** Payload delimitado para futura API / copiloto (sem recomputar analytics no servidor). */
export type OperationalContextPayload = {
  schemaVersion: typeof OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION;
  scope: OperationalCopilotContextScope;
  asOf: string;
  executiveSummary: string;
  coordinatorSummary: CoordinatorContextSummary;
  sectionDigests: Array<{
    key: keyof OperationalContextSections;
    title: string;
    bullets: string[];
  }>;
  references: ContextProvenanceRef[];
  fingerprint: string;
};

export type OperationalTimelineContextSlice = {
  /** Linhas curtas já derivadas de eventos materializados (primeira página, etc.). */
  lines: string[];
  lastEventAt: string | null;
  sampleSize: number;
  eventIds: string[];
};

/**
 * Entrada para construção do bundle ao vivo — apenas dados já obtidos pela UI / query agregada.
 */
export type OperationalCopilotContextLiveInput = {
  snapshot: OperationalCommandCenterSnapshot;
  alerts: readonly OperationalAlert[];
  analytics?: OperationalAnalyticsSnapshot | null;
  timeline?: OperationalTimelineContextSlice | null;
};
