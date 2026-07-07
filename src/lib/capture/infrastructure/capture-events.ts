/**
 * Emissão de eventos do pipeline de captura (persistidos em metadata.captureEvents).
 */
import type {
  CapturePipelineEvent,
  CapturePipelineEventType,
} from "@/modules/capture/types";

export function buildCaptureEvent(
  type: CapturePipelineEventType,
  sessionId: string,
  payload?: Record<string, unknown>,
): CapturePipelineEvent {
  return {
    type,
    sessionId,
    at: new Date().toISOString(),
    payload,
  };
}

export function appendCaptureEvent(
  metadata: Record<string, unknown>,
  event: CapturePipelineEvent,
): Record<string, unknown> {
  const existing = Array.isArray(metadata.captureEvents)
    ? (metadata.captureEvents as CapturePipelineEvent[])
    : [];
  return {
    ...metadata,
    captureEvents: [...existing, event],
  };
}

export function eventForDbStatusTransition(
  toStatus: string,
  sessionId: string,
): CapturePipelineEvent | null {
  switch (toStatus) {
    case "CREATED":
      return buildCaptureEvent("capture_created", sessionId);
    case "UPLOADED":
      return buildCaptureEvent("capture_uploaded", sessionId);
    case "PREPROCESSING":
      return buildCaptureEvent("capture_preprocessed", sessionId);
    case "OCR_PENDING":
      return buildCaptureEvent("capture_ready_for_ocr", sessionId);
    case "OCR_COMPLETED":
      return buildCaptureEvent("ocr_finished", sessionId, { source: "status_transition" });
    default:
      return null;
  }
}

export function buildFailedEvent(
  sessionId: string,
  reason: string,
  phase?: string,
): CapturePipelineEvent {
  return buildCaptureEvent("capture_failed", sessionId, { reason, phase });
}
