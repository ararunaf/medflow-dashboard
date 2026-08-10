/**
 * EnterpriseGovernanceEngine — J-05.
 *
 * Camada de governança Enterprise. Consome exclusivamente EnterprisePolicyEngine,
 * EnterpriseSagaEngine, EnterpriseOrchestrationEngine, EnterpriseCommandEngine
 * e as fachadas canônicas dos Blocos E, F, G, H e I.
 * Não implementa regras de negócio, políticas funcionais, XML, SOAP, Workflow,
 * TISS, Integração, persistência, filas, execução distribuída ou auditoria funcional.
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../command";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import type { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J05_ENTERPRISE_GOVERNANCE_CAPABILITIES } from "../ports/capabilities";
import { EnterprisePolicyEngine } from "../policy";
import { EnterpriseSagaEngine } from "../saga";

export class EnterpriseGovernanceEngine {
  constructor(
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
    return J05_ENTERPRISE_GOVERNANCE_CAPABILITIES;
  }
}
