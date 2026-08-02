/**
 * Persistência de resultados OCR via StorageProviderPort (STORAGE-01).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageSignedUrl,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import type { OcrResultSummary, RawOcrResult } from "../types/raw-ocr-result";

export const OCR_RESULT_FILENAME = "ocr_result.json";

export function buildOcrResultStoragePath(tenantId: string, sessionId: string): string {
  return `${tenantId}/${sessionId}/audit/${OCR_RESULT_FILENAME}`;
}

export async function persistOcrResult(
  ctx: ServiceCtx,
  sessionId: string,
  result: RawOcrResult,
): Promise<{ storagePath: string }> {
  const storagePath = buildOcrResultStoragePath(ctx.tenantId, sessionId);
  const payload = JSON.stringify(result, null, 2);

  await captureStorageUpload(ctx, {
    key: storagePath,
    body: new TextEncoder().encode(payload),
    contentType: "application/json",
    upsert: true,
    sessionId,
  });

  return { storagePath };
}

export async function loadOcrResult(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RawOcrResult | null> {
  const storagePath = buildOcrResultStoragePath(ctx.tenantId, sessionId);
  const body = await captureStorageDownload(ctx, { key: storagePath, sessionId });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as RawOcrResult;
}

export async function getOcrResultSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildOcrResultStoragePath(ctx.tenantId, sessionId);
  const signed = await captureStorageSignedUrl(ctx, {
    key: storagePath,
    expiresInSeconds: ttlSeconds,
    downloadFilename: OCR_RESULT_FILENAME,
    sessionId,
  });

  return {
    signedUrl: signed.signedUrl,
    expiresAt: signed.expiresAt,
    filename: OCR_RESULT_FILENAME,
  };
}

export function buildOcrSummaryFromResult(
  result: RawOcrResult,
  storagePath: string,
): OcrResultSummary {
  return {
    status: "completed",
    provider: result.provider,
    processingTimeMs: result.processingTimeMs,
    averageConfidence: result.averageConfidence,
    pageCount: result.pageCount,
    wordCount: result.wordCount,
    storagePath,
  };
}

export function buildOcrSummaryFromMetadata(
  metadata: Record<string, unknown>,
): OcrResultSummary | null {
  const ocr = metadata.ocr as OcrResultSummary | undefined;
  if (!ocr || typeof ocr !== "object") return null;
  return ocr;
}
