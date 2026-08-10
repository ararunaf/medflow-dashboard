/**
 * EnterpriseSagaEngine — J-03.
 *
 * Coordenadora Enterprise de sagas. Consome exclusivamente
 * EnterpriseOrchestrationEngine, EnterpriseCommandEngine e as fachadas
 * canônicas dos Blocos E, F, G, H e I.
 * Não implementa regras de negócio, XML, SOAP, TISS, Workflow,
 * Integração, compensações reais, persistência, filas ou execução distribuída.
 */
import { GenericBusinessEngine } from "../../business-engine/generic-business-engine";
import { GenericIntegrationEngine } from "../../integration-engine/generic-integration-engine";
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../command";
import { EnterpriseOrchestrationEngine } from "../orchestration";
import type { EnterpriseMasterOrchestrationCapabilities } from "../ports/capabilities";
import { J03_ENTERPRISE_SAGA_CAPABILITIES } from "../ports/capabilities";

export class EnterpriseSagaEngine {
  constructor(
    readonly orchestration: EnterpriseOrchestrationEngine,
    readonly command: EnterpriseCommandEngine,
    readonly business: GenericBusinessEngine,
    readonly integration: GenericIntegrationEngine,
    readonly tiss: GenericTissEngine,
    readonly tissIntegration: GenericTissIntegrationEngine,
    readonly workflow: GenericWorkflowEngine,
  ) {}

  getCapabilities(): EnterpriseMasterOrchestrationCapabilities {
    return J03_ENTERPRISE_SAGA_CAPABILITIES;
  }
}
