/**
 * F2-S4 — Field Audit Agent (ARCH-02: AIProviderPort, sem chamada direta ao vendor).
 *
 * Estágio novo do pipeline (não migração de motor legado) — sem ceremônia
 * de Enterprise Runtime Port adicional propositalmente: o roadmap decide
 * consolidar para fora desse padrão, não adicionar mais fachada decorativa
 * a um estágio que já nasce real.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureFieldAuditReport,
  runCaptureFieldAudit,
  type RunFieldAuditResult,
} from "../audit/services/field-audit-service";
import type { FieldAuditReport } from "../audit/types/field-audit-report";

export async function runCaptureFieldAuditViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunFieldAuditResult> {
  return runCaptureFieldAudit(ctx, sessionId);
}

export async function getCaptureFieldAuditReportViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<FieldAuditReport | null> {
  return getCaptureFieldAuditReport(ctx, sessionId);
}
