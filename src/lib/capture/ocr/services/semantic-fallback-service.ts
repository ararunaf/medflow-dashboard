/**
 * SemanticFallbackService — orquestra o OCR Semantic Fallback (F2-S5).
 *
 * Roda logo após o Parser: para cada campo abaixo de 0.70 de confiança,
 * recorta a região na imagem original e pergunta ao GPT-4o Vision (via
 * AIProviderPort — ARCH-02). Se algum campo melhorar, re-persiste o
 * StructuredGuide (Audit/Contract/Risk a seguir já enxergam o valor
 * melhorado). O log de decisões (DoD: "decisão fica registrada em log")
 * vai para metadata.semanticFallback + eventos do pipeline — mesmo padrão
 * de todo estágio anterior do Capture.
 */
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { createAIProviderFactory } from "@/lib/enterprise/ai-provider/factory/ai-provider-factory";
import { appendCaptureEvent, buildCaptureEvent } from "../../infrastructure/capture-events";
import { getCaptureSession } from "../../infrastructure/capture-session-store";
import { captureStorageDownload } from "../../infrastructure/enterprise-storage-bridge";
import { loadStructuredGuide, persistStructuredGuide } from "../../parser/infrastructure/parser-storage";
import { applySemanticFallback, type SemanticFallbackDecision } from "../fallback/semantic-fallback";
import { NotFoundError } from "@/lib/domain/operations/errors";

export type RunSemanticFallbackResult = {
  sessionId: string;
  decisions: SemanticFallbackDecision[];
  appliedCount: number;
};

/**
 * SEC-PII-01: remove `newValue` (pode ser PII lida por IA externa, ex.
 * CPF/nome do grupo "paciente") de cada decisão antes de persistir em
 * capture_sessions.metadata — jsonb legível por qualquer membro do tenant
 * com acesso a capture (ver policy de least privilege). Extraída como
 * função pura para ser testável sem precisar de ServiceCtx/Supabase.
 */
export function redactSemanticFallbackDecisionsForMetadata(
  decisions: SemanticFallbackDecision[],
): Omit<SemanticFallbackDecision, "newValue">[] {
  return decisions.map(({ newValue: _newValue, ...rest }) => rest);
}

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

export class SemanticFallbackService {
  async runForSession(ctx: ServiceCtx, sessionId: string): Promise<RunSemanticFallbackResult> {
    const detail = await getCaptureSession(ctx, sessionId);
    let metadata = detail.metadata ?? {};

    const guide = await loadStructuredGuide(ctx, sessionId);
    if (!guide) throw new NotFoundError("StructuredGuide", sessionId);

    const doc = detail.documents[detail.documents.length - 1];
    if (!doc) throw new NotFoundError("CaptureDocument", sessionId);

    metadata = appendCaptureEvent(metadata, buildCaptureEvent("semantic_fallback_started", sessionId));
    await persistSessionMetadata(ctx, sessionId, metadata);

    try {
      const imageBytes = await captureStorageDownload(ctx, {
        key: doc.storagePathOriginal,
        sessionId,
      });
      if (!imageBytes) throw new NotFoundError("Documento original", doc.storagePathOriginal);

      const aiProvider = createAIProviderFactory().create({ provider: "openai" });
      const { guide: updatedGuide, decisions } = await applySemanticFallback(
        aiProvider,
        guide,
        imageBytes,
        doc.mimeType,
      );

      const appliedCount = decisions.filter((d) => d.applied).length;
      if (appliedCount > 0) {
        await persistStructuredGuide(ctx, sessionId, updatedGuide);
      }

      // SEC-PII-01: newValue pode ser o valor que a IA externa leu de um
      // campo do grupo "paciente" (nome, CPF...). capture_sessions.metadata
      // é jsonb legível por qualquer membro do tenant com acesso a capture
      // (ver policy de least privilege) — não persistimos o valor ali. O
      // resultado retornado por esta função (decisions, sem redação)
      // continua completo para quem chama diretamente.
      metadata = {
        ...metadata,
        semanticFallback: {
          status: "completed",
          decisions: redactSemanticFallbackDecisionsForMetadata(decisions),
          triggeredCount: decisions.filter((d) => d.triggered).length,
          appliedCount,
        },
      };
      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("semantic_fallback_finished", sessionId, {
          candidateCount: decisions.length,
          triggeredCount: decisions.filter((d) => d.triggered).length,
          appliedCount,
        }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);

      return { sessionId, decisions, appliedCount };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        { ...metadata, semanticFallback: { status: "failed", error: reason } },
        buildCaptureEvent("semantic_fallback_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }
}

let defaultService: SemanticFallbackService | null = null;

export function getDefaultSemanticFallbackService(): SemanticFallbackService {
  if (!defaultService) defaultService = new SemanticFallbackService();
  return defaultService;
}

export async function runCaptureSemanticFallback(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunSemanticFallbackResult> {
  return getDefaultSemanticFallbackService().runForSession(ctx, sessionId);
}
