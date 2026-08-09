/**
 * EnterpriseCommandEngine — J-01.
 *
 * Camada de orquestração de comandos Enterprise.
 * Consome exclusivamente as fachadas canônicas dos Blocos E, F, G, H e I.
 * Não implementa lógica de negócio, XML, SOAP, captura, IA, validação TISS,
 * integração ou workflow. Coordena comandos entre as fachadas inferiores.
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import type { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J01_ENTERPRISE_COMMAND_CAPABILITIES } from "../ports/capabilities";

export class EnterpriseCommandEngine {
  constructor(
    readonly business: GenericBusinessEngine,
    readonly integration: GenericIntegrationEngine,
    readonly tiss: GenericTissEngine,
    readonly tissIntegration: GenericTissIntegrationEngine,
    readonly workflow: GenericWorkflowEngine,
  ) {}

  getCapabilities(): EnterpriseMasterOrchestrationCapabilities {
    return J01_ENTERPRISE_COMMAND_CAPABILITIES;
  }
}
