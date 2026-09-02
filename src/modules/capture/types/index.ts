/**
 * Tipos de domínio — módulo Captura Inteligente (MEDICFLOW-CAPTURE-PIPELINE-01).
 */

import type { JsonObject } from "@/lib/database.types";

/** Fases do pipeline de captura (UI + domínio). */
export const CAPTURE_PHASES = [
  "idle",
  "uploading",
  "uploaded",
  "preprocessing",
  "waiting_ocr",
  "ocr_completed",
  "parser_completed",
  "auditing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type CapturePhase = (typeof CAPTURE_PHASES)[number];

export type CaptureTransitionRecord = {
  from: CapturePhase;
  to: CapturePhase;
  at: string;
  note?: string;
};

export type CaptureFileInfo = {
  name: string;
  mimeType: string;
  byteLength: number;
  checksumSha256?: string;
  version: number;
};

export type CaptureSessionView = {
  sessionId: string | null;
  phase: CapturePhase;
  channel: string | null;
  file: CaptureFileInfo | null;
  previewUrl: string | null;
  transitions: CaptureTransitionRecord[];
  statusHistory: Array<{
    from: string | null;
    to: string;
    at: string;
    note?: string;
  }>;
  events: CapturePipelineEvent[];
  error: string | null;
};

export const CAPTURE_PIPELINE_EVENT_TYPES = [
  "capture_created",
  "capture_uploaded",
  "capture_preprocessed",
  "capture_ready_for_ocr",
  "capture_failed",
  "ocr_started",
  "ocr_finished",
  "ocr_failed",
  "provider_used",
  "processing_time",
  "average_confidence",
  "parser_started",
  "parser_finished",
  "parser_failed",
  "audit_started",
  "audit_finished",
  "audit_failed",
  "proposal_generated",
  "proposal_accepted",
  "proposal_edited",
  "proposal_rejected",
  "proposal_applied",
  "learning_recorded",
  "contract_intelligence_started",
  "contract_intelligence_finished",
  "contract_intelligence_failed",
  "risk_assessment_started",
  "risk_assessment_finished",
  "risk_assessment_failed",
  "field_audit_started",
  "field_audit_finished",
  "field_audit_failed",
  "semantic_fallback_started",
  "semantic_fallback_finished",
  "semantic_fallback_failed",
] as const;

export type CapturePipelineEventType = (typeof CAPTURE_PIPELINE_EVENT_TYPES)[number];

export type CapturePipelineEvent = {
  type: CapturePipelineEventType;
  sessionId: string;
  at: string;
  payload?: JsonObject;
};

export type {
  OcrProvider,
  OcrCapabilities,
  OcrHealth,
  OcrExtractInput,
  OcrExtractResult,
} from "./ocr-provider";
