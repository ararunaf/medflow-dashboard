/**
 * RiskScorer — cálculo determinístico de risco de glosa.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 */
import { randomUUID } from "node:crypto";
import type { AuditFinding } from "../../audit/types/audit-finding";
import type { AuditRuleCategory, AuditSeverity } from "../../audit/types/audit-rule";
import type { EnrichedAuditFinding } from "../../contract/types/enriched-finding";
import type { LearningMetricsStore } from "../../learning/types/learning-record";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import type {
  CategoryRiskScore,
  CorrectionPriority,
  CorrectionPriorityItem,
  FindingRiskScore,
  RiskAssessment,
  RiskFactorContribution,
  RiskLevel,
} from "../types/risk-assessment";
import {
  CATEGORY_SCORE_CAPS,
  classifyRiskLevel,
  CONFIDENCE_RISK_THRESHOLD,
  countMultiplier,
  DEFAULT_RISK_SCORING_WEIGHTS,
  GUIDE_TYPE_BASE_RISK,
  SEVERITY_BASE_WEIGHTS,
  UNRESOLVED_OPERATOR_RISK,
  type RiskScoringWeights,
} from "../types/scoring-config";

const SEVERITY_ORDER: Record<AuditSeverity, number> = {
  critico: 4,
  alto: 3,
  medio: 2,
  baixo: 1,
};

function severityPriority(severity: AuditSeverity): CorrectionPriority {
  if (severity === "critico") return "urgente";
  if (severity === "alto") return "alta";
  if (severity === "medio") return "media";
  return "baixa";
}

function maxSeverity(
  a: AuditSeverity | null,
  b: AuditSeverity,
): AuditSeverity {
  if (!a) return b;
  return SEVERITY_ORDER[b] > SEVERITY_ORDER[a] ? b : a;
}

function confidenceRiskPenalty(confidence: number, weight: number): RiskFactorContribution {
  const gap = Math.max(0, CONFIDENCE_RISK_THRESHOLD - confidence);
  const rawValue = gap;
  const contribution = Math.round(gap * 100 * weight);
  return {
    factorId: "confidence_gap",
    label: "Confiança abaixo do limiar",
    weight,
    rawValue,
    contribution,
    description: `Confiança ${Math.round(confidence * 100)}% — gap de ${Math.round(gap * 100)}%`,
  };
}

function learningRuleAdjustment(
  ruleId: string,
  metrics: LearningMetricsStore | null,
  weight: number,
): RiskFactorContribution | null {
  if (!metrics || metrics.totalRecords === 0) return null;
  const rule = metrics.byRule.find((r) => r.ruleId === ruleId);
  if (!rule || rule.usageCount < 1) return null;

  const rawValue = rule.rejectRate;
  const contribution = Math.round(rawValue * 15 * weight);
  if (contribution <= 0) return null;

  return {
    factorId: `learning_reject_${ruleId}`,
    label: "Taxa de rejeição observada (Learning Loop)",
    weight,
    rawValue,
    contribution,
    description: `Regra ${ruleId}: ${Math.round(rawValue * 100)}% rejeitada em decisões anteriores`,
  };
}

function estimateDenialProbability(riskScore: number, blocking: boolean): number {
  const base = Math.min(0.95, riskScore / 100);
  return Math.round((blocking ? Math.min(0.99, base + 0.15) : base) * 100) / 100;
}

function estimateFinancialImpact(
  finding: AuditFinding,
  enrichment: EnrichedAuditFinding | undefined,
  guide: StructuredGuide,
): number {
  const enrichedCents = enrichment?.enrichment?.estimatedFinancialImpactCents;
  if (enrichedCents && enrichedCents > 0) return enrichedCents;

  const severityCents: Record<AuditSeverity, number> = {
    critico: 100_000,
    alto: 50_000,
    medio: 15_000,
    baixo: 3_000,
  };
  return severityCents[finding.severity];
}

export type RiskScorerInput = {
  guide: StructuredGuide;
  findings: AuditFinding[];
  enrichedFindings: EnrichedAuditFinding[];
  operatorResolved: boolean;
  operatorAnsCode: string | null;
  learningMetrics: LearningMetricsStore | null;
  weights?: RiskScoringWeights;
};

export type RiskScorerResult = {
  assessment: RiskAssessment;
  findingRisks: FindingRiskScore[];
  categoryRisks: CategoryRiskScore[];
  correctionPriorityRanking: CorrectionPriorityItem[];
  scoringBreakdown: RiskFactorContribution[];
};

export function scoreGlosaRisk(input: RiskScorerInput): RiskScorerResult {
  const weights = input.weights ?? DEFAULT_RISK_SCORING_WEIGHTS;
  const openFindings = input.findings.filter((f) => f.status === "open");
  const enrichmentMap = new Map(
    input.enrichedFindings.map((e) => [`${e.finding.ruleId}::${e.finding.field}`, e]),
  );

  const globalFactors: RiskFactorContribution[] = [];

  const guideTypeBase = GUIDE_TYPE_BASE_RISK[input.guide.guideType] ?? 5;
  globalFactors.push({
    factorId: "guide_type",
    label: "Tipo de guia",
    weight: weights.guideTypeRisk,
    rawValue: guideTypeBase,
    contribution: Math.round(guideTypeBase * weights.guideTypeRisk),
    description: `Tipo ${input.guide.guideType} — risco base ${guideTypeBase}`,
  });

  if (!input.operatorResolved) {
    globalFactors.push({
      factorId: "operator_unresolved",
      label: "Operadora não identificada",
      weight: weights.operatorRisk,
      rawValue: UNRESOLVED_OPERATOR_RISK,
      contribution: Math.round(UNRESOLVED_OPERATOR_RISK * weights.operatorRisk),
      description: "Operadora não resolvida — regras genéricas aplicadas",
    });
  }

  const parserConf = input.guide.metadata.overallConfidence;
  const parserPenalty = confidenceRiskPenalty(parserConf, weights.parserConfidence);
  if (parserPenalty.contribution > 0) {
    parserPenalty.factorId = "parser_confidence";
    parserPenalty.label = "Confiança do Parser";
    globalFactors.push(parserPenalty);
  }

  const ocrConf = input.guide.metadata.ocrAverageConfidence;
  const ocrPenalty = confidenceRiskPenalty(ocrConf, weights.ocrConfidence);
  if (ocrPenalty.contribution > 0) {
    ocrPenalty.factorId = "ocr_confidence";
    ocrPenalty.label = "Confiança do OCR";
    globalFactors.push(ocrPenalty);
  }

  const countMult = countMultiplier(openFindings.length);
  if (openFindings.length > 1) {
    globalFactors.push({
      factorId: "finding_count",
      label: "Quantidade de findings",
      weight: weights.findingCount,
      rawValue: openFindings.length,
      contribution: Math.round((countMult - 1) * 20 * weights.findingCount),
      description: `${openFindings.length} findings abertos — multiplicador ${countMult}`,
    });
  }

  const findingRisks: FindingRiskScore[] = openFindings.map((finding) => {
    const key = `${finding.ruleId}::${finding.field}`;
    const enriched = enrichmentMap.get(key);
    const factors: RiskFactorContribution[] = [];

    const severityWeight = SEVERITY_BASE_WEIGHTS[finding.severity];
    factors.push({
      factorId: "severity",
      label: "Severidade do finding",
      weight: weights.findingSeverity,
      rawValue: severityWeight,
      contribution: Math.round(severityWeight * weights.findingSeverity * countMult),
      description: `Severidade ${finding.severity} — peso base ${severityWeight}`,
    });

    const contractRisk = enriched?.enrichment?.estimatedDenialRisk ?? 0;
    if (contractRisk > 0) {
      factors.push({
        factorId: "contract_rule",
        label: "Regras contratuais",
        weight: weights.contractRuleRisk,
        rawValue: contractRisk,
        contribution: Math.round(contractRisk * weights.contractRuleRisk),
        description: `Risco contratual estimado: ${contractRisk}%`,
      });
    }

    if (finding.blocking) {
      factors.push({
        factorId: "blocking",
        label: "Finding bloqueante",
        weight: weights.blockingPenalty,
        rawValue: 1,
        contribution: Math.round(15 * weights.blockingPenalty),
        description: "Finding marcado como bloqueante para submissão",
      });
    }

    const learningFactor = learningRuleAdjustment(
      finding.ruleId,
      input.learningMetrics,
      weights.learningObservational,
    );
    if (learningFactor) factors.push(learningFactor);

    const riskScore = Math.min(
      100,
      factors.reduce((sum, f) => sum + f.contribution, 0),
    );

    const financialCents = estimateFinancialImpact(finding, enriched, input.guide);

    return {
      ruleId: finding.ruleId,
      field: finding.field,
      category: finding.category,
      severity: finding.severity,
      riskScore,
      denialProbability: estimateDenialProbability(riskScore, finding.blocking),
      estimatedFinancialImpactCents: financialCents,
      blocking: finding.blocking,
      priority: severityPriority(finding.severity),
      factors,
    };
  });

  const categoryMap = new Map<AuditRuleCategory, CategoryRiskScore>();
  for (const fr of findingRisks) {
    const existing = categoryMap.get(fr.category);
    const cappedScore = Math.min(
      CATEGORY_SCORE_CAPS[fr.category] ?? 50,
      fr.riskScore,
    );
    if (!existing) {
      categoryMap.set(fr.category, {
        category: fr.category,
        riskScore: cappedScore,
        findingCount: 1,
        maxSeverity: fr.severity,
        estimatedFinancialImpactCents: fr.estimatedFinancialImpactCents,
      });
    } else {
      categoryMap.set(fr.category, {
        category: fr.category,
        riskScore: Math.min(
          CATEGORY_SCORE_CAPS[fr.category] ?? 50,
          existing.riskScore + cappedScore,
        ),
        findingCount: existing.findingCount + 1,
        maxSeverity: maxSeverity(existing.maxSeverity, fr.severity),
        estimatedFinancialImpactCents:
          existing.estimatedFinancialImpactCents + fr.estimatedFinancialImpactCents,
      });
    }
  }

  const categoryRisks = [...categoryMap.values()].sort((a, b) => b.riskScore - a.riskScore);

  const findingsContribution = findingRisks.reduce((sum, f) => sum + f.riskScore, 0);
  const globalContribution = globalFactors.reduce((sum, f) => sum + f.contribution, 0);
  const rawOverall = findingsContribution + globalContribution;
  const overallRiskScore = Math.min(100, Math.round(rawOverall));

  const scoringBreakdown = [
    ...globalFactors,
    ...findingRisks.flatMap((f) =>
      f.factors.map((factor) => ({
        ...factor,
        factorId: `${f.ruleId}_${factor.factorId}`,
        label: `${f.ruleId}: ${factor.label}`,
      })),
    ),
  ].sort((a, b) => b.contribution - a.contribution);

  const topRiskFactors = scoringBreakdown.slice(0, 10);

  const estimatedFinancialImpact = findingRisks.reduce(
    (sum, f) => sum + f.estimatedFinancialImpactCents,
    0,
  );

  const blockingIssues = findingRisks
    .filter((f) => f.blocking)
    .map((f) => `${f.ruleId} — ${f.field}`);

  const overallRiskLevel: RiskLevel = classifyRiskLevel(overallRiskScore);
  const estimatedDenialProbability = estimateDenialProbability(
    overallRiskScore,
    blockingIssues.length > 0,
  );

  const recommendations = buildRecommendations(
    overallRiskLevel,
    findingRisks,
    blockingIssues,
    input.guide.metadata.overallConfidence,
  );

  const correctionPriorityRanking: CorrectionPriorityItem[] = [...findingRisks]
    .sort((a, b) => {
      const priorityOrder: Record<CorrectionPriority, number> = {
        urgente: 4,
        alta: 3,
        media: 2,
        baixa: 1,
      };
      const pDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (pDiff !== 0) return pDiff;
      return b.riskScore - a.riskScore;
    })
    .map((fr, index) => {
      const finding = openFindings.find(
        (f) => f.ruleId === fr.ruleId && f.field === fr.field,
      );
      return {
        rank: index + 1,
        ruleId: fr.ruleId,
        field: fr.field,
        message: finding?.message ?? fr.ruleId,
        priority: fr.priority,
        riskScore: fr.riskScore,
        estimatedFinancialImpactCents: fr.estimatedFinancialImpactCents,
      };
    });

  const assessment: RiskAssessment = {
    assessmentId: randomUUID(),
    overallRiskScore,
    overallRiskLevel,
    estimatedFinancialImpact,
    estimatedDenialProbability,
    blockingIssues,
    topRiskFactors,
    recommendations,
  };

  return {
    assessment,
    findingRisks,
    categoryRisks,
    correctionPriorityRanking,
    scoringBreakdown,
  };
}

function buildRecommendations(
  level: RiskLevel,
  findingRisks: FindingRiskScore[],
  blockingIssues: string[],
  parserConfidence: number,
): string[] {
  const recs: string[] = [];

  if (level === "Crítico") {
    recs.push("Não enviar ao faturamento até resolver todos os bloqueios críticos.");
  } else if (level === "Alto") {
    recs.push("Revisar e corrigir findings de alta severidade antes do envio.");
  } else if (level === "Médio") {
    recs.push("Corrigir pendências identificadas para reduzir risco de glosa parcial.");
  } else {
    recs.push("Guia com baixo risco — validar campos antes do envio.");
  }

  if (blockingIssues.length > 0) {
    recs.push(
      `Resolver ${blockingIssues.length} bloqueio(s): ${blockingIssues.slice(0, 3).join(", ")}${blockingIssues.length > 3 ? "…" : ""}`,
    );
  }

  const topFinding = findingRisks.sort((a, b) => b.riskScore - a.riskScore)[0];
  if (topFinding) {
    recs.push(
      `Prioridade máxima: corrigir ${topFinding.ruleId} (${topFinding.field}) — risco ${topFinding.riskScore}%.`,
    );
  }

  if (parserConfidence < CONFIDENCE_RISK_THRESHOLD) {
    recs.push(
      "Confiança do parser abaixo do limiar — revisar campos extraídos manualmente.",
    );
  }

  return recs;
}
