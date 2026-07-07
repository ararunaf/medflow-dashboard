/**
 * LearningLoopService — orquestra registro de decisões e métricas.
 * MEDICFLOW-LEARNING-LOOP-01
 *
 * Consome exclusivamente propostas decididas pela Correção Assistida.
 * Não altera Correction Assistant, OCR, Parser ou Auditoria.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  appendCaptureEvent,
  buildCaptureEvent,
} from "../../infrastructure/capture-events";
import { getCaptureSession } from "../../infrastructure/capture-session-store";
import type {
  CorrectionProposal,
  CorrectionProposalStore,
  UpdateCorrectionProposalInput,
} from "../../correction/types/correction-proposal";
import { buildDashboardView } from "../engine/recommendation-engine";
import {
  appendRecordIfNew,
  extractDecidedRecordsFromStore,
  getDefaultLearningLoopEngine,
  proposalToLearningRecord,
} from "../engine/learning-loop-engine";
import {
  buildLearningSummaryFromStore,
  loadLearningMetrics,
  loadLearningRecords,
  persistLearningArtifacts,
} from "../infrastructure/learning-storage";
import type {
  LearningDashboardView,
  LearningMetricsStore,
  LearningRecord,
  LearningRecordsStore,
} from "../types/learning-record";

async function persistSessionMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({ metadata, updated_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) throw error;
}

export type RecordLearningDecisionResult = {
  record: LearningRecord | null;
  store: LearningRecordsStore;
  metrics: LearningMetricsStore;
};

export class LearningLoopService {
  private readonly engine = getDefaultLearningLoopEngine();

  async recordDecisionFromProposal(
    ctx: ServiceCtx,
    sessionId: string,
    proposal: CorrectionProposal,
    proposalGeneratedAt?: string,
  ): Promise<RecordLearningDecisionResult> {
    const record = this.engine.proposalToRecord(
      proposal,
      sessionId,
      proposalGeneratedAt,
    );
    if (!record) {
      const existingStore = await loadLearningRecords(ctx);
      const metrics =
        (await loadLearningMetrics(ctx)) ??
        this.engine.calculateMetrics(existingStore);
      return { record: null, store: existingStore, metrics };
    }

    let store = await loadLearningRecords(ctx);
    store = appendRecordIfNew(store, record);
    const { metrics, recordsPath, metricsPath } = await persistLearningArtifacts(
      ctx,
      store,
    );

    const detail = await getCaptureSession(ctx, sessionId);
    const summary = buildLearningSummaryFromStore(store, recordsPath, metricsPath);
    let metadata = appendCaptureEvent(
      detail.metadata ?? {},
      buildCaptureEvent("learning_recorded", sessionId, {
        learningId: record.learningId,
        proposalId: record.proposalId,
        ruleId: record.ruleId,
        action: record.action,
      }),
    );
    metadata = { ...metadata, learning: summary };
    await persistSessionMetadata(ctx, sessionId, metadata);

    return { record, store, metrics };
  }

  async recordDecisionFromUpdate(
    ctx: ServiceCtx,
    sessionId: string,
    store: CorrectionProposalStore,
    input: UpdateCorrectionProposalInput,
  ): Promise<RecordLearningDecisionResult> {
    const proposal = store.proposals.find((p) => p.proposalId === input.proposalId);
    if (!proposal) {
      const existingStore = await loadLearningRecords(ctx);
      const metrics =
        (await loadLearningMetrics(ctx)) ??
        this.engine.calculateMetrics(existingStore);
      return { record: null, store: existingStore, metrics };
    }
    return this.recordDecisionFromProposal(ctx, sessionId, proposal, store.generatedAt);
  }

  async syncSessionDecisions(
    ctx: ServiceCtx,
    sessionId: string,
    correctionStore: CorrectionProposalStore,
  ): Promise<LearningRecordsStore> {
    const records = extractDecidedRecordsFromStore(
      sessionId,
      correctionStore.proposals,
      correctionStore.generatedAt,
    );
    let store = await loadLearningRecords(ctx);
    for (const record of records) {
      store = appendRecordIfNew(store, record);
    }
    await persistLearningArtifacts(ctx, store);
    return store;
  }

  async getRecords(ctx: ServiceCtx): Promise<LearningRecordsStore> {
    return loadLearningRecords(ctx);
  }

  async getMetrics(ctx: ServiceCtx): Promise<LearningMetricsStore> {
    const cached = await loadLearningMetrics(ctx);
    if (cached) return cached;
    const store = await loadLearningRecords(ctx);
    return this.engine.calculateMetrics(store);
  }

  async getDashboard(ctx: ServiceCtx): Promise<LearningDashboardView> {
    const metrics = await this.getMetrics(ctx);
    return buildDashboardView(metrics);
  }
}

let defaultService: LearningLoopService | null = null;

export function getDefaultLearningLoopService(): LearningLoopService {
  if (!defaultService) defaultService = new LearningLoopService();
  return defaultService;
}

export async function recordCaptureLearningDecision(
  ctx: ServiceCtx,
  sessionId: string,
  store: CorrectionProposalStore,
  input: UpdateCorrectionProposalInput,
): Promise<RecordLearningDecisionResult> {
  return getDefaultLearningLoopService().recordDecisionFromUpdate(
    ctx,
    sessionId,
    store,
    input,
  );
}

export async function getCaptureLearningDashboard(
  ctx: ServiceCtx,
): Promise<LearningDashboardView> {
  return getDefaultLearningLoopService().getDashboard(ctx);
}

export async function getCaptureLearningMetrics(
  ctx: ServiceCtx,
): Promise<LearningMetricsStore> {
  return getDefaultLearningLoopService().getMetrics(ctx);
}

export async function getCaptureLearningRecords(
  ctx: ServiceCtx,
): Promise<LearningRecordsStore> {
  return getDefaultLearningLoopService().getRecords(ctx);
}

export { proposalToLearningRecord };
