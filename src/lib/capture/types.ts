/**
 * Tipos da infraestrutura de Captura Inteligente (MEDICFLOW-INTELLIGENT-CAPTURE-02).
 * Sem OCR — apenas contratos de domínio e state machine.
 */

import type { JsonObject } from "@/lib/database.types";

export const CAPTURE_SESSION_STATUSES = [
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

export type CaptureSessionStatus = (typeof CAPTURE_SESSION_STATUSES)[number];

export const CAPTURE_CHANNELS = [
  "mobile_camera",
  "file_upload",
  "scanner_folder",
  "api_ingest",
] as const;

export type CaptureChannel = (typeof CAPTURE_CHANNELS)[number];

export const CLINICAL_DOCUMENTS_BUCKET = "clinical-documents" as const;

export const CAPTURE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const;

export type CaptureAllowedMimeType = (typeof CAPTURE_ALLOWED_MIME_TYPES)[number];

export const CAPTURE_MAX_BYTES = 25 * 1024 * 1024;

export type CaptureStatusHistoryEntry = {
  from: CaptureSessionStatus | null;
  to: CaptureSessionStatus;
  at: string;
  actorProfileId: string;
  note?: string;
};

export type CaptureSessionRecord = {
  id: string;
  tenantId: string;
  status: CaptureSessionStatus;
  channel: CaptureChannel;
  correlationId: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  metadata: JsonObject;
  statusHistory: CaptureStatusHistoryEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CaptureDocumentRecord = {
  id: string;
  sessionId: string;
  tenantId: string;
  originalFilename: string;
  mimeType: string;
  byteLength: number;
  checksumSha256: string;
  storagePathOriginal: string;
  storagePathProcessed: string | null;
  storagePathThumbnail: string | null;
  storagePathAudit: string | null;
  pageCount: number;
  metadata: JsonObject;
  createdAt: string;
};

export type CaptureSessionDetail = CaptureSessionRecord & {
  documents: CaptureDocumentRecord[];
};

export type CreateCaptureSessionInput = {
  channel?: CaptureChannel;
  correlationId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  metadata?: JsonObject;
};

export type UploadCaptureFileInput = {
  sessionId: string;
  file: {
    name: string;
    mimeType: string;
    byteLength: number;
    checksumSha256: string;
    base64Content: string;
  };
};

export type CaptureStoragePaths = {
  original: string;
  processed: string;
  thumbnail: string;
  audit: string;
};
