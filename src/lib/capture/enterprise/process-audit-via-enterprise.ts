/**
 * EPC-24C / EPC-24E — Capture Audit → Audit Runtime.
 *
 * Fluxo oficial único (cutover EPC-24E):
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → AuditRuntimePort (coordenação estrutural F3-CAP-10)
 *     → runCaptureAudit (implementação interna autorizada do Port)
 *
 * Sem Dual Path. Sem flag de fallback. Sem alteração de regra de negócio.
 * Sem UI/OCR/Parser/XML/banco/APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como implementação interna
 * atrás deste gateway — nunca como pipeline paralelo.
 * Nenhum módulo de produto deve importar `preventive-audit-service` para
 * execução — apenas este módulo (e testes do próprio audit).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureAuditReport,
  runCaptureAudit,
  type RunCaptureAuditResult,
} from "../audit/services/preventive-audit-service";
import type { AuditReport } from "../audit/types/audit-report";
import { CaptureEnterpriseRuntimeUnavailableError } from "./capture-enterprise-runtime-unavailable-error";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureAuditViaEnterpriseResult = RunCaptureAuditResult & {
  viaEnterpriseRuntime: true;
  auditJobId: string | null;
};

export type CaptureAuditViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  auditRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança AuditRuntimePort via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureAuditViaEnterprise(): Promise<CaptureAuditViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const port = runtime.getAuditRuntimePort();
    const health = await port.health();
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      auditRuntimeOk: health.ok,
      providerId: port.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena auditoria via AuditRuntimePort e executa a engine
 * como implementação interna autorizada (mesma saída observável).
 */
export async function runCaptureAuditViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureAuditViaEnterpriseResult> {
  const probe = await probeCaptureAuditViaEnterprise();
  if (!probe || !probe.auditRuntimeOk) {
    throw new CaptureEnterpriseRuntimeUnavailableError("audit", {
      auditRuntimeOk: probe?.auditRuntimeOk ?? false,
    });
  }

  const runtime = resolveCaptureEnterpriseRuntime();
  const audit = runtime.getAuditRuntimePort();

  let auditJobId: string | null = null;

  try {
    const opened = await audit.openJob({
      correlationId: sessionId,
      requestId: `capture-audit-job-${sessionId}`,
      metadata: {
        kind: "canonical-audit-metadata",
        correlationId: sessionId,
        channel: "epc-24e-capture-audit",
        tags: ["epc-24e", "audit", "capture"],
        customAttributes: { sessionId, stage: "audit" },
      },
    });
    auditJobId = opened.job?.jobId ?? opened.result?.job?.jobId ?? null;

    if (auditJobId) {
      await audit.submitRequest({
        jobId: auditJobId,
        requestId: `capture-audit-req-${sessionId}`,
        metadata: {
          kind: "canonical-audit-metadata",
          correlationId: sessionId,
          channel: "epc-24e-capture-audit",
          customAttributes: { sessionId, stage: "audit" },
        },
      });
    }
  } catch {
    /* coordenação estrutural do Port — implementação interna segue no pipeline único */
  }

  try {
    const internal = await runCaptureAudit(ctx, sessionId);
    return {
      ...internal,
      viaEnterpriseRuntime: true,
      auditJobId,
    };
  } finally {
    if (auditJobId) {
      try {
        await audit.closeJob({
          jobId: auditJobId,
          requestId: `capture-audit-close-${sessionId}`,
        });
      } catch {
        /* close estrutural best-effort */
      }
    }
  }
}

/**
 * Leitura do relatório de auditoria — facade Enterprise (sem reexecução).
 */
export async function getCaptureAuditReportViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<AuditReport | null> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureAuditReport(ctx, sessionId);
}
