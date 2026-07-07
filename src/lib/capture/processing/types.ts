/**
 * Tipos do Centro Operacional de Processamento — MEDICFLOW-PROCESSING-CENTER-01.
 */
import type { CaptureSessionStatus } from "../types";
import type { RiskLevel } from "../risk/types/risk-assessment";
import type { ReviewApprovalStatus } from "../review/types";

export const PROCESSING_QUEUE_IDS = [
  "ocr_pendente",
  "parser",
  "auditoria",
  "correcao",
  "aguardando_revisao",
  "aprovadas",
  "reprovadas",
] as const;

export type ProcessingQueueId = (typeof PROCESSING_QUEUE_IDS)[number];

export const PROCESSING_QUEUE_LABELS: Record<ProcessingQueueId, string> = {
  ocr_pendente: "OCR Pendente",
  parser: "Parser",
  auditoria: "Auditoria",
  correcao: "Correção",
  aguardando_revisao: "Aguardando Revisão",
  aprovadas: "Aprovadas",
  reprovadas: "Reprovadas",
};

export type ProcessingGuideItem = {
  sessionId: string;
  filename: string | null;
  queue: ProcessingQueueId;
  status: CaptureSessionStatus;
  approvalStatus: ReviewApprovalStatus | null;
  operatorName: string | null;
  operatorAnsCode: string | null;
  guideType: string | null;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  estimatedFinancialImpact: number;
  contractualPriority: number;
  waitTimeMs: number;
  responsibleProfileId: string | null;
  createdAt: string;
  updatedAt: string;
  priorityScore: number;
  isCritical: boolean;
};

export type ProcessingCenterFilters = {
  operator?: string;
  guideType?: string;
  riskLevel?: RiskLevel;
  queue?: ProcessingQueueId;
  status?: CaptureSessionStatus;
  periodFrom?: string;
  periodTo?: string;
  responsible?: string;
};

export type ProcessingCenterListResult = {
  items: ProcessingGuideItem[];
  total: number;
  queueCounts: Record<ProcessingQueueId, number>;
};

export type ProcessingOperationalDashboard = {
  totalGuides: number;
  averageProcessingTimeMs: number;
  criticalGuides: number;
  totalFinancialRisk: number;
  byOperator: Array<{ operator: string; count: number }>;
  byStatus: Array<{ queue: ProcessingQueueId; label: string; count: number }>;
};

export type ProcessingCenterQueryInput = {
  filters?: ProcessingCenterFilters;
  queue?: ProcessingQueueId;
  limit?: number;
  offset?: number;
};
