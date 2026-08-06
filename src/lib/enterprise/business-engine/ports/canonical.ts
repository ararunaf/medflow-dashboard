/**
 * Contratos canônicos da Enterprise Business Engine — BLOCO E.
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem banco. Sem persistência.
 */

export interface CanonicalBusinessRuleCondition {
  readonly kind: "canonical-business-rule-condition";
  readonly field: string;
  readonly operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  readonly value: unknown;
}

export interface CanonicalBusinessRuleAction {
  readonly kind: "canonical-business-rule-action";
  readonly type: "allow" | "deny" | "set-value" | "log";
  readonly target?: string;
  readonly value?: unknown;
  readonly message?: string;
}

export interface CanonicalBusinessRule {
  readonly kind: "canonical-business-rule";
  readonly ruleId: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly conditions: readonly CanonicalBusinessRuleCondition[];
  readonly actions: readonly CanonicalBusinessRuleAction[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalBusinessRuleCatalogResult {
  readonly kind: "canonical-business-rule-catalog-result";
  readonly ok: boolean;
  readonly ruleId?: string;
  readonly code: string;
  readonly message: string;
  readonly rule?: CanonicalBusinessRule | null;
}

export interface CanonicalBusinessRuleExecutionResult {
  readonly kind: "canonical-business-rule-execution-result";
  readonly ok: boolean;
  readonly ruleId: string;
  readonly matched: boolean;
  readonly code: string;
  readonly message: string;
  readonly actions: readonly CanonicalBusinessRuleAction[];
  readonly facts?: Record<string, unknown>;
  readonly output?: Record<string, unknown>;
}

export interface CanonicalBusinessTransactionStep {
  readonly kind: "canonical-business-transaction-step";
  readonly stepId: string;
  readonly ruleId: string;
  readonly facts: Record<string, unknown>;
}

export interface CanonicalBusinessTransactionResult {
  readonly kind: "canonical-business-transaction-result";
  readonly ok: boolean;
  readonly transactionId: string;
  readonly code: string;
  readonly message: string;
  readonly stepResults: readonly CanonicalBusinessRuleExecutionResult[];
  readonly committed: boolean;
  readonly output: Record<string, unknown>;
}

export interface CanonicalBusinessWorkflowStage {
  readonly kind: "canonical-business-workflow-stage";
  readonly stageId: string;
  readonly transactionId: string;
  readonly steps: readonly CanonicalBusinessTransactionStep[];
}

export interface CanonicalBusinessWorkflowResult {
  readonly kind: "canonical-business-workflow-result";
  readonly ok: boolean;
  readonly workflowId: string;
  readonly code: string;
  readonly message: string;
  readonly stageResults: readonly CanonicalBusinessTransactionResult[];
  readonly completed: boolean;
  readonly output: Record<string, unknown>;
}

export interface CanonicalBusinessProcessWorkflow {
  readonly kind: "canonical-business-process-workflow";
  readonly workflowId: string;
  readonly stages: readonly CanonicalBusinessWorkflowStage[];
}

export interface CanonicalBusinessProcess {
  readonly kind: "canonical-business-process";
  readonly processId: string;
  readonly workflows: readonly CanonicalBusinessProcessWorkflow[];
}

export interface CanonicalBusinessProcessOrchestrationResult {
  readonly kind: "canonical-business-process-orchestration-result";
  readonly ok: boolean;
  readonly orchestrationId: string;
  readonly code: string;
  readonly message: string;
  readonly processResults: readonly CanonicalBusinessWorkflowResult[];
  readonly completed: boolean;
  readonly output: Record<string, unknown>;
}

export interface CanonicalBusinessRuleCatalogHealth {
  readonly ok: boolean;
  readonly businessEngineOk: boolean;
  readonly businessRuleCatalogOk: boolean;
  readonly businessRuleExecutionOk: boolean;
  readonly businessTransactionOk: boolean;
  readonly businessWorkflowOk: boolean;
  readonly businessProcessOrchestrationOk: boolean;
}

export interface CanonicalBusinessRuleCatalogStats {
  readonly totalRules: number;
  readonly ruleIds: readonly string[];
  readonly tags: readonly string[];
}
