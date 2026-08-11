/**
 * Bridge Captura → Enterprise Runtime (ARCH-01 / EPC-24A…E / DIP-02…DIP-06).
 *
 * Cutover EPC-24E: Intake é parte do pipeline oficial único sob
 * getEnterpriseRuntime() — não é side-effect paralelo (AER-GA03-A1 Resolvida).
 *
 * Fluxo: Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *   → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime → …
 *
 * NÃO altera OCR/classificação/storage/busca reais do produto, parser, auditoria,
 * UI, APIs ou regras. Falhas de intake estrutural são engolidas — o fluxo de
 * Captura permanece válido (upload não depende do intake canônico).
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
 * Awaited — nunca lança; retorna null em falha.
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
