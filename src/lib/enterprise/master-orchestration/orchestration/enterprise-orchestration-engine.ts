/**
 * EnterpriseOrchestrationEngine — J-02.
 *
 * Orquestradora Enterprise. Consome exclusivamente o EnterpriseCommandEngine
 * e as fachadas canônicas dos Blocos E, F, G, H e I.
 * Não implementa lógica de XML, SOAP, Workflow, TISS, Integração ou Negócio.
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../command";
import type { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J02_ENTERPRISE_ORCHESTRATION_CAPABILITIES } from "../ports/capabilities";

export class EnterpriseOrchestrationEngine {
  constructor(
    readonly command: EnterpriseCommandEngine,
    readonly business: GenericBusinessEngine,
    readonly integration: GenericIntegrationEngine,
    readonly tiss: GenericTissEngine,
    readonly tissIntegration: GenericTissIntegrationEngine,
    readonly workflow: GenericWorkflowEngine,
  ) {}

  getCapabilities(): EnterpriseMasterOrchestrationCapabilities {
    return J02_ENTERPRISE_ORCHESTRATION_CAPABILITIES;
  }
}
