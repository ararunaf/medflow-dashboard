/**
 * Bridge Captura → Enterprise Runtime (ARCH-01).
 *
 * Side-effect estrutural após upload bem-sucedido.
 * NÃO altera OCR, parser, auditoria, UI, APIs ou regras de negócio.
 * Falhas são engolidas — o fluxo de Captura permanece válido.
 */
import {
  getEnterpriseRuntime,
  type RegisterCaptureDocumentIntakeResult,
} from "@/lib/enterprise/runtime";
import type { CaptureDocumentRecord, CaptureSessionRecord } from "../types";

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
    return await getEnterpriseRuntime().registerCaptureDocumentIntake({
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
