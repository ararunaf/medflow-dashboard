/**
 * EnterpriseMasterRecoveryEngine — J-09.
 *
 * Camada estrutural de Recovery Master. Consome exclusivamente
 * EnterpriseMasterMonitoringEngine, EnterpriseMasterRoutingEngine,
 * EnterpriseConsoleEngine, EnterpriseGovernanceEngine, EnterprisePolicyEngine,
 * EnterpriseSagaEngine, EnterpriseOrchestrationEngine, EnterpriseCommandEngine
 * e as fachadas canônicas dos Blocos E, F, G, H e I.
 * Não implementa recovery real, rollback real, retry, persistência, filas,
 * eventos, logs, XML, SOAP, Workflow, TISS, Integração, dashboard ou telemetria.
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
import { EnterpriseMasterRoutingEngine } from "../routing";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import { EnterprisePolicyEngine } from "../policy";
import { EnterpriseSagaEngine } from "../saga";
import {
  EnterpriseMasterOrchestrationCapabilities,
  J09_ENTERPRISE_MASTER_RECOVERY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseMasterRecoveryEngine {
  constructor(
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
    return J09_ENTERPRISE_MASTER_RECOVERY_CAPABILITIES;
  }
}
