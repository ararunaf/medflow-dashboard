/**
 * Lógica pura do Workspace de Revisão — agrega métricas sem alterar módulos do pipeline.
 */
import type { AuditReport } from "../audit";
import type { CorrectionProposalStore } from "../correction";
import type {
  ReviewApprovalStatus,
  ReviewPipelineStep,
  ReviewWorkspaceHeaderMetrics,
  ReviewWorkspaceMetadata,
} from "./types";

const DEFAULT_REVIEW_METADATA: ReviewWorkspaceMetadata = {
  approvalStatus: "em_revisao",
  decisions: [],
};

export function parseReviewMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ReviewWorkspaceMetadata {
  const raw = metadata?.review;
  if (!raw || typeof raw !== "object") return { ...DEFAULT_REVIEW_METADATA };

  const review = raw as Record<string, unknown>;
  const status = review.approvalStatus;
  const approvalStatus: ReviewApprovalStatus =
    status === "aguardando_correcoes" ||
    status === "aprovada" ||
    status === "reprovada" ||
    status === "em_revisao"
      ? status
      : "em_revisao";

  const decisions = Array.isArray(review.decisions)
    ? (review.decisions as ReviewWorkspaceMetadata["decisions"])
    : [];

  return {
    approvalStatus,
    decisions,
    enteredAt: typeof review.enteredAt === "string" ? review.enteredAt : undefined,
    lastUpdatedAt: typeof review.lastUpdatedAt === "string" ? review.lastUpdatedAt : undefined,
  };
}

function stageCompleted(metadata: Record<string, unknown>, key: string): boolean {
  const stage = metadata[key];
  if (!stage || typeof stage !== "object") return false;
  return (stage as Record<string, unknown>).status === "completed";
}

export function buildPipelineSteps(
  metadata: Record<string, unknown>,
  approvalStatus: ReviewApprovalStatus,
  activePanel?: string,
): ReviewPipelineStep[] {
  const ocrDone = stageCompleted(metadata, "ocr");
  const parserDone = stageCompleted(metadata, "parser");
  const auditDone = stageCompleted(metadata, "audit");
  const contractDone = stageCompleted(metadata, "contractIntelligence");
  const riskDone = stageCompleted(metadata, "riskAssessment");
  const correctionDone = stageCompleted(metadata, "correction");

  const steps: ReviewPipelineStep[] = [
    { id: "guia", label: "Guia", completed: true, active: activePanel === "documento" },
    { id: "workspace", label: "Workspace", completed: true, active: false },
    { id: "ocr", label: "OCR", completed: ocrDone, active: activePanel === "ocr" },
    {
      id: "parser",
      label: "Parser",
      completed: parserDone,
      active: activePanel === "structured",
    },
    {
      id: "auditoria",
      label: "Auditoria",
      completed: auditDone,
      active: activePanel === "auditoria",
    },
    {
      id: "contrato",
      label: "Conhecimento Contratual",
      completed: contractDone,
      active: activePanel === "contrato",
    },
    {
      id: "risco",
      label: "Risco de Glosa",
      completed: riskDone,
      active: activePanel === "risco",
    },
    {
      id: "correcoes",
      label: "Correções",
      completed: correctionDone,
      active: activePanel === "correcoes",
    },
    {
      id: "learning",
      label: "Learning",
      completed: correctionDone,
      active: activePanel === "learning",
    },
    {
      id: "historico",
      label: "Histórico",
      completed: true,
      active: activePanel === "historico",
    },
    {
      id: "aprovacao",
      label: "Aprovação",
      completed: approvalStatus === "aprovada" || approvalStatus === "reprovada",
      active: activePanel === "aprovacao",
    },
  ];

  return steps;
}

export function computePipelineProgress(steps: ReviewPipelineStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.completed).length;
  return Math.round((completed / steps.length) * 100);
}

export function buildReviewHeaderMetrics(input: {
  metadata: Record<string, unknown>;
  sessionStatus: string;
  auditReport: AuditReport | null;
  correctionStore: CorrectionProposalStore | null;
  review: ReviewWorkspaceMetadata;
  activePanel?: string;
}): ReviewWorkspaceHeaderMetrics {
  const steps = buildPipelineSteps(input.metadata, input.review.approvalStatus, input.activePanel);
  const findingsCount =
    input.auditReport?.summary.totalFindings ??
    (typeof input.metadata.audit === "object" &&
    input.metadata.audit &&
    typeof (input.metadata.audit as Record<string, unknown>).totalFindings === "number"
      ? ((input.metadata.audit as Record<string, unknown>).totalFindings as number)
      : 0);

  const proposals = input.correctionStore?.proposals ?? [];
  const correctionsCount = proposals.length;
  const pendingCorrections = proposals.filter((p) => p.status === "pending").length;

  return {
    pipelineProgress: computePipelineProgress(steps),
    steps,
    guideScore: input.auditReport?.score.overall ?? null,
    findingsCount,
    correctionsCount,
    pendingCorrections,
    approvalStatus: input.review.approvalStatus,
    sessionStatus: input.sessionStatus,
  };
}

export const REVIEW_APPROVAL_LABELS: Record<ReviewApprovalStatus, string> = {
  em_revisao: "Em Revisão",
  aguardando_correcoes: "Aguardando Correções",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
};

export const REVIEW_PANEL_LABELS: Record<string, string> = {
  documento: "Documento Original",
  ocr: "OCR",
  structured: "Guia Estruturada",
  auditoria: "Auditoria Preventiva",
  contrato: "Conhecimento Contratual",
  risco: "Risco de Glosa",
  correcoes: "Sugestões de Correção",
  learning: "Learning Loop",
  historico: "Histórico",
  aprovacao: "Aprovação Final",
};
