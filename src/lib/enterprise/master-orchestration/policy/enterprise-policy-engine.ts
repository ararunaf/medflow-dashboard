/**
 * EnterprisePolicyEngine — J-04.
 *
 * Camada de políticas Enterprise. Consome exclusivamente EnterpriseSagaEngine,
 * EnterpriseOrchestrationEngine, EnterpriseCommandEngine e as fachadas
 * canônicas dos Blocos E, F, G, H e I.
 * Não implementa regras de negócio, validações funcionais, XML, SOAP,
 * Workflow, TISS, Integração, persistência, filas, compensações ou
 * execução distribuída.
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../command";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import type { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J04_ENTERPRISE_POLICY_CAPABILITIES } from "../ports/capabilities";
import { EnterpriseSagaEngine } from "../saga";

export class EnterprisePolicyEngine {
  constructor(
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
    return J04_ENTERPRISE_POLICY_CAPABILITIES;
  }
}
