import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ClipboardCheck, RotateCcw, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader } from "@/components/ui-kit";
import { CaptureDropZone } from "../components/CaptureDropZone";
import { CaptureFileInfoPanel } from "../components/CaptureFileInfo";
import { CaptureImagePreview } from "../components/CaptureImagePreview";
import { CaptureOcrPanel } from "../components/CaptureOcrPanel";
import { CaptureStructuredGuidePanel } from "../components/CaptureStructuredGuidePanel";
import { CaptureAuditPanel } from "../components/CaptureAuditPanel";
import { CaptureCorrectionPanel } from "../components/CaptureCorrectionPanel";
import { CaptureLearningPanel } from "../components/CaptureLearningPanel";
import { CaptureRiskDashboard } from "../components/CaptureRiskDashboard";
import { CaptureStatusTimeline } from "../components/CaptureStatusTimeline";
import { useCaptureSession } from "../hooks/useCaptureSession";
import { useCaptureUpload } from "../hooks/useCaptureUpload";
import { downloadOcrJson, fetchCaptureOcr } from "../services/ocr-client";
import {
  downloadStructuredGuideJson,
  fetchCaptureStructuredGuide,
} from "../services/parser-client";
import {
  downloadAuditReportJson,
  fetchCaptureAuditReport,
} from "../services/audit-client";
import {
  downloadCorrectionProposalsJson,
  fetchCaptureCorrectionProposals,
} from "../services/correction-client";
import { getDownloadUrl } from "../services/storage-service";
import type { CapturePhase } from "../types";
import type { OcrResultSummary, RawOcrResult } from "@/lib/capture/ocr";
import type { StructuredGuide, StructuredGuideSummary } from "@/lib/capture/parser";
import type { AuditReport, AuditReportSummaryMeta } from "@/lib/capture/audit";
import type {
  CorrectionProposalStore,
  CorrectionProposalSummaryMeta,
} from "@/lib/capture/correction";

export function CapturaPage() {
  const [dragOver, setDragOver] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<CapturePhase>("idle");
  const [filename, setFilename] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrSummary, setOcrSummary] = useState<OcrResultSummary | null>(null);
  const [ocrResult, setOcrResult] = useState<RawOcrResult | null>(null);
  const [parserSummary, setParserSummary] = useState<StructuredGuideSummary | null>(null);
  const [structuredGuide, setStructuredGuide] = useState<StructuredGuide | null>(null);
  const [auditSummary, setAuditSummary] = useState<AuditReportSummaryMeta | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [correctionSummary, setCorrectionSummary] =
    useState<CorrectionProposalSummaryMeta | null>(null);
  const [correctionStore, setCorrectionStore] = useState<CorrectionProposalStore | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [parserBusy, setParserBusy] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [correctionBusy, setCorrectionBusy] = useState(false);

  const { view, refresh, loadDetail, setFile } = useCaptureSession(sessionId);

  const { busy, processFile, cancel, cleanup, localPreview } = useCaptureUpload({
    onSessionCreated: setSessionId,
    onPhaseChange: setPhase,
    onPreviewUrl: setPreviewUrl,
    onError: setError,
  });

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const loadOcr = useCallback(async (id: string) => {
    try {
      const data = await fetchCaptureOcr(id);
      setOcrSummary(data.summary);
      setOcrResult(data.ocr);
    } catch {
      /* OCR ainda não disponível */
    }
  }, []);

  const loadParser = useCallback(async (id: string) => {
    try {
      const data = await fetchCaptureStructuredGuide(id);
      setParserSummary(data.summary);
      setStructuredGuide(data.guide);
    } catch {
      /* Parser ainda não disponível */
    }
  }, []);

  const loadAudit = useCallback(async (id: string) => {
    try {
      const data = await fetchCaptureAuditReport(id);
      setAuditSummary(data.summary);
      setAuditReport(data.report);
    } catch {
      /* Auditoria ainda não disponível */
    }
  }, []);

  const loadCorrection = useCallback(async (id: string) => {
    try {
      const data = await fetchCaptureCorrectionProposals(id);
      setCorrectionSummary(data.summary);
      setCorrectionStore(data.store);
    } catch {
      /* Correções ainda não disponíveis */
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    void loadOcr(sessionId);
    void loadParser(sessionId);
    void loadAudit(sessionId);
    void loadCorrection(sessionId);
  }, [sessionId, view.phase, loadOcr, loadParser, loadAudit, loadCorrection]);

  const handleFiles = useCallback(
    async (files: FileList | null, channel: "file_upload" | "mobile_camera") => {
      const file = files?.[0];
      if (!file) return;
      setError(null);
      setFilename(file.name);
      setFile({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        byteLength: file.size,
        version: 1,
      });

      try {
        const result = await processFile(
          file,
          channel,
          phase === "failed" ? sessionId ?? undefined : undefined,
        );
        const id = result.sessionId;
        setSessionId(id);
        await refresh(id);
        await loadDetail(id);
      } catch {
        /* erro já tratado no hook */
      }
    },
    [processFile, phase, sessionId, refresh, loadDetail, setFile],
  );

  const handleDownloadAuditReportJson = useCallback(async () => {
    if (!sessionId) return;
    setAuditBusy(true);
    try {
      const url = await downloadAuditReportJson(sessionId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuditBusy(false);
    }
  }, [sessionId]);

  const handleDownloadCorrectionProposalsJson = useCallback(async () => {
    if (!sessionId) return;
    setCorrectionBusy(true);
    try {
      const url = await downloadCorrectionProposalsJson(sessionId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCorrectionBusy(false);
    }
  }, [sessionId]);

  const handleDownloadStructuredGuideJson = useCallback(async () => {
    if (!sessionId) return;
    setParserBusy(true);
    try {
      const url = await downloadStructuredGuideJson(sessionId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setParserBusy(false);
    }
  }, [sessionId]);

  const handleDownloadOcrJson = useCallback(async () => {
    if (!sessionId) return;
    setOcrBusy(true);
    try {
      const url = await downloadOcrJson(sessionId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOcrBusy(false);
    }
  }, [sessionId]);

  const handleDownload = useCallback(async () => {
    if (!sessionId) return;
    try {
      const url = await getDownloadUrl(sessionId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [sessionId]);

  const handleCancel = useCallback(async () => {
    if (!sessionId) return;
    await cancel(sessionId);
  }, [sessionId, cancel]);

  const displayPreview = previewUrl ?? localPreview ?? view.previewUrl;
  const displayPhase = sessionId ? view.phase : phase;
  const displayFile = view.file ?? (filename ? { name: filename, mimeType: "", byteLength: 0, version: 1 } : null);

  return (
    <AppShell>
      <PageHeader
        title="Captura Inteligente"
        subtitle="Envie guias TISS, visualize o documento e acompanhe o pipeline até a integração OCR."
        actions={
          sessionId && displayPhase !== "cancelled" ? (
            <div className="flex gap-2">
              <Button type="button" variant="default" size="sm" className="gap-1.5" asChild>
                <Link to="/captura/revisao/$sessionId" params={{ sessionId }}>
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Abrir Workspace
                </Link>
              </Button>
              {displayPhase === "failed" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={busy}
                  onClick={() => fileInputRetry()}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reenviar
                </Button>
              ) : null}
              {displayPhase !== "completed" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  disabled={busy}
                  onClick={() => void handleCancel()}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CaptureDropZone
            busy={busy}
            dragOver={dragOver}
            filename={filename}
            onDragOver={setDragOver}
            onFiles={(files, ch) => void handleFiles(files, ch)}
          />
          {error ? <ErrorState message={error} onRetry={() => setError(null)} /> : null}
        </div>

        <div className="space-y-4">
          <CaptureImagePreview
            src={displayPreview}
            alt={displayFile?.name ?? "Preview"}
            mimeType={displayFile?.mimeType}
            onDownload={sessionId ? () => void handleDownload() : undefined}
          />
          <CaptureFileInfoPanel file={view.file} />
        </div>
      </div>

      {sessionId ? (
        <section className="mt-8 space-y-6">
          <p className="text-xs text-muted-foreground font-mono truncate">
            Sessão: {sessionId}
          </p>
          <CaptureOcrPanel
            phase={displayPhase}
            summary={ocrSummary}
            ocr={ocrResult}
            busy={ocrBusy}
            onDownloadJson={() => void handleDownloadOcrJson()}
          />
          <CaptureStructuredGuidePanel
            phase={displayPhase}
            summary={parserSummary}
            guide={structuredGuide}
            busy={parserBusy}
            onDownloadJson={() => void handleDownloadStructuredGuideJson()}
          />
          <CaptureAuditPanel
            phase={displayPhase}
            summary={auditSummary}
            report={auditReport}
            busy={auditBusy}
            onDownloadJson={() => void handleDownloadAuditReportJson()}
          />
          <CaptureCorrectionPanel
            sessionId={sessionId}
            phase={displayPhase}
            summary={correctionSummary}
            store={correctionStore}
            auditReport={auditReport}
            busy={correctionBusy}
            onDownloadJson={() => void handleDownloadCorrectionProposalsJson()}
            onStoreUpdated={(store) => {
              setCorrectionStore(store);
              setCorrectionSummary((prev) => ({
                ...prev,
                status: "completed",
                totalProposals: store.proposals.length,
                pendingCount: store.proposals.filter((p) => p.status === "pending").length,
                acceptedCount: store.proposals.filter((p) => p.status === "accepted").length,
                editedCount: store.proposals.filter((p) => p.status === "edited").length,
                rejectedCount: store.proposals.filter((p) => p.status === "rejected").length,
              }));
            }}
            onError={setError}
          />
          <CaptureStatusTimeline phase={displayPhase} events={view.events} />
        </section>
      ) : null}

      <section className="mt-8 space-y-6">
        <CaptureRiskDashboard />
        <CaptureLearningPanel />
      </section>
    </AppShell>
  );

  function fileInputRetry() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/jpeg,image/png,image/webp,image/tiff";
    input.onchange = () => void handleFiles(input.files, "file_upload");
    input.click();
  }
}
