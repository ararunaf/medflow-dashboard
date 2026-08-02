/**
 * OcrService — orquestra captura → OCR → persistência.
 * Nunca referencia Azure diretamente — sempre via OcrOrchestrator,
 * que por sua vez utiliza exclusivamente a Enterprise Foundation (OCR-01):
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter
 * MEDICFLOW-OCR-IMPLEMENTATION-01 / OCR-01
 */
import { NotFoundError, ValidationError } from "@/lib/domain/operations/errors";
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendCaptureEvent, buildCaptureEvent } from "../../infrastructure/capture-events";
import {
  getCaptureSession,
  transitionCaptureSession,
} from "../../infrastructure/capture-session-store";
import { CLINICAL_DOCUMENTS_BUCKET } from "../../infrastructure/storage-paths";
import {
  buildOcrSummaryFromResult,
  loadOcrResult,
  persistOcrResult,
} from "../infrastructure/ocr-storage";
import { createDefaultOcrOrchestrator, OcrOrchestrator } from "../orchestrator/ocr-orchestrator";
import type { OcrResultSummary, RawOcrResult } from "../types/raw-ocr-result";

export type RunCaptureOcrResult = {
  sessionId: string;
  ocr: RawOcrResult;
  summary: OcrResultSummary;
};

async function persistSessionMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({ metadata: metadata as Json, updated_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) throw error;
}

async function emitOcrEvent(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
  eventType:
    | "ocr_started"
    | "ocr_finished"
    | "ocr_failed"
    | "provider_used"
    | "processing_time"
    | "average_confidence",
  payload?: JsonObject,
): Promise<JsonObject> {
  const event = buildCaptureEvent(eventType, sessionId, payload);
  const updated = appendCaptureEvent(metadata, event);
  await persistSessionMetadata(ctx, sessionId, updated);
  return updated;
}

async function downloadDocumentBytes(ctx: ServiceCtx, storagePath: string): Promise<Uint8Array> {
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) throw new NotFoundError("Arquivo de captura", storagePath);

  const buffer = await data.arrayBuffer();
  return new Uint8Array(buffer);
}

export class OcrService {
  constructor(private readonly orchestrator: OcrOrchestrator = createDefaultOcrOrchestrator()) {}

  /** Executa OCR para sessão em OCR_PENDING. */
  async runCaptureOcr(ctx: ServiceCtx, sessionId: string): Promise<RunCaptureOcrResult> {
    const detail = await getCaptureSession(ctx, sessionId);

    if (detail.status !== "OCR_PENDING") {
      throw new ValidationError("OCR só pode ser executado em sessões OCR_PENDING.", {
        status: detail.status,
      });
    }

    const doc = detail.documents[detail.documents.length - 1];
    if (!doc) throw new NotFoundError("Documento de captura", sessionId);

    let metadata = await emitOcrEvent(ctx, sessionId, detail.metadata, "ocr_started", {
      storagePath: doc.storagePathOriginal,
      mimeType: doc.mimeType,
    });

    try {
      const fileBytes = await downloadDocumentBytes(ctx, doc.storagePathOriginal);

      const orchestrated = await this.orchestrator.execute({
        sessionId,
        tenantId: ctx.tenantId,
        storagePath: doc.storagePathOriginal,
        mimeType: doc.mimeType,
        fileBytes,
      });

      const { storagePath } = await persistOcrResult(ctx, sessionId, orchestrated.result);
      const summary = buildOcrSummaryFromResult(orchestrated.result, storagePath);

      metadata = {
        ...metadata,
        capturePhase: "ocr_completed",
        ocr: summary,
        ocrFullTextPreview: orchestrated.result.fullText.slice(0, 2000),
      };

      await emitOcrEvent(ctx, sessionId, metadata, "provider_used", {
        provider: orchestrated.providerId,
        providerVersion: orchestrated.result.providerVersion,
      });

      metadata = await emitOcrEvent(ctx, sessionId, metadata, "processing_time", {
        processingTimeMs: orchestrated.processingTimeMs,
      });

      metadata = await emitOcrEvent(ctx, sessionId, metadata, "average_confidence", {
        averageConfidence: orchestrated.result.averageConfidence,
      });

      metadata = await emitOcrEvent(ctx, sessionId, metadata, "ocr_finished", {
        provider: orchestrated.providerId,
        processingTimeMs: orchestrated.processingTimeMs,
        averageConfidence: orchestrated.result.averageConfidence,
        pageCount: orchestrated.result.pageCount,
        wordCount: orchestrated.result.wordCount,
        storagePath,
      });

      await transitionCaptureSession(ctx, sessionId, "OCR_COMPLETED", "ocr_complete");

      await ctx.client
        .from("capture_documents")
        .update({
          page_count: orchestrated.result.pageCount || doc.pageCount,
          metadata: {
            ...doc.metadata,
            ocrProvider: orchestrated.providerId,
            ocrProcessingTimeMs: orchestrated.processingTimeMs,
            ocrAverageConfidence: orchestrated.result.averageConfidence,
            ocrResultPath: storagePath,
          },
          updated_by: ctx.actorProfileId,
        })
        .eq("tenant_id", ctx.tenantId)
        .eq("id", doc.id);

      return { sessionId, ocr: orchestrated.result, summary };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        { ...metadata, capturePhase: "failed", ocr: { status: "failed", error: reason } },
        buildCaptureEvent("ocr_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }

  async getOcrResult(ctx: ServiceCtx, sessionId: string): Promise<RawOcrResult | null> {
    return loadOcrResult(ctx, sessionId);
  }
}

let defaultService: OcrService | null = null;

export function getDefaultOcrService(): OcrService {
  if (!defaultService) defaultService = new OcrService();
  return defaultService;
}

export async function runCaptureOcr(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureOcrResult> {
  return getDefaultOcrService().runCaptureOcr(ctx, sessionId);
}

export async function getCaptureOcrResult(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RawOcrResult | null> {
  return getDefaultOcrService().getOcrResult(ctx, sessionId);
}
