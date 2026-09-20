/**
 * SEC-PII-02 — URL do proxy autenticado de download de relatórios.
 *
 * Os 6 artefatos JSON derivados do pipeline (OCR, guia estruturada,
 * auditoria, contrato, risco, correção) agora são criptografados em
 * repouso (ver `storage-encryption.ts`) — uma signed URL direta do
 * Storage devolveria o blob cifrado. Em vez disso, os `get*SignedUrl`
 * apontam para `src/routes/api.capture.report-download.ts`, que
 * autentica via cookie de sessão (mesmo `requireOperationalAuth` das
 * server functions), descriptografa e serve o conteúdo de verdade.
 */
export type CaptureReportType =
  | "ocr"
  | "structured-guide"
  | "audit"
  | "contract"
  | "risk"
  | "correction";

export function buildCaptureReportDownloadUrl(
  sessionId: string,
  report: CaptureReportType,
): string {
  const params = new URLSearchParams({ sessionId, report });
  return `/api/capture/report-download?${params.toString()}`;
}
