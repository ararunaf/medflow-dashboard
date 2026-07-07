import { useCallback, useEffect, useMemo, useState } from "react";
import { buildReviewHeaderMetrics } from "@/lib/capture/review/review-workspace-service";
import type { ReviewPanelId, ReviewApprovalStatus } from "@/lib/capture/review";
import type { ReviewWorkspaceSnapshot } from "@/lib/capture/review/review-workspace-store";
import type { AuditReport, AuditReportSummaryMeta } from "@/lib/capture/audit";
import type { ContractIntelligenceReport, ContractIntelligenceSummaryMeta } from "@/lib/capture/contract";
import type { RiskAssessmentReport, RiskAssessmentSummaryMeta } from "@/lib/capture/risk";
import type { CorrectionProposalStore, CorrectionProposalSummaryMeta } from "@/lib/capture/correction";
import type { OcrResultSummary, RawOcrResult } from "@/lib/capture/ocr";
import type { StructuredGuide, StructuredGuideSummary } from "@/lib/capture/parser";
import { dbStatusToPhase } from "../utils/status-map";
import type { CapturePhase } from "../types";
import { fetchReviewWorkspace, submitReviewApproval } from "../services/review-client";
import { getDownloadUrl, getPreviewUrl } from "../services/storage-service";

export function useReviewWorkspace(sessionId: string) {
  const [snapshot, setSnapshot] = useState<ReviewWorkspaceSnapshot | null>(null);
  const [activePanel, setActivePanel] = useState<ReviewPanelId>("documento");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchReviewWorkspace(sessionId);
      setSnapshot(data);
      try {
        const url = await getPreviewUrl(sessionId);
        setPreviewUrl(url);
      } catch {
        /* preview opcional */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const phase: CapturePhase = useMemo(() => {
    if (!snapshot) return "idle";
    return dbStatusToPhase(snapshot.sessionStatus, snapshot.metadata);
  }, [snapshot]);

  const ocrSummary = (snapshot?.ocrSummary as OcrResultSummary | null) ?? null;
  const ocrResult = snapshot?.ocr ?? null;
  const parserSummary = (snapshot?.parserSummary as StructuredGuideSummary | null) ?? null;
  const structuredGuide = snapshot?.structuredGuide ?? null;
  const auditSummary = (snapshot?.auditSummary as AuditReportSummaryMeta | null) ?? null;
  const auditReport = snapshot?.auditReport ?? null;
  const contractIntelligenceSummary =
    (snapshot?.contractIntelligenceSummary as ContractIntelligenceSummaryMeta | null) ?? null;
  const contractIntelligenceReport = snapshot?.contractIntelligenceReport ?? null;
  const riskAssessmentSummary =
    (snapshot?.riskAssessmentSummary as RiskAssessmentSummaryMeta | null) ?? null;
  const riskAssessmentReport = snapshot?.riskAssessmentReport ?? null;
  const correctionSummary =
    (snapshot?.correctionSummary as CorrectionProposalSummaryMeta | null) ?? null;
  const correctionStore = snapshot?.correctionStore ?? null;

  const headerMetrics = useMemo(() => {
    if (!snapshot) return null;
    return buildReviewHeaderMetrics({
      metadata: snapshot.metadata,
      sessionStatus: snapshot.sessionStatus,
      auditReport: snapshot.auditReport,
      correctionStore: snapshot.correctionStore,
      review: snapshot.review,
      activePanel,
    });
  }, [snapshot, activePanel]);

  const navigatePanel = useCallback((panel: ReviewPanelId) => {
    setActivePanel(panel);
  }, []);

  const setApprovalStatus = useCallback(
    async (status: ReviewApprovalStatus, note?: string) => {
      setApprovalBusy(true);
      setError(null);
      try {
        const result = await submitReviewApproval({ sessionId, status, note });
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                review: result.review,
                sessionStatus: result.sessionStatus as ReviewWorkspaceSnapshot["sessionStatus"],
              }
            : prev,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setApprovalBusy(false);
      }
    },
    [sessionId],
  );

  const downloadDocument = useCallback(async () => {
    const url = await getDownloadUrl(sessionId);
    window.open(url, "_blank");
  }, [sessionId]);

  return {
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
    structuredGuide: structuredGuide as StructuredGuide | null,
    auditSummary,
    auditReport: auditReport as AuditReport | null,
    contractIntelligenceSummary,
    contractIntelligenceReport: contractIntelligenceReport as ContractIntelligenceReport | null,
    riskAssessmentSummary,
    riskAssessmentReport: riskAssessmentReport as RiskAssessmentReport | null,
    correctionSummary,
    correctionStore: correctionStore as CorrectionProposalStore | null,
    ocr: ocrResult as RawOcrResult | null,
    refresh,
    navigatePanel,
    setApprovalStatus,
    downloadDocument,
    setError,
    setCorrectionStore: (store: CorrectionProposalStore) => {
      setSnapshot((prev) => (prev ? { ...prev, correctionStore: store } : prev));
    },
  };
}

export type ReviewWorkspaceController = ReturnType<typeof useReviewWorkspace>;
