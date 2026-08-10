/**
 * EnterpriseMasterRoutingEngine — J-07.
 *
 * Camada estrutural de roteamento Enterprise. Consome exclusivamente
 * EnterpriseConsoleEngine, EnterpriseGovernanceEngine, EnterprisePolicyEngine,
 * EnterpriseSagaEngine, EnterpriseOrchestrationEngine, EnterpriseCommandEngine
 * e as fachadas canônicas dos Blocos E, F, G, H e I.
 * Não implementa regras de roteamento reais, filas, brokers, mensageria,
 * eventos, persistência, XML, SOAP, Workflow, TISS, Integração,
 * autenticação nem dashboards.
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
import { EnterpriseOrchestrationEngine } from "../orchestration";
import { EnterprisePolicyEngine } from "../policy";
import { EnterpriseSagaEngine } from "../saga";
import { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J07_ENTERPRISE_MASTER_ROUTING_CAPABILITIES } from "../ports/capabilities";

export class EnterpriseMasterRoutingEngine {
  constructor(
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
    return J07_ENTERPRISE_MASTER_ROUTING_CAPABILITIES;
  }
}
