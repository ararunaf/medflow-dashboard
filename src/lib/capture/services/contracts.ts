/**
 * Contratos de domínio — Captura Inteligente (somente interfaces).
 * Implementações OCR/parser/audit ficam para sprints futuras.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import type {
  CaptureSessionDetail,
  CaptureSessionRecord,
  CaptureSessionStatus,
  CaptureStoragePaths,
  CreateCaptureSessionInput,
  UploadCaptureFileInput,
} from "../types";

export type CaptureUploadResult = {
  sessionId: string;
  documentId: string;
  storagePaths: CaptureStoragePaths;
  status: CaptureSessionStatus;
};

export type CaptureSignedUrlRequest = {
  sessionId: string;
  folder: "original" | "processed" | "thumbnail" | "audit";
  filename: string;
  mimeType: string;
};

export type CaptureSignedUrlResult = {
  signedUrl: string;
  storagePath: string;
  expiresAt: string;
};

/** Armazenamento PHI no bucket clinical-documents. */
export interface CaptureStorageService {
  buildStoragePaths(tenantId: string, captureId: string): CaptureStoragePaths;

  uploadOriginal(ctx: ServiceCtx, input: UploadCaptureFileInput): Promise<CaptureUploadResult>;

  createSignedUploadUrl(
    ctx: ServiceCtx,
    input: CaptureSignedUrlRequest,
  ): Promise<CaptureSignedUrlResult>;

  verifyObjectExists(ctx: ServiceCtx, storagePath: string): Promise<boolean>;
}

/** Orquestração de sessões e transições de estado. */
export interface CaptureSessionService {
  createSession(ctx: ServiceCtx, input: CreateCaptureSessionInput): Promise<CaptureSessionRecord>;

  getSession(ctx: ServiceCtx, sessionId: string): Promise<CaptureSessionDetail>;

  getSessionStatus(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<{
    sessionId: string;
    status: CaptureSessionStatus;
    statusHistory: CaptureSessionRecord["statusHistory"];
    updatedAt: string;
  }>;

  transitionStatus(
    ctx: ServiceCtx,
    sessionId: string,
    toStatus: CaptureSessionStatus,
    note?: string,
  ): Promise<CaptureSessionRecord>;

  softDeleteSession(ctx: ServiceCtx, sessionId: string): Promise<void>;
}

/** Auditoria preventiva sobre sessão de captura. */
export interface CaptureAuditService {
  runPreventiveAudit(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<{ findingCount: number; sessionId: string }>;

  listFindings(ctx: ServiceCtx, sessionId: string): Promise<unknown[]>;
}

/** Parser inteligente de guias TISS (estruturação pós-OCR). */
export interface CaptureParserService {
  parseSession(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<{ fieldCount: number; sessionId: string }>;

  detectGuideType(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<{ guideType: string | null; confidence: number }>;
}

export type OcrBlock = {
  text: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
};

export type OcrResult = {
  rawText: string;
  blocks: OcrBlock[];
  provider: string;
  modelVersion: string;
};

/** Provedor OCR plugável — Azure / GPT Vision / Tesseract (não implementado). */
export interface CaptureOCRProvider {
  readonly providerId: string;
  readonly modelVersion: string;

  extractText(
    ctx: ServiceCtx,
    input: { sessionId: string; storagePath: string; mimeType: string },
  ): Promise<OcrResult>;

  isAvailable(ctx: ServiceCtx): Promise<boolean>;
}
