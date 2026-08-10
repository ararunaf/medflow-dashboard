/**
 * EnterpriseMasterMonitoringEngine — J-08.
 *
 * Camada estrutural de monitoramento master. Consome exclusivamente
 * EnterpriseMasterRoutingEngine, EnterpriseConsoleEngine,
 * EnterpriseGovernanceEngine, EnterprisePolicyEngine, EnterpriseSagaEngine,
 * EnterpriseOrchestrationEngine, EnterpriseCommandEngine e as fachadas
 * canônicas dos Blocos E, F, G, H e I.
 * Não implementa monitoramento real, métricas, telemetria, logs, dashboards,
 * filas, eventos, XML, SOAP, Workflow, TISS, Integração ou persistência.
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
import { EnterpriseMasterRoutingEngine } from "../routing";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import { EnterprisePolicyEngine } from "../policy";
import { EnterpriseSagaEngine } from "../saga";
import {
  EnterpriseMasterOrchestrationCapabilities,
  J08_ENTERPRISE_MASTER_MONITORING_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseMasterMonitoringEngine {
  constructor(
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
    return J08_ENTERPRISE_MASTER_MONITORING_CAPABILITIES;
  }
}
