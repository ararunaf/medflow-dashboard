/**
 * DefaultBusinessEngineAdapter — E-09.
 *
 * Adapter oficial da Enterprise Business Engine.
 * Capabilities E-01 a E-09 ativas.
 */
import { BusinessAuditTrailEngine } from "../business-audit-trail";
import { BusinessDecisionTableEngine } from "../business-decision-table";
import { BusinessEventLogEngine } from "../business-event-log";
import { BusinessReportEngine } from "../business-report";
import { BusinessRuleCatalog, InMemoryBusinessRuleCatalogStore } from "../business-rule-catalog";
import { BusinessRuleExecutionEngine } from "../business-rule-execution";
import { BusinessTransactionEngine } from "../business-transaction";
import { BusinessWorkflowEngine } from "../business-workflow";
import { BusinessProcessOrchestrationEngine } from "../business-process-orchestration";
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

export const DEFAULT_BUSINESS_ENGINE_ADAPTER_ID = "default-enterprise-business-engine";

export interface DefaultBusinessEngineAdapterOptions {
  healthy?: boolean;
}

export class DefaultBusinessEngineAdapter implements BusinessEnginePort {
  readonly providerId = DEFAULT_BUSINESS_ENGINE_ADAPTER_ID;

  private readonly catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
  private readonly executor = new BusinessRuleExecutionEngine();
  private readonly transaction = new BusinessTransactionEngine();
  private readonly workflow = new BusinessWorkflowEngine();
  private readonly orchestration = new BusinessProcessOrchestrationEngine();
  private readonly decisionTable = new BusinessDecisionTableEngine(this.catalog);
  private readonly eventLog = new BusinessEventLogEngine();
  private readonly auditTrail = new BusinessAuditTrailEngine(this.eventLog);
  private readonly report = new BusinessReportEngine(
    this.eventLog,
    this.auditTrail,
    this.catalog,
    this.decisionTable,
  );
  private readonly healthy: boolean;

  constructor(options: DefaultBusinessEngineAdapterOptions = {}) {
    this.healthy = options.healthy ?? true;
  }

  identity(): BusinessEngineInfo {
    return {
      id: DEFAULT_BUSINESS_ENGINE_ADAPTER_ID,
      name: "Enterprise Business Engine",
      version: "1.0.0",
      vendor: "enterprise",
      provider: "default",
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
    const result = this.catalog.register(input.rule);
    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      ruleId: result.ruleId,
      rule: result.rule ?? null,
    };
  }

  async listRules(input: ListBusinessRulesInput = {}): Promise<ListBusinessRulesResult> {
    const rules = this.catalog.list(input.tag, input.limit, input.offset);
    const total = this.catalog.stats().totalRules;
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_LIST_OK",
      message: "rules listed",
      rules,
      total,
    };
  }

  async findRule(input: FindBusinessRuleInput): Promise<FindBusinessRuleResult> {
    return this.catalog.find(input.ruleId);
  }

  async getCatalogStats(
    _input?: GetBusinessRuleCatalogStatsInput,
  ): Promise<GetBusinessRuleCatalogStatsResult> {
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_STATS_OK",
      message: "stats retrieved",
      stats: this.catalog.stats(),
    };
  }

  async executeRule(input: ExecuteBusinessRuleInput): Promise<ExecuteBusinessRuleResult> {
    const found = this.catalog.find(input.ruleId);
    if (!found.ok || !found.rule) {
      return {
        kind: "canonical-business-rule-execution-result",
        ok: false,
        ruleId: input.ruleId,
        matched: false,
        code: "BUSINESS_RULE_EXECUTION_NOT_FOUND",
        message: found.message,
        actions: [],
        facts: input.facts,
      };
    }
    return this.executor.execute(found.rule, input.facts);
  }

  async executeTransaction(
    input: ExecuteBusinessTransactionInput,
  ): Promise<ExecuteBusinessTransactionResult> {
    const steps = input.steps.map((step) => {
      const found = this.catalog.find(step.ruleId);
      if (!found.ok || !found.rule) {
        throw new Error(`rule not found: ${step.ruleId}`);
      }
      return { stepId: step.stepId, rule: found.rule, facts: step.facts };
    });
    return this.transaction.execute({ transactionId: input.transactionId, steps });
  }

  async executeWorkflow(
    input: ExecuteBusinessWorkflowInput,
  ): Promise<ExecuteBusinessWorkflowResult> {
    const stages = input.stages.map((stage) => {
      const steps = stage.steps.map((step) => {
        const found = this.catalog.find(step.ruleId);
        if (!found.ok || !found.rule) {
          throw new Error(`rule not found: ${step.ruleId}`);
        }
        return { stepId: step.stepId, rule: found.rule, facts: step.facts };
      });
      return { stageId: stage.stageId, transactionId: stage.transactionId, steps };
    });
    return this.workflow.execute({ workflowId: input.workflowId, stages });
  }

  async executeProcessOrchestration(
    input: ExecuteBusinessProcessOrchestrationInput,
  ): Promise<ExecuteBusinessProcessOrchestrationResult> {
    const processes = input.processes.map((process) => {
      const workflows = process.workflows.map((workflow) => {
        const stages = workflow.stages.map((stage) => {
          const steps = stage.steps.map((step) => {
            const found = this.catalog.find(step.ruleId);
            if (!found.ok || !found.rule) {
              throw new Error(`rule not found: ${step.ruleId}`);
            }
            return { stepId: step.stepId, rule: found.rule, facts: step.facts };
          });
          return { stageId: stage.stageId, transactionId: stage.transactionId, steps };
        });
        return { workflowId: workflow.workflowId, stages };
      });
      return { processId: process.processId, workflows };
    });
    return this.orchestration.execute({ orchestrationId: input.orchestrationId, processes });
  }

  async registerDecisionTable(
    input: RegisterBusinessDecisionTableInput,
  ): Promise<RegisterBusinessDecisionTableResult> {
    return this.decisionTable.register(input.table);
  }

  async findDecisionTable(
    input: FindBusinessDecisionTableInput,
  ): Promise<FindBusinessDecisionTableResult> {
    return this.decisionTable.find(input.tableId) ?? null;
  }

  async executeDecisionTable(
    input: ExecuteBusinessDecisionTableInput,
  ): Promise<ExecuteBusinessDecisionTableResult> {
    return this.decisionTable.execute(input.tableId, input.facts);
  }

  async registerEvent(input: RegisterBusinessEventInput): Promise<RegisterBusinessEventResult> {
    return this.eventLog.register(input.event);
  }

  async findEvent(input: FindBusinessEventInput): Promise<FindBusinessEventResult> {
    return this.eventLog.find(input.eventId) ?? null;
  }

  async listEventsByType(
    input: ListBusinessEventsByTypeInput,
  ): Promise<ListBusinessEventsByTypeResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_LIST_BY_TYPE_OK",
      message: "events listed",
      events: this.eventLog.listByType(input.eventType),
    };
  }

  async listEventsByCorrelationId(
    input: ListBusinessEventsByCorrelationIdInput,
  ): Promise<ListBusinessEventsByCorrelationIdResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_LIST_BY_CORRELATION_OK",
      message: "events listed",
      events: this.eventLog.listByCorrelationId(input.correlationId),
    };
  }

  async listEventsByTransactionId(
    input: ListBusinessEventsByTransactionIdInput,
  ): Promise<ListBusinessEventsByTransactionIdResult> {
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_LIST_BY_TRANSACTION_OK",
      message: "events listed",
      events: this.eventLog.listByTransactionId(input.transactionId),
    };
  }

  async createAuditTrail(
    input: CreateBusinessAuditTrailInput,
  ): Promise<CreateBusinessAuditTrailResult> {
    return this.auditTrail.create(input.auditId, input.correlationId, input.transactionId);
  }

  async findAuditTrailByCorrelationId(
    input: FindBusinessAuditTrailByCorrelationIdInput,
  ): Promise<FindBusinessAuditTrailByCorrelationIdResult> {
    return this.auditTrail.findByCorrelationId(input.correlationId) ?? null;
  }

  async findAuditTrailByTransactionId(
    input: FindBusinessAuditTrailByTransactionIdInput,
  ): Promise<FindBusinessAuditTrailByTransactionIdResult> {
    return this.auditTrail.findByTransactionId(input.transactionId) ?? null;
  }

  async generateReport(input: GenerateBusinessReportInput): Promise<GenerateBusinessReportResult> {
    const scope = input.scope as { correlationId?: string; transactionId?: string } | undefined;
    const report = this.report.generate(input.reportId, scope);
    return {
      ok: true,
      code: "BUSINESS_REPORT_GENERATED",
      message: "report generated",
      report,
    };
  }
}
