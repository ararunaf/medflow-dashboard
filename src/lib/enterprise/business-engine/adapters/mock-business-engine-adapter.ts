/**
 * MockBusinessEngineAdapter — E-04.
 *
 * Adapter mock para testes.
 */
import { E04_BUSINESS_ENGINE_CAPABILITIES } from "../ports/capabilities";
import type { BusinessEnginePort } from "../ports/business-engine-port";
import type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
  ExecuteBusinessRuleInput,
  ExecuteBusinessRuleResult,
  ExecuteBusinessTransactionInput,
  ExecuteBusinessTransactionResult,
  ExecuteBusinessWorkflowInput,
  ExecuteBusinessWorkflowResult,
  FindBusinessRuleInput,
  FindBusinessRuleResult,
  GetBusinessRuleCatalogStatsInput,
  GetBusinessRuleCatalogStatsResult,
  ListBusinessRulesInput,
  ListBusinessRulesResult,
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
    return { ...E04_BUSINESS_ENGINE_CAPABILITIES };
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
}
