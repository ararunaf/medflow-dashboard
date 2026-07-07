import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui-kit";
import type { ReviewPanelId } from "@/lib/capture/review";
import { CaptureAuditPanel } from "./CaptureAuditPanel";
import { CaptureContractPanel } from "./CaptureContractPanel";
import { CaptureRiskPanel } from "./CaptureRiskPanel";
import { CaptureCorrectionPanel } from "./CaptureCorrectionPanel";
import { CaptureFileInfoPanel } from "./CaptureFileInfo";
import { CaptureImagePreview } from "./CaptureImagePreview";
import { CaptureLearningPanel } from "./CaptureLearningPanel";
import { CaptureOcrPanel } from "./CaptureOcrPanel";
import { CaptureStructuredGuidePanel } from "./CaptureStructuredGuidePanel";
import { ReviewApprovalPanel } from "./ReviewApprovalPanel";
import { ReviewWorkspaceHeader } from "./ReviewWorkspaceHeader";
import { ReviewWorkspacePanelNav } from "./ReviewWorkspacePanelNav";
import type { ReviewWorkspaceController } from "../hooks/useReviewWorkspace";
import { downloadAuditReportJson } from "../services/audit-client";
import { downloadContractIntelligenceJson } from "../services/contract-client";
import { downloadRiskAssessmentJson } from "../services/risk-client";
import { downloadCorrectionProposalsJson, fetchCaptureCorrectionProposals } from "../services/correction-client";
import { downloadOcrJson } from "../services/ocr-client";
import { downloadStructuredGuideJson } from "../services/parser-client";
import { useCallback, useState } from "react";

type ReviewWorkspaceProps = {
  sessionId: string;
  workspace: ReviewWorkspaceController;
};

export function ReviewWorkspace({ sessionId, workspace }: ReviewWorkspaceProps) {
  const {
    snapshot,
    phase,
    activePanel,
    previewUrl,
    busy,
    approvalBusy,
    error,
    headerMetrics,
    ocrSummary,
    ocrResult,
    parserSummary,
    structuredGuide,
    auditSummary,
    auditReport,
    contractIntelligenceSummary,
    contractIntelligenceReport,
    riskAssessmentSummary,
    riskAssessmentReport,
    correctionSummary,
    correctionStore,
    refresh,
    navigatePanel,
    setApprovalStatus,
    downloadDocument,
    setError,
    setCorrectionStore,
  } = workspace;

  const [ocrBusy, setOcrBusy] = useState(false);
  const [parserBusy, setParserBusy] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [contractBusy, setContractBusy] = useState(false);
  const [riskBusy, setRiskBusy] = useState(false);
  const [correctionBusy, setCorrectionBusy] = useState(false);

  const handleDownloadOcr = useCallback(async () => {
    setOcrBusy(true);
    try {
      window.open(await downloadOcrJson(sessionId), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOcrBusy(false);
    }
  }, [sessionId, setError]);

  const handleDownloadParser = useCallback(async () => {
    setParserBusy(true);
    try {
      window.open(await downloadStructuredGuideJson(sessionId), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setParserBusy(false);
    }
  }, [sessionId, setError]);

  const handleDownloadAudit = useCallback(async () => {
    setAuditBusy(true);
    try {
      window.open(await downloadAuditReportJson(sessionId), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuditBusy(false);
    }
  }, [sessionId, setError]);

  const handleDownloadContract = useCallback(async () => {
    setContractBusy(true);
    try {
      window.open(await downloadContractIntelligenceJson(sessionId), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setContractBusy(false);
    }
  }, [sessionId, setError]);

  const handleDownloadRisk = useCallback(async () => {
    setRiskBusy(true);
    try {
      window.open(await downloadRiskAssessmentJson(sessionId), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRiskBusy(false);
    }
  }, [sessionId, setError]);

  const handleDownloadCorrection = useCallback(async () => {
    setCorrectionBusy(true);
    try {
      window.open(await downloadCorrectionProposalsJson(sessionId), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCorrectionBusy(false);
    }
  }, [sessionId, setError]);

  if (!snapshot && busy) {
    return <p className="text-sm text-muted-foreground">Carregando workspace…</p>;
  }

  if (!snapshot) {
    return error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null;
  }

  return (
    <div className="space-y-4" data-testid="review-workspace">
      {headerMetrics ? (
        <ReviewWorkspaceHeader
          sessionId={sessionId}
          filename={snapshot.file?.name ?? null}
          metrics={headerMetrics}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ReviewWorkspacePanelNav activePanel={activePanel} onNavigate={navigatePanel} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => void refresh()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>
      </div>

      {error ? <ErrorState message={error} onRetry={() => setError(null)} /> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start" data-testid="document-rail">
          <CaptureImagePreview
            src={previewUrl}
            alt={snapshot.file?.name ?? "Documento original"}
            mimeType={snapshot.file?.mimeType}
            onDownload={() => void downloadDocument()}
          />
          <CaptureFileInfoPanel
            file={
              snapshot.file
                ? {
                    name: snapshot.file.name,
                    mimeType: snapshot.file.mimeType,
                    byteLength: snapshot.file.byteLength,
                    checksumSha256: snapshot.file.checksumSha256,
                    version: 1,
                  }
                : null
            }
          />
        </aside>

        <main className="min-w-0 space-y-4" data-testid={`review-panel-${activePanel}`}>
          {activePanel === "documento" ? (
            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Documento Original</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Visualize a guia no painel lateral. Use os demais painéis para revisar OCR,
                campos estruturados, auditoria e correções de forma sincronizada.
              </p>
            </section>
          ) : null}

          {activePanel === "ocr" ? (
            <CaptureOcrPanel
              phase={phase}
              summary={ocrSummary}
              ocr={ocrResult}
              busy={ocrBusy}
              onDownloadJson={() => void handleDownloadOcr()}
            />
          ) : null}

          {activePanel === "structured" ? (
            <CaptureStructuredGuidePanel
              phase={phase}
              summary={parserSummary}
              guide={structuredGuide}
              busy={parserBusy}
              onDownloadJson={() => void handleDownloadParser()}
            />
          ) : null}

          {activePanel === "auditoria" ? (
            <CaptureAuditPanel
              phase={phase}
              summary={auditSummary}
              report={auditReport}
              busy={auditBusy}
              onDownloadJson={() => void handleDownloadAudit()}
            />
          ) : null}

          {activePanel === "contrato" ? (
            <CaptureContractPanel
              phase={phase}
              summary={contractIntelligenceSummary}
              report={contractIntelligenceReport}
              busy={contractBusy}
              onDownloadJson={() => void handleDownloadContract()}
            />
          ) : null}

          {activePanel === "risco" ? (
            <CaptureRiskPanel
              phase={phase}
              summary={riskAssessmentSummary}
              report={riskAssessmentReport}
              busy={riskBusy}
              onDownloadJson={() => void handleDownloadRisk()}
            />
          ) : null}

          {activePanel === "correcoes" ? (
            <CaptureCorrectionPanel
              sessionId={sessionId}
              phase={phase}
              summary={correctionSummary}
              store={correctionStore}
              auditReport={auditReport}
              busy={correctionBusy}
              onDownloadJson={() => void handleDownloadCorrection()}
              onStoreUpdated={(store) => {
                setCorrectionStore(store);
                void fetchCaptureCorrectionProposals(sessionId)
                  .then((data) => setCorrectionStore(data.store))
                  .catch(() => undefined);
              }}
              onError={setError}
            />
          ) : null}

          {activePanel === "learning" ? <CaptureLearningPanel /> : null}

          {activePanel === "aprovacao" ? (
            <ReviewApprovalPanel
              review={snapshot.review}
              busy={approvalBusy}
              onSubmit={setApprovalStatus}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

/** Utilitário de teste — expõe IDs de painéis para navegação. */
export function isReviewPanelId(value: string): value is ReviewPanelId {
  return [
    "documento",
    "ocr",
    "structured",
    "auditoria",
    "contrato",
    "risco",
    "correcoes",
    "learning",
    "aprovacao",
  ].includes(value);
}
