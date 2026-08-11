/**
 * Bridge Captura → Enterprise Runtime (ARCH-01 / EPC-24A / EPC-24B / DIP-02…DIP-06).
 *
 * EPC-24B: Intake deixa de ser fire-and-forget opaco — é awaited no Happy Path
 * sob o composition root, com resultado observável (ainda best-effort).
 *
 * Fluxo: Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *   → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime → …
 *
 * NÃO altera OCR/classificação/storage/busca reais do produto, parser, auditoria,
 * UI, APIs ou regras. Falhas são engolidas — o fluxo de Captura permanece válido.
 *
 * Dual-path AER-GA03-A1: reduzido (intake canônico via Runtime no caminho bound),
 * ainda não eliminado (pipeline operacional legado permanece até EPC-24E).
 */
import type { RegisterCaptureDocumentIntakeResult } from "@/lib/enterprise/runtime";
import type { CaptureDocumentRecord, CaptureSessionRecord } from "../types";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type CaptureEnterpriseBridgeInput = {
  session: CaptureSessionRecord;
  document: CaptureDocumentRecord;
  tenantId: string;
};

export type CaptureIntakeViaEnterpriseResult = RegisterCaptureDocumentIntakeResult & {
  viaEnterpriseRuntime: true;
  entry: "getEnterpriseRuntime";
};

export type CaptureIntakeViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  documentIntakeRuntimeOk: boolean;
  documentIntakePortOk: boolean;
};

/**
 * Probe estrutural: Capture alcança Document Intake Runtime via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureIntakeViaEnterprise(): Promise<CaptureIntakeViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const [intakeRuntimeHealth, intakePortHealth] = await Promise.all([
      runtime.getDocumentIntakeRuntimePort().health(),
      runtime.getDocumentIntakePort().health(),
    ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      documentIntakeRuntimeOk: intakeRuntimeHealth.ok,
      documentIntakePortOk: intakePortHealth.ok,
    };
  } catch {
    return null;
  }
}

/**
 * Registra o documento de Captura na Foundation via Ports oficiais.
 * Awaited (EPC-24B) — nunca lança; retorna null em falha.
 */
export async function registerCaptureDocumentIntakeBridge(
  input: CaptureEnterpriseBridgeInput,
): Promise<CaptureIntakeViaEnterpriseResult | null> {
  try {
    // Composition root oficial — Intake entra exclusivamente pelo Runtime.
    void probeCaptureIntakeViaEnterprise();

    const result = await resolveCaptureEnterpriseRuntime().registerCaptureDocumentIntake({
      sessionId: input.session.id,
      documentId: input.document.id,
      storagePath: input.document.storagePathOriginal,
      tenantRef: input.tenantId,
      correlationId: input.session.correlationId,
      channel: input.session.channel,
    });

    return {
      ...result,
      viaEnterpriseRuntime: true,
      entry: "getEnterpriseRuntime",
    };
  } catch {
    return null;
  }
}
