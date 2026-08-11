/**
 * Bridge Captura → Enterprise Runtime (ARCH-01 / EPC-24A / DIP-02…DIP-06).
 *
 * Side-effect estrutural após upload bem-sucedido (dual-path AER-GA03-A1).
 * Fluxo: Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *   → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime → …
 * NÃO altera OCR/classificação/storage/busca reais do produto, parser, auditoria, UI, APIs ou regras.
 * Falhas são engolidas — o fluxo de Captura permanece válido.
 */
import type { RegisterCaptureDocumentIntakeResult } from "@/lib/enterprise/runtime";
import type { CaptureDocumentRecord, CaptureSessionRecord } from "../types";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type CaptureEnterpriseBridgeInput = {
  session: CaptureSessionRecord;
  document: CaptureDocumentRecord;
  tenantId: string;
};

/**
 * Registra o documento de Captura na Foundation via Ports oficiais.
 * Best-effort: nunca lança.
 */
export async function registerCaptureDocumentIntakeBridge(
  input: CaptureEnterpriseBridgeInput,
): Promise<RegisterCaptureDocumentIntakeResult | null> {
  try {
    return await resolveCaptureEnterpriseRuntime().registerCaptureDocumentIntake({
      sessionId: input.session.id,
      documentId: input.document.id,
      storagePath: input.document.storagePathOriginal,
      tenantRef: input.tenantId,
      correlationId: input.session.correlationId,
      channel: input.session.channel,
    });
  } catch {
    return null;
  }
}
