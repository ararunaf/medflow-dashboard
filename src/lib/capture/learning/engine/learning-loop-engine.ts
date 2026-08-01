/**
 * LearningLoopEngine — registra decisões e calcula métricas.
 * MEDICFLOW-LEARNING-LOOP-01
 *
 * Opera exclusivamente sobre eventos da Correção Assistida.
 * Não altera regras, templates ou dados de produção.
 */
import type { CorrectionProposal } from "../../correction/types/correction-proposal";
import type {
  FieldMetrics,
  LearningAction,
  LearningMetricsStore,
  LearningRecord,
  LearningRecordsStore,
  RuleMetrics,
  TemporalBucket,
} from "../types/learning-record";

export const LEARNING_ENGINE_VERSION = "learning_loop_v1";

export function buildLearningId(proposalId: string): string {
  return `lr-${proposalId}`;
}

export function mapProposalStatusToAction(
  status: CorrectionProposal["status"],
): LearningAction | null {
  switch (status) {
    case "accepted":
      return "accept";
    case "edited":
      return "edit";
    case "rejected":
      return "reject";
    default:
      return null;
  }
}

export function resolveFinalValue(proposal: CorrectionProposal): string | null {
  if (proposal.status === "edited") return proposal.editedValue ?? null;
  if (proposal.status === "accepted") return proposal.suggestedValue;
  return proposal.currentValue;
}

export function proposalToLearningRecord(
  proposal: CorrectionProposal,
  sessionId: string,
  proposalGeneratedAt?: string,
): LearningRecord | null {
  const action = mapProposalStatusToAction(proposal.status);
  if (!action || !proposal.decidedAt) return null;

  const decidedAtMs = new Date(proposal.decidedAt).getTime();
  const generatedAtMs = proposalGeneratedAt ? new Date(proposalGeneratedAt).getTime() : decidedAtMs;
  const timeToDecisionMs = Math.max(0, decidedAtMs - generatedAtMs);

  return {
    learningId: buildLearningId(proposal.proposalId),
    sessionId,
    proposalId: proposal.proposalId,
    ruleId: proposal.ruleId,
    field: proposal.field,
    action,
    originalValue: proposal.currentValue,
    suggestedValue: proposal.suggestedValue,
    finalValue: resolveFinalValue(proposal),
    confidence: proposal.confidence,
    accepted: action === "accept",
    edited: action === "edit",
    rejected: action === "reject",
    timeToDecisionMs,
    timestamp: proposal.decidedAt,
  };
}

export function extractDecidedRecordsFromStore(
  sessionId: string,
  proposals: CorrectionProposal[],
  proposalGeneratedAt?: string,
): LearningRecord[] {
  return proposals
    .map((p) => proposalToLearningRecord(p, sessionId, proposalGeneratedAt))
    .filter((r): r is LearningRecord => r !== null);
}

export function appendRecordIfNew(
  store: LearningRecordsStore,
  record: LearningRecord,
): LearningRecordsStore {
  const exists = store.records.some((r) => r.learningId === record.learningId);
  if (exists) return store;

  return {
    ...store,
    updatedAt: new Date().toISOString(),
    records: [...store.records, record],
  };
}

export function appendRecordsIfNew(
  store: LearningRecordsStore,
  records: LearningRecord[],
): LearningRecordsStore {
  let next = store;
  for (const record of records) {
    next = appendRecordIfNew(next, record);
  }
  return next;
}

function roundRate(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function computeRates(records: LearningRecord[]) {
  const total = records.length;
  if (total === 0) {
    return {
      acceptanceRate: 0,
      editRate: 0,
      rejectRate: 0,
      averageConfidence: 0,
      falsePositiveRate: 0,
      averageTimeToDecisionMs: 0,
    };
  }

  const accepted = records.filter((r) => r.accepted).length;
  const edited = records.filter((r) => r.edited).length;
  const rejected = records.filter((r) => r.rejected).length;
  const avgConfidence = records.reduce((sum, r) => sum + r.confidence, 0) / total;
  const times = records.map((r) => r.timeToDecisionMs ?? 0).filter((t) => t >= 0);
  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  return {
    acceptanceRate: roundRate(accepted / total),
    editRate: roundRate(edited / total),
    rejectRate: roundRate(rejected / total),
    averageConfidence: roundRate(avgConfidence),
    falsePositiveRate: roundRate(rejected / total),
    averageTimeToDecisionMs: Math.round(avgTime),
  };
}

export function calculateRuleMetrics(records: LearningRecord[]): RuleMetrics[] {
  const byRule = new Map<string, LearningRecord[]>();
  for (const record of records) {
    const list = byRule.get(record.ruleId) ?? [];
    list.push(record);
    byRule.set(record.ruleId, list);
  }

  return [...byRule.entries()]
    .map(([ruleId, ruleRecords]) => {
      const rates = computeRates(ruleRecords);
      return {
        ruleId,
        usageCount: ruleRecords.length,
        ...rates,
      };
    })
    .sort((a, b) => b.usageCount - a.usageCount);
}

export function calculateFieldMetrics(records: LearningRecord[]): FieldMetrics[] {
  const byField = new Map<string, LearningRecord[]>();
  for (const record of records) {
    const list = byField.get(record.field) ?? [];
    list.push(record);
    byField.set(record.field, list);
  }

  return [...byField.entries()]
    .map(([field, fieldRecords]) => {
      const rates = computeRates(fieldRecords);
      return {
        field,
        usageCount: fieldRecords.length,
        acceptanceRate: rates.acceptanceRate,
        editRate: rates.editRate,
        rejectRate: rates.rejectRate,
        averageConfidence: rates.averageConfidence,
      };
    })
    .sort((a, b) => b.usageCount - a.usageCount);
}

export function calculateTemporalEvolution(records: LearningRecord[]): TemporalBucket[] {
  const byDay = new Map<string, LearningRecord[]>();
  for (const record of records) {
    const day = record.timestamp.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(record);
    byDay.set(day, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, dayRecords]) => {
      const rates = computeRates(dayRecords);
      return {
        period,
        accepted: dayRecords.filter((r) => r.accepted).length,
        edited: dayRecords.filter((r) => r.edited).length,
        rejected: dayRecords.filter((r) => r.rejected).length,
        total: dayRecords.length,
        averageConfidence: rates.averageConfidence,
      };
    });
}

export function calculateMetricsFromRecords(store: LearningRecordsStore): LearningMetricsStore {
  const { records } = store;
  const global = computeRates(records);

  return {
    version: "learning_metrics_v1",
    tenantId: store.tenantId,
    computedAt: new Date().toISOString(),
    engineVersion: LEARNING_ENGINE_VERSION,
    totalRecords: records.length,
    globalAcceptanceRate: global.acceptanceRate,
    globalEditRate: global.editRate,
    globalRejectRate: global.rejectRate,
    globalAverageConfidence: global.averageConfidence,
    globalAverageTimeToDecisionMs: global.averageTimeToDecisionMs,
    byRule: calculateRuleMetrics(records),
    byField: calculateFieldMetrics(records),
    temporalEvolution: calculateTemporalEvolution(records),
  };
}

export function buildEmptyRecordsStore(tenantId: string): LearningRecordsStore {
  return {
    version: "learning_records_v1",
    tenantId,
    updatedAt: new Date().toISOString(),
    engineVersion: LEARNING_ENGINE_VERSION,
    records: [],
  };
}

export class LearningLoopEngine {
  proposalToRecord(
    proposal: CorrectionProposal,
    sessionId: string,
    proposalGeneratedAt?: string,
  ): LearningRecord | null {
    return proposalToLearningRecord(proposal, sessionId, proposalGeneratedAt);
  }

  appendRecord(store: LearningRecordsStore, record: LearningRecord): LearningRecordsStore {
    return appendRecordIfNew(store, record);
  }

  calculateMetrics(store: LearningRecordsStore): LearningMetricsStore {
    return calculateMetricsFromRecords(store);
  }
}

let defaultEngine: LearningLoopEngine | null = null;

export function getDefaultLearningLoopEngine(): LearningLoopEngine {
  if (!defaultEngine) defaultEngine = new LearningLoopEngine();
  return defaultEngine;
}
