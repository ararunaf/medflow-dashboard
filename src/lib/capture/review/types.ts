/**
 * Tipos do Workspace de Revisão — MEDICFLOW-REVIEW-WORKSPACE-01.
 * Persistência em capture_sessions.metadata.review (sem alteração de infraestrutura).
 */

export const REVIEW_APPROVAL_STATUSES = [
  "em_revisao",
  "aguardando_correcoes",
  "aprovada",
  "reprovada",
] as const;

export type ReviewApprovalStatus = (typeof REVIEW_APPROVAL_STATUSES)[number];

export const REVIEW_PANEL_IDS = [
  "documento",
  "ocr",
  "structured",
  "auditoria",
  "contrato",
  "risco",
  "correcoes",
  "learning",
  "aprovacao",
] as const;

export type ReviewPanelId = (typeof REVIEW_PANEL_IDS)[number];

export type ReviewApprovalDecision = {
  status: ReviewApprovalStatus;
  note?: string;
  at: string;
  actorProfileId: string;
};

export type ReviewWorkspaceMetadata = {
  approvalStatus: ReviewApprovalStatus;
  decisions: ReviewApprovalDecision[];
  enteredAt?: string;
  lastUpdatedAt?: string;
};

export type ReviewPipelineStepId =
  | "guia"
  | "workspace"
  | "ocr"
  | "parser"
  | "auditoria"
  | "contrato"
  | "risco"
  | "correcoes"
  | "learning"
  | "aprovacao";

export type ReviewPipelineStep = {
  id: ReviewPipelineStepId;
  label: string;
  completed: boolean;
  active: boolean;
};

export type ReviewWorkspaceHeaderMetrics = {
  pipelineProgress: number;
  steps: ReviewPipelineStep[];
  guideScore: number | null;
  findingsCount: number;
  correctionsCount: number;
  pendingCorrections: number;
  approvalStatus: ReviewApprovalStatus;
  sessionStatus: string;
};

export type SetReviewApprovalInput = {
  sessionId: string;
  status: ReviewApprovalStatus;
  note?: string;
};
