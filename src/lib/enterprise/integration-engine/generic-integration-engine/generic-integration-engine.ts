/**
 * GenericIntegrationEngine — F-10.
 *
 * Facade que expõe os engines F-01 a F-09 sem lógica própria.
 * Não executa integrações, transforma dados, valida conteúdo,
 * gera relatórios, acessa banco ou conhece domínio.
 */
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationMonitoringEngine } from "../integration-monitoring";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import { IntegrationReportEngine } from "../integration-report";
import { IntegrationRoutingEngine } from "../integration-routing";
import { IntegrationTransformationEngine } from "../integration-transformation";
import { IntegrationValidationEngine } from "../integration-validation";

export class GenericIntegrationEngine {
  constructor(
    readonly registry: IntegrationRegistryEngine,
    readonly connector: IntegrationConnectorEngine,
    readonly pipeline: IntegrationPipelineEngine,
    readonly mapping: IntegrationMappingEngine,
    readonly transformation: IntegrationTransformationEngine,
    readonly validation: IntegrationValidationEngine,
    readonly routing: IntegrationRoutingEngine,
    readonly monitoring: IntegrationMonitoringEngine,
    readonly report: IntegrationReportEngine,
  ) {}
}
