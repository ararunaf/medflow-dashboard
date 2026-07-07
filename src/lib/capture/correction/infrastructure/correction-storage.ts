/**
 * Persistência de CorrectionProposalStore no bucket clinical-documents.
 * MEDICFLOW-CORRECTION-ASSISTANT-01
 *
 * Preserva ocr_result.json, structured_guide.json e audit_report.json.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { CLINICAL_DOCUMENTS_BUCKET } from "../../infrastructure/storage-paths";
import type {
  CorrectionProposalStore,
  CorrectionProposalSummaryMeta,
} from "../types/correction-proposal";

export const CORRECTION_PROPOSALS_FILENAME = "correction_proposals.json";

export function buildCorrectionProposalsStoragePath(
  tenantId: string,
  sessionId: string,
): string {
  return `${tenantId}/${sessionId}/audit/${CORRECTION_PROPOSALS_FILENAME}`;
}

export async function persistCorrectionProposals(
  ctx: ServiceCtx,
  sessionId: string,
  store: CorrectionProposalStore,
): Promise<{ storagePath: string }> {
  const storagePath = buildCorrectionProposalsStoragePath(ctx.tenantId, sessionId);
  const payload = JSON.stringify(store, null, 2);

  const { error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .upload(storagePath, new TextEncoder().encode(payload), {
      contentType: "application/json",
      upsert: true,
    });

  if (error) throw error;
  return { storagePath };
}

export async function loadCorrectionProposals(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CorrectionProposalStore | null> {
  const storagePath = buildCorrectionProposalsStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) return null;

  const text = await data.text();
  return JSON.parse(text) as CorrectionProposalStore;
}

export async function getCorrectionProposalsSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildCorrectionProposalsStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, ttlSeconds, {
      download: CORRECTION_PROPOSALS_FILENAME,
    });

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Correction proposals não encontradas.");
  }

  return {
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    filename: CORRECTION_PROPOSALS_FILENAME,
  };
}

export function buildCorrectionSummaryFromStore(
  store: CorrectionProposalStore,
  storagePath: string,
): CorrectionProposalSummaryMeta {
  const counts = store.proposals.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    status: "completed",
    totalProposals: store.proposals.length,
    pendingCount: counts.pending ?? 0,
    acceptedCount: counts.accepted ?? 0,
    editedCount: counts.edited ?? 0,
    rejectedCount: counts.rejected ?? 0,
    appliedCount: counts.applied ?? 0,
    storagePath,
  };
}

export function buildCorrectionSummaryFromMetadata(
  metadata: Record<string, unknown>,
): CorrectionProposalSummaryMeta | null {
  const correction = metadata.correction as CorrectionProposalSummaryMeta | undefined;
  if (!correction || typeof correction !== "object") return null;
  return correction;
}
