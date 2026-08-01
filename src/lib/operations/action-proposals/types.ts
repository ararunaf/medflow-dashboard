import type {
  JsonObject,
  OperationalActionKind,
  OperationalActionProposalState,
} from "@/lib/database.types";

export type OperationalProposalReferenceKind =
  | "score"
  | "forecast"
  | "alert"
  | "timeline_event"
  | "recommendation";

/** Referência explicável (proveniência) ligada à proposta. */
export type OperationalProposalReference = {
  kind: OperationalProposalReferenceKind;
  /** Ex.: score:coverage_risk_score, alert:swap_backlog, timeline_event:uuid, recommendation:id */
  ref: string;
  note?: string;
};

export type OperationalActionProposalSource = "gpt_tool" | "manual";

export type OperationalActionProposalDto = {
  id: string;
  tenantId: string;
  createdByProfileId: string;
  effectiveState: OperationalActionProposalState;
  storedState: OperationalActionProposalState;
  actionKind: OperationalActionKind;
  title: string;
  summary: string;
  operationalRationale: string;
  references: OperationalProposalReference[];
  payload: JsonObject;
  source: OperationalActionProposalSource;
  gptCorrelationId: string | null;
  contextFingerprint: string | null;
  expiresAt: string;
  approvedByProfileId: string | null;
  rejectedByProfileId: string | null;
  approvalNote: string | null;
  rejectionJustification: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmitOperationalActionProposalFromGptInput = {
  actionKind: OperationalActionKind;
  title: string;
  summary: string;
  operationalRationale: string;
  references: OperationalProposalReference[];
  payload?: JsonObject;
  /** Se true, entra direto na fila de confirmação (ainda sem execução). */
  requestImmediateConfirmation?: boolean;
  contextFingerprint?: string | null;
  gptCorrelationId?: string | null;
};
