/**
 * GenericBusinessEngine — E-10.
 *
 * Fachada única que expõe as capacidades E-01 a E-09.
 * Apenas coordena os motores existentes.
 * Não duplica lógica. Sem persistência. Sem API. Sem IA. Sem banco.
 */
import { BusinessAuditTrailEngine } from "../business-audit-trail";
import { BusinessDecisionTableEngine } from "../business-decision-table";
import { BusinessEventLogEngine } from "../business-event-log";
import { BusinessReportEngine } from "../business-report";
import { BusinessRuleCatalog } from "../business-rule-catalog";
import { BusinessRuleExecutionEngine } from "../business-rule-execution";
import { BusinessTransactionEngine } from "../business-transaction";
import { BusinessWorkflowEngine } from "../business-workflow";
import { BusinessProcessOrchestrationEngine } from "../business-process-orchestration";

export class GenericBusinessEngine {
  constructor(
    readonly ruleCatalog: BusinessRuleCatalog,
    readonly ruleExecution: BusinessRuleExecutionEngine,
    readonly transaction: BusinessTransactionEngine,
    readonly workflow: BusinessWorkflowEngine,
    readonly processOrchestration: BusinessProcessOrchestrationEngine,
    readonly decisionTable: BusinessDecisionTableEngine,
    readonly eventLog: BusinessEventLogEngine,
    readonly auditTrail: BusinessAuditTrailEngine,
    readonly businessReport: BusinessReportEngine,
  ) {}
}
