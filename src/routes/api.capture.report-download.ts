/**
 * SEC-PII-02 — proxy autenticado de download dos artefatos JSON do
 * pipeline de captura (OCR/guia estruturada/auditoria/contrato/risco/
 * correção). Substitui a signed URL direta do Storage: esses artefatos
 * agora são criptografados em repouso (ver `storage-encryption.ts`), e
 * uma signed URL devolveria o blob cifrado direto ao navegador.
 *
 * Autenticação: mesma sessão de usuário das server functions
 * (`requireOperationalAuth`, cookie SSR) — não é um endpoint de sistema
 * como `/api/capture/process-batch`. RLS de `capture_sessions` (self-or-
 * manager, ver migração SEC-PII-01) gate o acesso: `getCaptureSession`
 * lança NotFoundError se o usuário não pode ver a sessão.
 */
import { createFileRoute } from "@tanstack/react-router";
import { requireOperationalAuth } from "@/lib/server/operational-auth";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { NotFoundError, UnauthenticatedError, isDomainError } from "@/lib/domain/operations/errors";
import { getCaptureSession } from "@/lib/capture/infrastructure/capture-session-store";
import { loadOcrResult } from "@/lib/capture/ocr/infrastructure/ocr-storage";
import { loadStructuredGuide } from "@/lib/capture/parser/infrastructure/parser-storage";
import { loadAuditReport } from "@/lib/capture/audit/infrastructure/audit-storage";
import { loadContractIntelligenceReport } from "@/lib/capture/contract/infrastructure/contract-intelligence-storage";
import { loadRiskAssessmentReport } from "@/lib/capture/risk/infrastructure/risk-storage";
import { loadCorrectionProposals } from "@/lib/capture/correction/infrastructure/correction-storage";
import type { CaptureReportType } from "@/lib/capture/infrastructure/report-download-url";

const LOADERS: Record<
  CaptureReportType,
  { filename: string; load: (ctx: ServiceCtx, sessionId: string) => Promise<unknown | null> }
> = {
  ocr: { filename: "ocr_result.json", load: loadOcrResult },
  "structured-guide": { filename: "structured_guide.json", load: loadStructuredGuide },
  audit: { filename: "audit_report.json", load: loadAuditReport },
  contract: { filename: "contract_intelligence_report.json", load: loadContractIntelligenceReport },
  risk: { filename: "risk_assessment.json", load: loadRiskAssessmentReport },
  correction: { filename: "correction_proposals.json", load: loadCorrectionProposals },
};

async function handleReportDownload({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const report = url.searchParams.get("report") as CaptureReportType | null;

  if (!sessionId || !report || !(report in LOADERS)) {
    return Response.json({ ok: false, error: "sessionId/report inválidos." }, { status: 400 });
  }

  let ctx: ServiceCtx;
  try {
    const auth = await requireOperationalAuth();
    ctx = {
      client: auth.client,
      tenantId: auth.tenantId,
      role: auth.profile.role,
      userId: auth.userId,
      actorProfileId: auth.profile.id,
      professionalId: auth.professionalId,
    };
  } catch (err) {
    if (
      err instanceof UnauthenticatedError ||
      (isDomainError(err) && err.code === "unauthenticated")
    ) {
      return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
    throw err;
  }

  try {
    // Reaproveita a checagem de acesso (self-or-manager) já usada pelas
    // server functions — nunca serve o relatório sem antes provar que o
    // ator pode ver a sessão dona dele.
    await getCaptureSession(ctx, sessionId);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    throw err;
  }

  const entry = LOADERS[report];
  const data = await entry.load(ctx, sessionId);
  if (data == null) {
    return Response.json({ ok: false, error: "report_not_found" }, { status: 404 });
  }

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${entry.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export const Route = createFileRoute("/api/capture/report-download")({
  server: {
    handlers: {
      GET: handleReportDownload,
    },
  },
});
