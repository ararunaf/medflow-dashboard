/**
 * RecommendationEngine — gera recomendações observacionais.
 * MEDICFLOW-LEARNING-LOOP-01
 *
 * Apenas recomenda — nunca altera regras ou templates automaticamente.
 */
import type {
  LearningMetricsStore,
  LearningRecommendation,
  RuleMetrics,
} from "../types/learning-record";

const LOW_ACCEPTANCE_THRESHOLD = 0.4;
const HIGH_EDIT_THRESHOLD = 0.5;
const HIGH_CONFIDENCE_THRESHOLD = 0.75;
const MIN_SAMPLES = 1;

function ruleLabel(ruleId: string): string {
  return `Regra ${ruleId}`;
}

export function generateRecommendations(
  metrics: LearningMetricsStore,
): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = [];
  let counter = 0;

  const nextId = () => `rec-${++counter}`;

  for (const rule of metrics.byRule) {
    if (rule.usageCount < MIN_SAMPLES) continue;

    if (rule.acceptanceRate < LOW_ACCEPTANCE_THRESHOLD) {
      recommendations.push({
        id: nextId(),
        severity: "warning",
        message: `${ruleLabel(rule.ruleId)} apresenta baixa aceitação (${Math.round(rule.acceptanceRate * 100)}%).`,
        ruleId: rule.ruleId,
      });
    }

    if (rule.rejectRate >= HIGH_EDIT_THRESHOLD && rule.usageCount >= 2) {
      recommendations.push({
        id: nextId(),
        severity: "warning",
        message: `${ruleLabel(rule.ruleId)} apresenta alta taxa de rejeição — possível falso positivo.`,
        ruleId: rule.ruleId,
      });
    }

    if (rule.editRate >= HIGH_EDIT_THRESHOLD) {
      recommendations.push({
        id: nextId(),
        severity: "insight",
        message: `As correções de ${rule.ruleId} são frequentemente editadas (${Math.round(rule.editRate * 100)}%).`,
        ruleId: rule.ruleId,
      });
    }
  }

  for (const field of metrics.byField) {
    if (field.usageCount < MIN_SAMPLES) continue;

    const fieldUpper = field.field.toUpperCase();
    if (
      (fieldUpper.includes("CRM") || fieldUpper.includes("EXECUTING_CRM")) &&
      field.averageConfidence >= HIGH_CONFIDENCE_THRESHOLD
    ) {
      recommendations.push({
        id: nextId(),
        severity: "info",
        message: "Sugestões CRM possuem alta confiança.",
        field: field.field,
      });
    }

    if (
      (fieldUpper.includes("TUSS") ||
        fieldUpper.includes("PROCEDURE") ||
        fieldUpper.includes("PRC")) &&
      field.editRate >= HIGH_EDIT_THRESHOLD
    ) {
      recommendations.push({
        id: nextId(),
        severity: "insight",
        message: "As correções de TUSS são frequentemente editadas.",
        field: field.field,
      });
    }
  }

  if (metrics.totalRecords === 0) {
    recommendations.push({
      id: nextId(),
      severity: "info",
      message: "Nenhuma decisão registrada ainda. Aceite, edite ou rejeite propostas para alimentar o learning loop.",
    });
  } else if (metrics.globalAverageConfidence >= HIGH_CONFIDENCE_THRESHOLD) {
    recommendations.push({
      id: nextId(),
      severity: "info",
      message: `Score médio de confiança elevado (${Math.round(metrics.globalAverageConfidence * 100)}%).`,
    });
  }

  if (metrics.globalRejectRate >= 0.5 && metrics.totalRecords >= 3) {
    recommendations.push({
      id: nextId(),
      severity: "warning",
      message: "Taxa global de rejeição elevada — revisar calibração das regras de auditoria.",
    });
  }

  return recommendations;
}

export function buildDashboardView(metrics: LearningMetricsStore) {
  const topAcceptedRules = [...metrics.byRule]
    .filter((r) => r.usageCount >= MIN_SAMPLES)
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
    .slice(0, 5);

  const topRejectedRules = [...metrics.byRule]
    .filter((r) => r.usageCount >= MIN_SAMPLES)
    .sort((a, b) => b.rejectRate - a.rejectRate)
    .slice(0, 5);

  const topEditedFields = [...metrics.byField]
    .filter((f) => f.usageCount >= MIN_SAMPLES)
    .sort((a, b) => b.editRate - a.editRate)
    .slice(0, 5);

  return {
    metrics,
    recommendations: generateRecommendations(metrics),
    topAcceptedRules,
    topRejectedRules,
    topEditedFields,
  };
}

export class RecommendationEngine {
  generate(metrics: LearningMetricsStore): LearningRecommendation[] {
    return generateRecommendations(metrics);
  }

  buildView(metrics: LearningMetricsStore) {
    return buildDashboardView(metrics);
  }
}

let defaultRecommendationEngine: RecommendationEngine | null = null;

export function getDefaultRecommendationEngine(): RecommendationEngine {
  if (!defaultRecommendationEngine) {
    defaultRecommendationEngine = new RecommendationEngine();
  }
  return defaultRecommendationEngine;
}

export type { RuleMetrics };
