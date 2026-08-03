/**
 * TissParserService — orquestra captura → parser → persistência.
 * MEDICFLOW-TISS-PARSER-01
 */
import { NotFoundError, ValidationError } from "@/lib/domain/operations/errors";
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendCaptureEvent, buildCaptureEvent } from "../../infrastructure/capture-events";
import {
  getCaptureSession,
  transitionCaptureSession,
} from "../../infrastructure/capture-session-store";
import { ensureCaptureTissKnowledge } from "../../enterprise/tiss-knowledge-gateway";
import { loadOcrResult } from "../../ocr/infrastructure/ocr-storage";
import { getDefaultTissParser } from "../engine/tiss-parser";
import {
  buildStructuredGuideSummaryFromResult,
  loadStructuredGuide,
  persistStructuredGuide,
} from "../infrastructure/parser-storage";
import type { StructuredGuide } from "../types/structured-guide";

export type RunCaptureParserResult = {
  sessionId: string;
  guide: StructuredGuide;
  fieldCount: number;
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

export class TissParserService {
  private readonly parser = getDefaultTissParser();

  async parseSession(ctx: ServiceCtx, sessionId: string): Promise<RunCaptureParserResult> {
    const detail = await getCaptureSession(ctx, sessionId);

    if (detail.status !== "OCR_COMPLETED" && detail.status !== "PARSING") {
      throw new ValidationError("Parser só pode ser executado após OCR concluído.", {
        status: detail.status,
      });
    }

    const ocr = await loadOcrResult(ctx, sessionId);
    if (!ocr) throw new NotFoundError("Resultado OCR", sessionId);

    let metadata = appendCaptureEvent(
      detail.metadata,
      buildCaptureEvent("parser_started", sessionId),
    );
    await persistSessionMetadata(ctx, sessionId, metadata);

    if (detail.status === "OCR_COMPLETED") {
      await transitionCaptureSession(ctx, sessionId, "PARSING", "parser_start");
    }

    try {
      // TISS-CONV-01: aquecimento da cadeia Enterprise (tipos de guia canônicos no Catalog).
      // Patterns OCR permanecem no parser; conhecimento TISS não é bypassado.
      await ensureCaptureTissKnowledge();
      const guide = this.parser.parse(ocr, { sessionId });
      const { storagePath } = await persistStructuredGuide(ctx, sessionId, guide);
      const summary = buildStructuredGuideSummaryFromResult(guide, storagePath);

      metadata = {
        ...metadata,
        capturePhase: "parser_completed",
        parser: summary,
        structuredGuidePreview: {
          guideType: guide.guideType,
          fieldsFound: guide.metadata.fieldsFound,
          fieldsMissing: guide.metadata.fieldsMissing,
        },
      };

      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("parser_finished", sessionId, {
          guideType: guide.guideType,
          guideTypeConfidence: guide.classification.confidence,
          fieldsFound: guide.metadata.fieldsFound,
          fieldsMissing: guide.metadata.fieldsMissing,
          fieldsPartial: guide.metadata.fieldsPartial,
          overallConfidence: guide.metadata.overallConfidence,
          parserDurationMs: guide.metadata.parserDurationMs,
          storagePath,
        }),
      );

      await persistSessionMetadata(ctx, sessionId, metadata);

      return {
        sessionId,
        guide,
        fieldCount: Object.keys(guide.fields).length,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        {
          ...metadata,
          capturePhase: "failed",
          parser: { status: "failed", error: reason },
        },
        buildCaptureEvent("parser_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }

  async detectGuideType(ctx: ServiceCtx, sessionId: string) {
    const ocr = await loadOcrResult(ctx, sessionId);
    if (!ocr) return { guideType: null, confidence: 0 };
    const detection = this.parser.detectGuideType(ocr);
    return { guideType: detection.guideType, confidence: detection.confidence };
  }

  async getStructuredGuide(ctx: ServiceCtx, sessionId: string): Promise<StructuredGuide | null> {
    return loadStructuredGuide(ctx, sessionId);
  }
}

let defaultService: TissParserService | null = null;

export function getDefaultTissParserService(): TissParserService {
  if (!defaultService) defaultService = new TissParserService();
  return defaultService;
}

export async function runCaptureParser(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureParserResult> {
  return getDefaultTissParserService().parseSession(ctx, sessionId);
}

export async function getCaptureStructuredGuide(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<StructuredGuide | null> {
  return getDefaultTissParserService().getStructuredGuide(ctx, sessionId);
}
