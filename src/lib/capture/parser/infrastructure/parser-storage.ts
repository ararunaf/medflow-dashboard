/**
 * Persistência de StructuredGuide no bucket clinical-documents.
 * MEDICFLOW-TISS-PARSER-01
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageSignedUrl,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import type { StructuredGuide, StructuredGuideSummary } from "../types/structured-guide";

export const STRUCTURED_GUIDE_FILENAME = "structured_guide.json";

export function buildStructuredGuideStoragePath(tenantId: string, sessionId: string): string {
  return `${tenantId}/${sessionId}/audit/${STRUCTURED_GUIDE_FILENAME}`;
}

export async function persistStructuredGuide(
  ctx: ServiceCtx,
  sessionId: string,
  guide: StructuredGuide,
): Promise<{ storagePath: string }> {
  const storagePath = buildStructuredGuideStoragePath(ctx.tenantId, sessionId);
  const payload = JSON.stringify(guide, null, 2);

  await captureStorageUpload(ctx, {
    key: storagePath,
    body: new TextEncoder().encode(payload),
    contentType: "application/json",
    upsert: true,
    sessionId,
  });
  return { storagePath };
}

export async function loadStructuredGuide(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<StructuredGuide | null> {
  const storagePath = buildStructuredGuideStoragePath(ctx.tenantId, sessionId);
  const body = await captureStorageDownload(ctx, { key: storagePath, sessionId });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as StructuredGuide;
}

export async function getStructuredGuideSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildStructuredGuideStoragePath(ctx.tenantId, sessionId);
  const { signedUrl, expiresAt } = await captureStorageSignedUrl(ctx, {
    key: storagePath,
    expiresInSeconds: ttlSeconds,
    downloadFilename: STRUCTURED_GUIDE_FILENAME,
    sessionId,
  });

  return {
    signedUrl,
    expiresAt,
    filename: STRUCTURED_GUIDE_FILENAME,
  };
}

export function buildStructuredGuideSummaryFromResult(
  guide: StructuredGuide,
  storagePath: string,
): StructuredGuideSummary {
  return {
    status: "completed",
    guideType: guide.guideType,
    guideTypeConfidence: guide.classification.confidence,
    overallConfidence: guide.metadata.overallConfidence,
    fieldsFound: guide.metadata.fieldsFound,
    fieldsMissing: guide.metadata.fieldsMissing,
    fieldsPartial: guide.metadata.fieldsPartial,
    storagePath,
    parserDurationMs: guide.metadata.parserDurationMs,
  };
}

export function buildStructuredGuideSummaryFromMetadata(
  metadata: Record<string, unknown>,
): StructuredGuideSummary | null {
  const parser = metadata.parser as StructuredGuideSummary | undefined;
  if (!parser || typeof parser !== "object") return null;
  return parser;
}
