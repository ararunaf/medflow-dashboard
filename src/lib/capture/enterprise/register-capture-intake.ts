/**
 * Bridge Captura → Enterprise Runtime (ARCH-01 / EPC-24A…E / DIP-02…DIP-06 / TISS-RUNTIME-01A).
 *
 * Cutover EPC-24E: Intake é parte do pipeline oficial único sob
 * getEnterpriseRuntime() — não é side-effect paralelo (AER-GA03-A1 Resolvida).
 *
 * Fluxo: Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *   → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime → …
 *   → registerTissReceivedJob → QueueRuntimePort.enqueue → Job TISS RECEIVED
 *
 * TISS-RUNTIME-01A: após Intake bem-sucedido, registra Job TISS com status RECEIVED.
 * NÃO altera OCR/classificação/storage/busca reais do produto, parser, auditoria,
 * UI, APIs ou regras. Falhas de intake estrutural / enqueue TISS são engolidas —
 * o fluxo de Captura permanece válido (upload não depende do intake canônico).
 */
import { registerTissReceivedJob } from "@/lib/enterprise/runtime";
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
  /** TISS-RUNTIME-01A — Job TISS RECEIVED (quando enqueue ok). */
  tissJobId?: string;
  tissJobStatus?: "RECEIVED";
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
 * Em seguida (TISS-RUNTIME-01A) enfileira Job TISS RECEIVED via QueueRuntimePort.
 * Awaited — nunca lança; retorna null em falha de intake.
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

    let tissJobId: string | undefined;
    let tissJobStatus: "RECEIVED" | undefined;

    // TISS-RUNTIME-01A — Documento → Queue → Job RECEIVED (sem OCR/Parser/XML).
    if (result.ok) {
      try {
        const tissJob = await registerTissReceivedJob({
          source: "document-intake",
          correlationId: input.session.correlationId,
          sessionId: input.session.id,
          documentId: input.document.id,
          payloadRef: input.document.storagePathOriginal,
          channel: input.session.channel ?? "capture-upload",
        });
        if (tissJob.ok && tissJob.job) {
          tissJobId = tissJob.job.jobId;
          tissJobStatus = tissJob.job.status;
        }
      } catch {
        /* enqueue TISS best-effort — Captura permanece válida */
      }
    }

    return {
      ...result,
      viaEnterpriseRuntime: true,
      entry: "getEnterpriseRuntime",
      tissJobId,
      tissJobStatus,
    };
  } catch {
    return null;
  }
}
