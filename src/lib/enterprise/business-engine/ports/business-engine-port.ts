/**
 * BusinessEnginePort — contrato único da Enterprise Business Engine.
 *
 * E-01: Business Rule Catalog (`businessRuleCatalogImplemented = true`).
 * E-02: Business Rule Execution (`businessRuleExecutionImplemented = true`).
 * E-03: Business Transaction (`businessTransactionImplemented = true`).
 * E-04: Business Workflow (`businessWorkflowImplemented = true`).
 * E-05: Business Process Orchestration (`businessProcessOrchestrationImplemented = true`).
 * E-06: Business Decision Table (`businessDecisionTableImplemented = true`).
 * E-07: Business Event Log (`businessEventLogImplemented = true`).
 * Demais capabilities permanecem false.
 */
import type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
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
  FindBusinessDecisionTableInput,
  FindBusinessDecisionTableResult,
  FindBusinessEventInput,
  FindBusinessEventResult,
  FindBusinessRuleInput,
  FindBusinessRuleResult,
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

  /** E-06 — registra uma Decision Table. */
  registerDecisionTable(
    input: RegisterBusinessDecisionTableInput,
  ): Promise<RegisterBusinessDecisionTableResult>;

  /** E-06 — encontra uma Decision Table por tableId. */
  findDecisionTable(
    input: FindBusinessDecisionTableInput,
  ): Promise<FindBusinessDecisionTableResult>;

  /** E-06 — executa uma Decision Table contra fatos. */
  executeDecisionTable(
    input: ExecuteBusinessDecisionTableInput,
  ): Promise<ExecuteBusinessDecisionTableResult>;

  /** E-07 — registra um evento de negócio. */
  registerEvent(input: RegisterBusinessEventInput): Promise<RegisterBusinessEventResult>;

  /** E-07 — encontra evento por eventId. */
  findEvent(input: FindBusinessEventInput): Promise<FindBusinessEventResult>;

  /** E-07 — lista eventos por tipo. */
  listEventsByType(input: ListBusinessEventsByTypeInput): Promise<ListBusinessEventsByTypeResult>;

  /** E-07 — lista eventos por correlationId. */
  listEventsByCorrelationId(
    input: ListBusinessEventsByCorrelationIdInput,
  ): Promise<ListBusinessEventsByCorrelationIdResult>;

  /** E-07 — lista eventos por transactionId. */
  listEventsByTransactionId(
    input: ListBusinessEventsByTransactionIdInput,
  ): Promise<ListBusinessEventsByTransactionIdResult>;
}
