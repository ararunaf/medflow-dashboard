/**
 * F2-S5 — OCR Semantic Fallback (ARCH-02: AIProviderPort, capability "vision").
 *
 * Mesma decisão de process-field-audit-via-enterprise.ts: estágio novo,
 * sem ceremônia adicional de Enterprise Runtime Port.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  runCaptureSemanticFallback,
  type RunSemanticFallbackResult,
} from "../ocr/services/semantic-fallback-service";

export async function runCaptureSemanticFallbackViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunSemanticFallbackResult> {
  return runCaptureSemanticFallback(ctx, sessionId);
}
