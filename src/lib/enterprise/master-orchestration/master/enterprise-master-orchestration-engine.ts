/**
 * EnterpriseMasterOrchestrationEngine — J-10.
 *
 * Camada estrutural superior da Master Layer (Bloco J). Consome
 * exclusivamente as engines J-09 a J-01 e as fachadas canônicas E, F, G, H, I.
 * Não implementa orquestração funcional, execução distribuída, recovery,
 * monitoramento, mensageria, filas, eventos, persistência, dashboard,
 * telemetria, XML, SOAP, Workflow, TISS ou Integração.
 * Contém apenas propriedades readonly, construtor e getCapabilities().
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../command";
import { EnterpriseConsoleEngine } from "../console";
import { EnterpriseGovernanceEngine } from "../governance";
import { EnterpriseMasterMonitoringEngine } from "../monitoring";
import { EnterpriseMasterRecoveryEngine } from "../recovery";
import { EnterpriseMasterRoutingEngine } from "../routing";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import { EnterprisePolicyEngine } from "../policy";
import { EnterpriseSagaEngine } from "../saga";
import {
  EnterpriseMasterOrchestrationCapabilities,
  J10_ENTERPRISE_MASTER_ORCHESTRATION_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseMasterOrchestrationEngine {
  constructor(
    readonly masterRecovery: EnterpriseMasterRecoveryEngine,
    readonly masterMonitoring: EnterpriseMasterMonitoringEngine,
    readonly masterRouting: EnterpriseMasterRoutingEngine,
    readonly console: EnterpriseConsoleEngine,
    readonly governance: EnterpriseGovernanceEngine,
    readonly policy: EnterprisePolicyEngine,
    readonly saga: EnterpriseSagaEngine,
    readonly orchestration: EnterpriseOrchestrationEngine,
    readonly command: EnterpriseCommandEngine,
    readonly business: GenericBusinessEngine,
    readonly integration: GenericIntegrationEngine,
    readonly tiss: GenericTissEngine,
    readonly tissIntegration: GenericTissIntegrationEngine,
    readonly workflow: GenericWorkflowEngine,
  ) {}

  getCapabilities(): EnterpriseMasterOrchestrationCapabilities {
    return J10_ENTERPRISE_MASTER_ORCHESTRATION_CAPABILITIES;
  }
}
