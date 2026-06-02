/**
 * Tipos da camada de planejamento operacional estratégico supervisionado.
 * Determinísticos, auditáveis e delimitados — sem autonomia de execução.
 */
import type { OperationalStrategicPlanningLifecycleState } from "@/lib/database.types";

export type StrategicStressLevel = "low" | "moderate" | "high";

/** Dimensão de pressão / demanda projetada (0..1 + explicabilidade). */
export type StrategicStressProjection = {
  code: string;
  label: string;
  level: StrategicStressLevel;
  score: number;
  rationale: string[];
  references: { kind: string; ref: string }[];
};

export type StrategicPipelineTrace = {
  /** Fases lógicas concluídas no motor (sem persistir múltiplas linhas). */
  completed: Array<"projected" | "analyzed" | "planned">;
  computedAt: string;
};

export type StrategicReadinessDimension = {
  code: string;
  label: string;
  score: number;
  note: string;
};

export type OperationalReadinessSummary = {
  overallScore: number;
  headline: string;
  dimensions: StrategicReadinessDimension[];
};

export type StrategicPlanOutputSection = {
  title: string;
  bullets: string[];
  horizonDays: number;
  references: { kind: string; ref: string }[];
};

export type MitigationRoadmapPhase = {
  ordinal: number;
  title: string;
  actions: string[];
  linkedRecommendationIds: string[];
};

export type MitigationRoadmapCard = {
  title: string;
  horizonDays: number;
  phases: MitigationRoadmapPhase[];
};

export type OrchestrationPreparednessIndicator = {
  activeOrchestrations: number;
  saturationLevel: StrategicStressLevel;
  saturationScore: number;
  checklist: string[];
};

export type GovernancePreparednessInsight = {
  readinessScore: number;
  narrative: string[];
  policyCycleRef: string | null;
  boundaries: string[];
};

export type StrategicPlanningExplainability = {
  planningRationale: string[];
  forecastRefs: { projection: string; basis: string; rationale: string[] }[];
  orchestrationRefs: { kind: string; ref: string }[];
  governanceRefs: { kind: string; ref: string }[];
  strategicNarrative: string[];
  readinessExplainability: string[];
};

export type StrategicOperationalPlanningBundle = {
  schemaVersion: "1.0.0";
  computedAt: string;
  pipelineTrace: StrategicPipelineTrace;
  stressProjections: StrategicStressProjection[];
  readiness: OperationalReadinessSummary;
  outputs: {
    staffingPreparation: StrategicPlanOutputSection;
    orchestrationReadiness: StrategicPlanOutputSection;
    mitigationRoadmap: MitigationRoadmapCard;
    escalationPreparedness: StrategicPlanOutputSection;
    governancePreparedness: StrategicPlanOutputSection;
  };
  orchestrationPreparedness: OrchestrationPreparednessIndicator;
  governanceInsight: GovernancePreparednessInsight;
  explainability: StrategicPlanningExplainability;
  governance: {
    supervisionRequired: true;
    planningBoundaries: string[];
  };
};

export type StrategicPlanningCycleDto = {
  id: string;
  fingerprint: string;
  lifecycleState: OperationalStrategicPlanningLifecycleState;
  strategicNarrative: string;
  stressDigest: Record<string, unknown>;
  computedAt: string;
};

export type StrategicOperationalPlanningLayerSummary = {
  asOf: string;
  enabled: boolean;
  liveBundle: StrategicOperationalPlanningBundle | null;
  persistedCycle: StrategicPlanningCycleDto | null;
};
