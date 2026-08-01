/**
 * State machine da Captura Inteligente.
 * Nenhum estado executa OCR — apenas transições válidas e metadados.
 */
import { StatusTransitionError } from "@/lib/domain/operations/errors";
import type { CaptureSessionStatus } from "./types";

/** Ordem linear do pipeline — transições só avançam (ou arquivam/cancelam). */
export const CAPTURE_STATUS_ORDER: readonly CaptureSessionStatus[] = [
  "CREATED",
  "UPLOADED",
  "PREPROCESSING",
  "OCR_PENDING",
  "OCR_COMPLETED",
  "PARSING",
  "AUDITING",
  "REVIEW",
  "APPROVED",
  "ARCHIVED",
] as const;

const STATUS_INDEX = new Map<CaptureSessionStatus, number>(
  CAPTURE_STATUS_ORDER.map((s, i) => [s, i]),
);

/** Estados terminais — não permitem avanço adicional (exceto já ARCHIVED). */
export const TERMINAL_CAPTURE_STATUSES: ReadonlySet<CaptureSessionStatus> = new Set(["ARCHIVED"]);

/**
 * Transições automáticas pós-upload (infraestrutura).
 * Para em OCR_PENDING — OCR não é executado nesta sprint.
 */
export const POST_UPLOAD_AUTO_STATUSES: readonly CaptureSessionStatus[] = [
  "UPLOADED",
  "PREPROCESSING",
  "OCR_PENDING",
];

export function captureStatusIndex(status: CaptureSessionStatus): number {
  const idx = STATUS_INDEX.get(status);
  if (idx === undefined) {
    throw new StatusTransitionError(status, status, "capture_session");
  }
  return idx;
}

export function isValidCaptureTransition(
  from: CaptureSessionStatus,
  to: CaptureSessionStatus,
): boolean {
  if (from === to) return true;
  if (TERMINAL_CAPTURE_STATUSES.has(from) && from !== "ARCHIVED") return false;
  if (to === "ARCHIVED") return from !== "ARCHIVED";

  const fromIdx = captureStatusIndex(from);
  const toIdx = captureStatusIndex(to);

  // Avanço linear (+1). ARCHIVED already handled above; cast keeps the check intentional under narrowing.
  return (
    toIdx === fromIdx + 1 ||
    ((to as CaptureSessionStatus | "ARCHIVED") === "ARCHIVED" && fromIdx >= 0)
  );
}

export function assertCaptureTransition(
  from: CaptureSessionStatus,
  to: CaptureSessionStatus,
): void {
  if (!isValidCaptureTransition(from, to)) {
    throw new StatusTransitionError(from, to, "capture_session");
  }
}

export function nextCaptureStatus(current: CaptureSessionStatus): CaptureSessionStatus | null {
  const idx = captureStatusIndex(current);
  if (idx >= CAPTURE_STATUS_ORDER.length - 1) return null;
  return CAPTURE_STATUS_ORDER[idx + 1] ?? null;
}

/** Label PT-BR para timeline UI. */
export const CAPTURE_STATUS_LABELS: Record<CaptureSessionStatus, string> = {
  CREATED: "Criada",
  UPLOADED: "Enviada",
  PREPROCESSING: "Pré-processamento",
  OCR_PENDING: "Aguardando OCR",
  OCR_COMPLETED: "OCR concluído",
  PARSING: "Interpretação",
  AUDITING: "Auditoria",
  REVIEW: "Revisão",
  APPROVED: "Aprovada",
  ARCHIVED: "Arquivada",
};
