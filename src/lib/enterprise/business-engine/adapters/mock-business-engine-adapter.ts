/**
 * MockBusinessEngineAdapter — E-09.
 *
 * Adapter mock para testes.
 */
import { E09_BUSINESS_ENGINE_CAPABILITIES } from "../ports/capabilities";
import type { BusinessEnginePort } from "../ports/business-engine-port";
import type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
  CreateBusinessAuditTrailInput,
  CreateBusinessAuditTrailResult,
  ExecuteBusinessDecisionTableInput,
  ExecuteBusinessDecisionTableResult,
  ExecuteBusinessProcessOrchestrationInput,
  ExecuteBusinessProcessOrchestrationResult,
  ExecuteBusinessRuleInput,
  ExecuteBusinessRuleResult,
  ExecuteBusinessTransactionInput,
  ExecuteBusinessTransactionResult,
  ExecuteBusinessWorkflowInput,
  ExecuteBusinessWorkflowResult,
  FindBusinessAuditTrailByCorrelationIdInput,
  FindBusinessAuditTrailByCorrelationIdResult,
  FindBusinessAuditTrailByTransactionIdInput,
  FindBusinessAuditTrailByTransactionIdResult,
  FindBusinessDecisionTableInput,
  FindBusinessDecisionTableResult,
  FindBusinessEventInput,
  FindBusinessEventResult,
  FindBusinessRuleInput,
  FindBusinessRuleResult,
  GenerateBusinessReportInput,
  GenerateBusinessReportResult,
  GetBusinessRuleCatalogStatsInput,
  GetBusinessRuleCatalogStatsResult,
  ListBusinessEventsByCorrelationIdInput,
  ListBusinessEventsByCorrelationIdResult,
  ListBusinessEventsByTransactionIdInput,
  ListBusinessEventsByTransactionIdResult,
  ListBusinessEventsByTypeInput,
  ListBusinessEventsByTypeResult,
  ListBusinessRulesInput,
  ListBusinessRulesResult,
  RegisterBusinessDecisionTableInput,
  RegisterBusinessDecisionTableResult,
  RegisterBusinessEventInput,
  RegisterBusinessEventResult,
  RegisterBusinessRuleInput,
  RegisterBusinessRuleResult,
} from "../ports/types";

export const MOCK_BUSINESS_ENGINE_ADAPTER_ID = "mock-enterprise-business-engine";

export interface MockBusinessEngineAdapterOptions {
  healthy?: boolean;
}

export class MockBusinessEngineAdapter implements BusinessEnginePort {
  readonly providerId = MOCK_BUSINESS_ENGINE_ADAPTER_ID;
  private readonly healthy: boolean;

  constructor(options: MockBusinessEngineAdapterOptions = {}) {
    this.healthy = options.healthy ?? true;
  }

  identity(): BusinessEngineInfo {
    return {
      id: MOCK_BUSINESS_ENGINE_ADAPTER_ID,
      name: "Mock Enterprise Business Engine",
      version: "1.0.0",
      vendor: "enterprise",
      provider: "mock",
    };
  }

  getCapabilities(): BusinessEngineCapabilities {
    return { ...E09_BUSINESS_ENGINE_CAPABILITIES };
  }

  async health(): Promise<BusinessEngineHealth> {
    const ok = this.healthy;
    return {
      ok,
      businessEngineOk: ok,
      businessRuleCatalogOk: ok,
      businessRuleExecutionOk: ok,
      businessTransactionOk: ok,
      businessWorkflowOk: ok,
      businessProcessOrchestrationOk: ok,
      businessDecisionTableOk: ok,
      businessEventLogOk: ok,
      businessAuditTrailOk: ok,
      businessReportOk: ok,
    };
  }

  async registerRule(input: RegisterBusinessRuleInput): Promise<RegisterBusinessRuleResult> {
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_MOCK_REGISTERED",
      message: "rule registered (mock)",
      ruleId: input.rule.ruleId,
      rule: input.rule,
    };
  }

  async listRules(_input: ListBusinessRulesInput = {}): Promise<ListBusinessRulesResult> {
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_MOCK_LIST",
      message: "rules listed (mock)",
      rules: [],
      total: 0,
    };
  }

  async findRule(input: FindBusinessRuleInput): Promise<FindBusinessRuleResult> {
    return {
      kind: "canonical-business-rule-catalog-result",
      ok: false,
      ruleId: input.ruleId,
      code: "BUSINESS_RULE_CATALOG_MOCK_NOT_FOUND",
      message: "rule not found (mock)",
    };
  }

  async getCatalogStats(
    _input?: GetBusinessRuleCatalogStatsInput,
  ): Promise<GetBusinessRuleCatalogStatsResult> {
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_MOCK_STATS",
      message: "stats retrieved (mock)",
      stats: { totalRules: 0, ruleIds: [], tags: [] },
    };
  }

  async executeRule(input: ExecuteBusinessRuleInput): Promise<ExecuteBusinessRuleResult> {
    return {
      kind: "canonical-business-rule-execution-result",
      ok: true,
      ruleId: input.ruleId,
      matched: true,
      code: "BUSINESS_RULE_MOCK_EXECUTED",
      message: "rule executed (mock)",
      actions: [],
      facts: input.facts,
    };
  }

  async executeTransaction(
    _input: ExecuteBusinessTransactionInput,
  ): Promise<ExecuteBusinessTransactionResult> {
    return {
      kind: "canonical-business-transaction-result",
      ok: true,
      transactionId: _input.transactionId,
      code: "BUSINESS_TRANSACTION_MOCK_EXECUTED",
      message: "transaction executed (mock)",
      stepResults: [],
      committed: true,
      output: {},
    };
  }

  async executeWorkflow(
    _input: ExecuteBusinessWorkflowInput,
  ): Promise<ExecuteBusinessWorkflowResult> {
    return {
      kind: "canonical-business-workflow-result",
      ok: true,
      workflowId: _input.workflowId,
      code: "BUSINESS_WORKFLOW_MOCK_EXECUTED",
      message: "workflow executed (mock)",
      stageResults: [],
      completed: true,
      output: {},
    };
  }

  async executeProcessOrchestration(
    _input: ExecuteBusinessProcessOrchestrationInput,
  ): Promise<ExecuteBusinessProcessOrchestrationResult> {
    return {
      kind: "canonical-business-process-orchestration-result",
      ok: true,
      orchestrationId: _input.orchestrationId,
      code: "BUSINESS_PROCESS_ORCHESTRATION_MOCK_EXECUTED",
      message: "process orchestration executed (mock)",
      processResults: [],
      completed: true,
      output: {},
    };
  }

  async registerDecisionTable(
    _input: RegisterBusinessDecisionTableInput,
  ): Promise<RegisterBusinessDecisionTableResult> {
    return {
      ok: true,
      code: "BUSINESS_DECISION_TABLE_MOCK_REGISTERED",
      message: "decision table registered (mock)",
    };
  }

  async findDecisionTable(
    _input: FindBusinessDecisionTableInput,
  ): Promise<FindBusinessDecisionTableResult> {
    return null;
  }

  async executeDecisionTable(
    _input: ExecuteBusinessDecisionTableInput,
  ): Promise<ExecuteBusinessDecisionTableResult> {
    return {
      kind: "canonical-business-decision-table-result",
      ok: true,
      tableId: _input.tableId,
      matched: false,
      code: "BUSINESS_DECISION_TABLE_MOCK_EXECUTED",
      message: "decision table executed (mock)",
      rule: null,
    };
  }

  async registerEvent(_input: RegisterBusinessEventInput): Promise<RegisterBusinessEventResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_MOCK_REGISTERED",
      message: "event registered (mock)",
    };
  }

  async findEvent(_input: FindBusinessEventInput): Promise<FindBusinessEventResult> {
    return null;
  }

  async listEventsByType(
    _input: ListBusinessEventsByTypeInput,
  ): Promise<ListBusinessEventsByTypeResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_MOCK_LIST_BY_TYPE",
      message: "events listed (mock)",
      events: [],
    };
  }

  async listEventsByCorrelationId(
    _input: ListBusinessEventsByCorrelationIdInput,
  ): Promise<ListBusinessEventsByCorrelationIdResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_MOCK_LIST_BY_CORRELATION",
      message: "events listed (mock)",
      events: [],
    };
  }

  async listEventsByTransactionId(
    _input: ListBusinessEventsByTransactionIdInput,
  ): Promise<ListBusinessEventsByTransactionIdResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_MOCK_LIST_BY_TRANSACTION",
      message: "events listed (mock)",
      events: [],
    };
  }

  async createAuditTrail(
    _input: CreateBusinessAuditTrailInput,
  ): Promise<CreateBusinessAuditTrailResult> {
    return {
      ok: true,
      code: "BUSINESS_AUDIT_TRAIL_MOCK_CREATED",
      message: "audit trail created (mock)",
    };
  }

  async findAuditTrailByCorrelationId(
    _input: FindBusinessAuditTrailByCorrelationIdInput,
  ): Promise<FindBusinessAuditTrailByCorrelationIdResult> {
    return null;
  }

  async findAuditTrailByTransactionId(
    _input: FindBusinessAuditTrailByTransactionIdInput,
  ): Promise<FindBusinessAuditTrailByTransactionIdResult> {
    return null;
  }

  async generateReport(_input: GenerateBusinessReportInput): Promise<GenerateBusinessReportResult> {
    return {
      ok: true,
      code: "BUSINESS_REPORT_MOCK_GENERATED",
      message: "report generated (mock)",
      report: null,
    };
  }
}
