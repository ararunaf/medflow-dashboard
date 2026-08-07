/**
 * Tipos vendor-agnósticos da Enterprise Business Engine.
 */
import type {
  CanonicalBusinessAuditTrail,
  CanonicalBusinessDecisionTable,
  CanonicalBusinessDecisionTableResult,
  CanonicalBusinessEvent,
  CanonicalBusinessProcess,
  CanonicalBusinessProcessOrchestrationResult,
  CanonicalBusinessRule,
  CanonicalBusinessRuleCatalogHealth,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
  CanonicalBusinessWorkflowResult,
  CanonicalBusinessWorkflowStage,
} from "./canonical";
import type { BusinessEngineCapabilities } from "./capabilities";

export type BusinessEngineProviderId = "enterprise" | "default" | "mock" | "test";

export interface BusinessEngineInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly vendor: string;
  readonly provider: BusinessEngineProviderId;
}

export interface BusinessEngineHealth {
  readonly ok: boolean;
  readonly businessEngineOk: boolean;
  readonly businessRuleCatalogOk: boolean;
  readonly businessRuleExecutionOk: boolean;
  readonly businessTransactionOk: boolean;
  readonly businessWorkflowOk: boolean;
  readonly businessProcessOrchestrationOk: boolean;
  readonly businessDecisionTableOk: boolean;
  readonly businessEventLogOk: boolean;
  readonly businessAuditTrailOk: boolean;
}

export interface RegisterBusinessRuleInput {
  readonly rule: CanonicalBusinessRule;
  readonly requestId?: string;
}

export interface RegisterBusinessRuleResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly ruleId?: string;
  readonly rule?: CanonicalBusinessRule | null;
}

export interface ListBusinessRulesInput {
  readonly tag?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly requestId?: string;
}

export interface ListBusinessRulesResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly rules: readonly CanonicalBusinessRule[];
  readonly total: number;
}

export interface FindBusinessRuleInput {
  readonly ruleId: string;
  readonly requestId?: string;
}

export type FindBusinessRuleResult = CanonicalBusinessRuleCatalogResult;

export interface GetBusinessRuleCatalogStatsInput {
  readonly requestId?: string;
}

export interface GetBusinessRuleCatalogStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalBusinessRuleCatalogStats;
}

export interface ExecuteBusinessRuleInput {
  readonly ruleId: string;
  readonly facts: Record<string, unknown>;
  readonly requestId?: string;
}

export type ExecuteBusinessRuleResult = CanonicalBusinessRuleExecutionResult;

export interface ExecuteBusinessTransactionInput {
  readonly transactionId: string;
  readonly steps: readonly CanonicalBusinessTransactionStep[];
  readonly requestId?: string;
}

export type ExecuteBusinessTransactionResult = CanonicalBusinessTransactionResult;

export interface ExecuteBusinessWorkflowInput {
  readonly workflowId: string;
  readonly stages: readonly CanonicalBusinessWorkflowStage[];
  readonly requestId?: string;
}

export type ExecuteBusinessWorkflowResult = CanonicalBusinessWorkflowResult;

export interface ExecuteBusinessProcessOrchestrationInput {
  readonly orchestrationId: string;
  readonly processes: readonly CanonicalBusinessProcess[];
  readonly requestId?: string;
}

export type ExecuteBusinessProcessOrchestrationResult = CanonicalBusinessProcessOrchestrationResult;

export interface RegisterBusinessDecisionTableInput {
  readonly table: CanonicalBusinessDecisionTable;
  readonly requestId?: string;
}

export type RegisterBusinessDecisionTableResult = {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
};

export interface FindBusinessDecisionTableInput {
  readonly tableId: string;
  readonly requestId?: string;
}

export type FindBusinessDecisionTableResult = CanonicalBusinessDecisionTable | null;

export interface ExecuteBusinessDecisionTableInput {
  readonly tableId: string;
  readonly facts: Record<string, unknown>;
  readonly requestId?: string;
}

export type ExecuteBusinessDecisionTableResult = CanonicalBusinessDecisionTableResult;

export interface RegisterBusinessEventInput {
  readonly event: CanonicalBusinessEvent;
  readonly requestId?: string;
}

export type RegisterBusinessEventResult = {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
};

export interface FindBusinessEventInput {
  readonly eventId: string;
  readonly requestId?: string;
}

export type FindBusinessEventResult = CanonicalBusinessEvent | null;

export interface ListBusinessEventsByTypeInput {
  readonly eventType: string;
  readonly requestId?: string;
}

export type ListBusinessEventsByTypeResult = {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly events: CanonicalBusinessEvent[];
};

export interface ListBusinessEventsByCorrelationIdInput {
  readonly correlationId: string;
  readonly requestId?: string;
}

export type ListBusinessEventsByCorrelationIdResult = {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly events: CanonicalBusinessEvent[];
};

export interface ListBusinessEventsByTransactionIdInput {
  readonly transactionId: string;
  readonly requestId?: string;
}

export type ListBusinessEventsByTransactionIdResult = {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly events: CanonicalBusinessEvent[];
};

export interface CreateBusinessAuditTrailInput {
  readonly auditId: string;
  readonly correlationId: string;
  readonly transactionId: string;
  readonly requestId?: string;
}

export type CreateBusinessAuditTrailResult = {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
};

export interface FindBusinessAuditTrailByCorrelationIdInput {
  readonly correlationId: string;
  readonly requestId?: string;
}

export type FindBusinessAuditTrailByCorrelationIdResult = CanonicalBusinessAuditTrail | null;

export interface FindBusinessAuditTrailByTransactionIdInput {
  readonly transactionId: string;
  readonly requestId?: string;
}

export type FindBusinessAuditTrailByTransactionIdResult = CanonicalBusinessAuditTrail | null;

export type {
  BusinessEngineCapabilities,
  CanonicalBusinessAuditTrail,
  CanonicalBusinessDecisionTable,
  CanonicalBusinessDecisionTableResult,
  CanonicalBusinessEvent,
  CanonicalBusinessProcess,
  CanonicalBusinessProcessOrchestrationResult,
  CanonicalBusinessRule,
  CanonicalBusinessRuleCatalogHealth,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
  CanonicalBusinessWorkflowResult,
  CanonicalBusinessWorkflowStage,
};
