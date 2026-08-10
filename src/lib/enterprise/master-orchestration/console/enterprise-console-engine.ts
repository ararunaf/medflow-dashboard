/**
 * EnterpriseConsoleEngine — J-06.
 *
 * Camada estrutural de Console Enterprise. Consome exclusivamente
 * EnterpriseGovernanceEngine, EnterprisePolicyEngine, EnterpriseSagaEngine,
 * EnterpriseOrchestrationEngine, EnterpriseCommandEngine e as fachadas
 * canônicas dos Blocos E, F, G, H e I.
 * Não implementa interface gráfica, dashboard, autenticação, regras de
 * negócio, XML, SOAP, Workflow, TISS, Integração, persistência, filas ou
 * execução distribuída.
 * Contém apenas propriedades readonly, construtor e getCapabilities().
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../command";
import { EnterpriseGovernanceEngine } from "../governance";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import { EnterprisePolicyEngine } from "../policy";
import { EnterpriseSagaEngine } from "../saga";
import { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J06_ENTERPRISE_CONSOLE_CAPABILITIES } from "../ports/capabilities";

export class EnterpriseConsoleEngine {
  constructor(
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
    return J06_ENTERPRISE_CONSOLE_CAPABILITIES;
  }
}
