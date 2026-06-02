/** Tipos compartilhados — execução piloto V1 (feedback, incidentes, adoção). */

export type PilotFeedbackSeverity = "low" | "medium" | "high";

export type PilotIncidentSeverity = "low" | "medium" | "high" | "critical";

export type PilotIncidentStatus = "open" | "investigating" | "resolved" | "closed";

export type PilotFollowUpStatus = "pending" | "scheduled" | "done" | "not_required";

export type PilotSuggestionStatus = "submitted" | "reviewed" | "planned" | "done" | "declined";

export type PilotAdoptionEventType =
  | "login"
  | "onboarding_complete"
  | "dashboard_view"
  | "financial_workflow"
  | "module_access"
  | "feature_use";

export type PilotFeedbackCategory =
  | "ux"
  | "performance"
  | "data"
  | "workflow"
  | "support"
  | "other";

export type PilotContext = {
  route?: string | null;
  module?: string | null;
};

export type SubmitPilotFeedbackInput = {
  category: PilotFeedbackCategory | string;
  severity: PilotFeedbackSeverity;
  description: string;
  context?: PilotContext;
};

export type ReportPilotIncidentInput = {
  category: string;
  severity: PilotIncidentSeverity;
  description: string;
  operationalSource: string;
  context?: PilotContext;
};

export type SubmitPilotSuggestionInput = {
  category: string;
  severity: PilotFeedbackSeverity;
  description: string;
  context?: PilotContext;
};

export type UpdatePilotIncidentInput = {
  incidentId: string;
  incidentStatus?: PilotIncidentStatus;
  followUpStatus?: PilotFollowUpStatus;
  resolutionNotes?: string | null;
};

export const DEFAULT_PILOT_FEATURE_FLAGS = [
  {
    flag_key: "contextual_feedback",
    description: "Botões flutuantes de feedback contextual",
    enabled: true,
  },
  {
    flag_key: "adoption_telemetry",
    description: "Registro leve de uso por módulo",
    enabled: true,
  },
  {
    flag_key: "incident_panel",
    description: "Painel de incidentes no hub piloto",
    enabled: true,
  },
  {
    flag_key: "guided_demo_strip",
    description: "Faixa da demo guiada no AppShell",
    enabled: true,
  },
] as const;
