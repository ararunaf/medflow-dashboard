/**
 * CorrectionAssistantService — orquestra AuditFindings → CorrectionProposals → persistência.
 * MEDICFLOW-CORRECTION-ASSISTANT-01
 */
import { NotFoundError, ValidationError } from "@/lib/domain/operations/errors";
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendCaptureEvent, buildCaptureEvent } from "../../infrastructure/capture-events";
import { getCaptureSession } from "../../infrastructure/capture-session-store";
import { loadAuditReport } from "../../audit/infrastructure/audit-storage";
import {
  CORRECTION_ENGINE_VERSION,
  getDefaultCorrectionProposalEngine,
} from "../engine/correction-proposal-engine";
import {
  buildCorrectionSummaryFromStore,
  loadCorrectionProposals,
  persistCorrectionProposals,
} from "../infrastructure/correction-storage";
import type {
  CorrectionProposal,
  CorrectionProposalStatus,
  CorrectionProposalStore,
  UpdateCorrectionProposalInput,
} from "../types/correction-proposal";

export type GenerateCorrectionProposalsResult = {
  sessionId: string;
  store: CorrectionProposalStore;
  proposalCount: number;
};

export type { UpdateCorrectionProposalInput };

async function persistSessionMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({ metadata: metadata as Json, updated_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) throw error;
}

function buildStore(sessionId: string, proposals: CorrectionProposal[]): CorrectionProposalStore {
  return {
    version: "correction_proposals_v1",
    sessionId,
    generatedAt: new Date().toISOString(),
    engineVersion: CORRECTION_ENGINE_VERSION,
    proposals,
  };
}

export function decideProposalInStore(
  store: CorrectionProposalStore,
  input: UpdateCorrectionProposalInput,
): CorrectionProposal {
  const index = store.proposals.findIndex((p) => p.proposalId === input.proposalId);
  if (index < 0) {
    throw new NotFoundError("CorrectionProposal", input.proposalId);
  }

  const current = store.proposals[index]!;
  if (current.status !== "pending" && current.status !== "edited") {
    throw new ValidationError(`Proposta ${input.proposalId} já foi decidida (${current.status}).`, {
      status: current.status,
    });
  }

  const decidedAt = new Date().toISOString();

  switch (input.action) {
    case "accept":
      return { ...current, status: "accepted", decidedAt };
    case "edit":
      if (!input.editedValue?.trim()) {
        throw new ValidationError("Valor editado é obrigatório.", {
          proposalId: input.proposalId,
        });
      }
      return {
        ...current,
        status: "edited",
        editedValue: input.editedValue.trim(),
        decidedAt,
      };
    case "reject":
      return { ...current, status: "rejected", decidedAt };
  }
}

export function proposalDecisionEventType(
  action: UpdateCorrectionProposalInput["action"],
): "proposal_accepted" | "proposal_edited" | "proposal_rejected" {
  switch (action) {
    case "accept":
      return "proposal_accepted";
    case "edit":
      return "proposal_edited";
    case "reject":
      return "proposal_rejected";
  }
}

export class CorrectionAssistantService {
  private readonly engine = getDefaultCorrectionProposalEngine();

  async generateFromSession(
    ctx: ServiceCtx,
    sessionId: string,
    metadata: JsonObject,
  ): Promise<GenerateCorrectionProposalsResult> {
    const auditDone =
      metadata.audit &&
      typeof metadata.audit === "object" &&
      (metadata.audit as { status?: string }).status === "completed";

    if (!auditDone) {
      throw new ValidationError(
        "Propostas de correção só podem ser geradas após auditoria concluída.",
        { sessionId },
      );
    }

    const report = await loadAuditReport(ctx, sessionId);
    if (!report) throw new NotFoundError("AuditReport", sessionId);

    const { proposals } = this.engine.generateFromFindings(report.findings, sessionId);
    const store = buildStore(sessionId, proposals);
    const { storagePath } = await persistCorrectionProposals(ctx, sessionId, store);
    const summary = buildCorrectionSummaryFromStore(store, storagePath);

    metadata = {
      ...metadata,
      correction: summary,
    };

    for (const proposal of proposals) {
      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("proposal_generated", sessionId, {
          proposalId: proposal.proposalId,
          findingId: proposal.findingId,
          field: proposal.field,
          confidence: proposal.confidence,
          blocking: proposal.blocking,
        }),
      );
    }

    await persistSessionMetadata(ctx, sessionId, metadata);

    return {
      sessionId,
      store,
      proposalCount: proposals.length,
    };
  }

  async generateSession(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<GenerateCorrectionProposalsResult> {
    const detail = await getCaptureSession(ctx, sessionId);
    return this.generateFromSession(ctx, sessionId, detail.metadata ?? {});
  }

  async getProposals(ctx: ServiceCtx, sessionId: string): Promise<CorrectionProposalStore | null> {
    return loadCorrectionProposals(ctx, sessionId);
  }

  async updateProposal(
    ctx: ServiceCtx,
    sessionId: string,
    input: UpdateCorrectionProposalInput,
  ): Promise<CorrectionProposalStore> {
    const store = await loadCorrectionProposals(ctx, sessionId);
    if (!store) {
      throw new NotFoundError("CorrectionProposalStore", sessionId);
    }

    const index = store.proposals.findIndex((p) => p.proposalId === input.proposalId);
    if (index < 0) {
      throw new NotFoundError("CorrectionProposal", input.proposalId);
    }

    const updated = decideProposalInStore(store, input);
    const eventType = proposalDecisionEventType(input.action);

    const proposals = [...store.proposals];
    proposals[index] = updated;
    const nextStore: CorrectionProposalStore = { ...store, proposals };

    const { storagePath } = await persistCorrectionProposals(ctx, sessionId, nextStore);
    const summary = buildCorrectionSummaryFromStore(nextStore, storagePath);

    const detail = await getCaptureSession(ctx, sessionId);
    let metadata = appendCaptureEvent(
      detail.metadata ?? {},
      buildCaptureEvent(eventType, sessionId, {
        proposalId: updated.proposalId,
        findingId: updated.findingId,
        field: updated.field,
        status: updated.status,
        editedValue: updated.editedValue,
      }),
    );

    metadata = { ...metadata, correction: summary };
    await persistSessionMetadata(ctx, sessionId, metadata);

    return nextStore;
  }
}

let defaultService: CorrectionAssistantService | null = null;

export function getDefaultCorrectionAssistantService(): CorrectionAssistantService {
  if (!defaultService) defaultService = new CorrectionAssistantService();
  return defaultService;
}

export async function runCaptureCorrectionAssistant(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<GenerateCorrectionProposalsResult> {
  return getDefaultCorrectionAssistantService().generateSession(ctx, sessionId);
}

export async function getCaptureCorrectionProposals(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CorrectionProposalStore | null> {
  return getDefaultCorrectionAssistantService().getProposals(ctx, sessionId);
}

export async function updateCaptureCorrectionProposal(
  ctx: ServiceCtx,
  sessionId: string,
  input: UpdateCorrectionProposalInput,
): Promise<CorrectionProposalStore> {
  return getDefaultCorrectionAssistantService().updateProposal(ctx, sessionId, input);
}

export type { CorrectionProposalStatus };
