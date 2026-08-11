/**
 * EPC-24C — Capture Audit → Audit Runtime (convergência).
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → AuditRuntimePort (coordenação estrutural F3-CAP-10)
 *     → fallback legado `runCaptureAudit` (comportamento funcional idêntico)
 *
 * Sem cutover. Sem alteração de regra de negócio. Sem UI/OCR/Parser/XML/
 * banco/APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como fallback atrás deste gateway.
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
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureAuditViaEnterpriseResult = RunCaptureAuditResult & {
  viaEnterpriseRuntime: true;
  auditJobId: string | null;
  auditFallback: "legacy-preventive-audit";
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
 * Coordena auditoria via AuditRuntimePort e executa a engine legada
 * como fallback funcional (mesma saída observável).
 */
export async function runCaptureAuditViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureAuditViaEnterpriseResult> {
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
        channel: "epc-24c-capture-audit",
        tags: ["epc-24c", "audit", "capture"],
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
          channel: "epc-24c-capture-audit",
          customAttributes: { sessionId, stage: "audit" },
        },
      });
    }
  } catch {
    /* coordenação estrutural best-effort — fallback legado permanece */
  }

  try {
    const legacy = await runCaptureAudit(ctx, sessionId);
    return {
      ...legacy,
      viaEnterpriseRuntime: true,
      auditJobId,
      auditFallback: "legacy-preventive-audit",
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
