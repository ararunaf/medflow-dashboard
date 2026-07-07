/**
 * Mapeamento de sessões de captura para filas operacionais.
 * MEDICFLOW-PROCESSING-CENTER-01
 */
import { parseReviewMetadata } from "../review/review-workspace-service";
import type { CaptureSessionStatus } from "../types";
import type { ProcessingQueueId } from "./types";

function stageStatus(metadata: Record<string, unknown>, key: string): string | null {
  const stage = metadata[key];
  if (!stage || typeof stage !== "object") return null;
  const status = (stage as Record<string, unknown>).status;
  return typeof status === "string" ? status : null;
}

function stageCompleted(metadata: Record<string, unknown>, key: string): boolean {
  return stageStatus(metadata, key) === "completed";
}

function hasReviewContext(metadata: Record<string, unknown>): boolean {
  return Boolean(metadata.review && typeof metadata.review === "object");
}

export function resolveProcessingQueue(
  status: CaptureSessionStatus,
  metadata: Record<string, unknown>,
): ProcessingQueueId {
  const review = parseReviewMetadata(metadata);

  if (review.approvalStatus === "aprovada" || status === "APPROVED") {
    return "aprovadas";
  }
  if (review.approvalStatus === "reprovada") {
    return "reprovadas";
  }

  const correctionMeta = metadata.correction;
  const correctionPending =
    correctionMeta &&
    typeof correctionMeta === "object" &&
    typeof (correctionMeta as Record<string, unknown>).pendingCount === "number"
      ? ((correctionMeta as Record<string, unknown>).pendingCount as number)
      : 0;

  if (review.approvalStatus === "aguardando_correcoes" || correctionPending > 0) {
    return "correcao";
  }

  if (status === "REVIEW") {
    return "aguardando_revisao";
  }

  if (
    status === "OCR_PENDING" ||
    status === "PREPROCESSING" ||
    status === "UPLOADED" ||
    status === "CREATED"
  ) {
    return "ocr_pendente";
  }

  const ocrDone = stageCompleted(metadata, "ocr");
  const parserDone = stageCompleted(metadata, "parser");
  const auditDone = stageCompleted(metadata, "audit");

  if (status === "AUDITING" || (parserDone && !auditDone)) {
    return "auditoria";
  }

  if (status === "PARSING" || status === "OCR_COMPLETED" || (ocrDone && !parserDone)) {
    return "parser";
  }

  if (!ocrDone) {
    return "ocr_pendente";
  }

  if (
    hasReviewContext(metadata) && review.approvalStatus === "em_revisao"
  ) {
    return "aguardando_revisao";
  }

  if (auditDone && ocrDone && parserDone) {
    return "aguardando_revisao";
  }

  return "ocr_pendente";
}

export function isTerminalQueue(queue: ProcessingQueueId): boolean {
  return queue === "aprovadas" || queue === "reprovadas";
}
