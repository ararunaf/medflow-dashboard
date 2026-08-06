/**
 * BusinessEnginePort — contrato único da Enterprise Business Engine.
 *
 * E-01: Business Rule Catalog (`businessRuleCatalogImplemented = true`).
 * E-02: Business Rule Execution (`businessRuleExecutionImplemented = true`).
 * E-03: Business Transaction (`businessTransactionImplemented = true`).
 * E-04: Business Workflow (`businessWorkflowImplemented = true`).
 * E-05: Business Process Orchestration (`businessProcessOrchestrationImplemented = true`).
 * Demais capabilities permanecem false.
 */
import type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
  ExecuteBusinessProcessOrchestrationInput,
  ExecuteBusinessProcessOrchestrationResult,
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
} from "./types";

export interface BusinessEnginePort {
  readonly providerId: string;

  /** Identidade canônica do Port. */
  identity(): BusinessEngineInfo;

  /** Capabilities atuais. */
  getCapabilities(): BusinessEngineCapabilities;

  /** Health do runtime. */
  health(): Promise<BusinessEngineHealth>;

  /** E-01 — registra uma regra no catálogo. */
  registerRule(input: RegisterBusinessRuleInput): Promise<RegisterBusinessRuleResult>;

  /** E-01 — lista regras do catálogo. */
  listRules(input?: ListBusinessRulesInput): Promise<ListBusinessRulesResult>;

  /** E-01 — encontra regra por ruleId. */
  findRule(input: FindBusinessRuleInput): Promise<FindBusinessRuleResult>;

  /** E-01 — estatísticas do catálogo. */
  getCatalogStats(
    input?: GetBusinessRuleCatalogStatsInput,
  ): Promise<GetBusinessRuleCatalogStatsResult>;

  /** E-02 — executa regra por ruleId contra fatos. */
  executeRule(input: ExecuteBusinessRuleInput): Promise<ExecuteBusinessRuleResult>;

  /** E-03 — executa transação composta por passos. */
  executeTransaction(
    input: ExecuteBusinessTransactionInput,
  ): Promise<ExecuteBusinessTransactionResult>;

  /** E-04 — executa workflow orquestrado por transações. */
  executeWorkflow(input: ExecuteBusinessWorkflowInput): Promise<ExecuteBusinessWorkflowResult>;

  /** E-05 — executa orquestração de processos de negócio. */
  executeProcessOrchestration(
    input: ExecuteBusinessProcessOrchestrationInput,
  ): Promise<ExecuteBusinessProcessOrchestrationResult>;
}
