/**
 * Mapeamento entre fases de domínio e status persistidos (capture_session_status).
 */
import type { CaptureSessionStatus } from "@/lib/capture/types";
import type { CapturePhase } from "../types";

const PHASE_TO_DB: Partial<Record<CapturePhase, CaptureSessionStatus>> = {
  uploaded: "UPLOADED",
  preprocessing: "PREPROCESSING",
  waiting_ocr: "OCR_PENDING",
  ocr_completed: "OCR_COMPLETED",
  parser_completed: "PARSING",
  auditing: "AUDITING",
  completed: "APPROVED",
  cancelled: "ARCHIVED",
};

const DB_TO_PHASE: Partial<Record<CaptureSessionStatus, CapturePhase>> = {
  CREATED: "idle",
  UPLOADED: "uploaded",
  PREPROCESSING: "preprocessing",
  OCR_PENDING: "waiting_ocr",
  OCR_COMPLETED: "ocr_completed",
  PARSING: "parser_completed",
  AUDITING: "auditing",
  REVIEW: "auditing",
  APPROVED: "completed",
  ARCHIVED: "cancelled",
};

export function phaseToDbStatus(phase: CapturePhase): CaptureSessionStatus | null {
  if (phase === "idle" || phase === "uploading" || phase === "failed") return null;
  return PHASE_TO_DB[phase] ?? null;
}

export function dbStatusToPhase(
  status: CaptureSessionStatus,
  metadata?: Record<string, unknown>,
): CapturePhase {
  if (metadata?.capturePhase === "failed") return "failed";
  if (metadata?.capturePhase === "cancelled") return "cancelled";
  if (metadata?.capturePhase === "audit_completed") return "auditing";
  if (metadata?.capturePhase === "parser_completed") return "parser_completed";
  if (metadata?.capturePhase === "ocr_completed") return "ocr_completed";
  return DB_TO_PHASE[status] ?? "idle";
}

export function isTerminalPhase(phase: CapturePhase): boolean {
  return phase === "completed" || phase === "failed" || phase === "cancelled";
}
