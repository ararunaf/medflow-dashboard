/**
 * Persistência de resultados OCR no bucket clinical-documents.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { CLINICAL_DOCUMENTS_BUCKET } from "../../infrastructure/storage-paths";
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

  const { error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .upload(storagePath, new TextEncoder().encode(payload), {
      contentType: "application/json",
      upsert: true,
    });

  if (error) throw error;
  return { storagePath };
}

export async function loadOcrResult(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RawOcrResult | null> {
  const storagePath = buildOcrResultStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) return null;

  const text = await data.text();
  return JSON.parse(text) as RawOcrResult;
}

export async function getOcrResultSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildOcrResultStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, ttlSeconds, { download: OCR_RESULT_FILENAME });

  if (error || !data?.signedUrl) throw error ?? new Error("OCR result não encontrado.");

  return {
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
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
