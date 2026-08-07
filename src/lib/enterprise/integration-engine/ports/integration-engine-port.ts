/**
 * IntegrationEnginePort — contrato único da Enterprise Integration Engine.
 *
 * F-01: Integration Registry.
 * F-02: Integration Connector.
 * F-03: Integration Pipeline.
 * F-04: Integration Mapping.
 * Demais capabilities permanecem false.
 */
import type { IntegrationEngineCapabilities } from "./capabilities";
import type {
  FindIntegrationConnectorInput,
  FindIntegrationConnectorResult,
  FindIntegrationInput,
  FindIntegrationMappingInput,
  FindIntegrationMappingResult,
  FindIntegrationPipelineInput,
  FindIntegrationPipelineResult,
  FindIntegrationResult,
  GetIntegrationConnectorStatsInput,
  GetIntegrationConnectorStatsResult,
  GetIntegrationMappingStatsInput,
  GetIntegrationMappingStatsResult,
  GetIntegrationPipelineStatsInput,
  GetIntegrationPipelineStatsResult,
  GetIntegrationRegistryStatsInput,
  GetIntegrationRegistryStatsResult,
  IntegrationEngineHealth,
  IntegrationEngineInfo,
  ListIntegrationConnectorsInput,
  ListIntegrationConnectorsResult,
  ListIntegrationMappingsInput,
  ListIntegrationMappingsResult,
  ListIntegrationPipelinesInput,
  ListIntegrationPipelinesResult,
  ListIntegrationsInput,
  ListIntegrationsResult,
  RegisterIntegrationConnectorInput,
  RegisterIntegrationConnectorResult,
  RegisterIntegrationInput,
  RegisterIntegrationMappingInput,
  RegisterIntegrationMappingResult,
  RegisterIntegrationPipelineInput,
  RegisterIntegrationPipelineResult,
  RegisterIntegrationResult,
} from "./types";

export interface IntegrationEnginePort {
  readonly providerId: string;

  /** Identidade canônica do Port. */
  identity(): IntegrationEngineInfo;

  /** Capabilities atuais. */
  getCapabilities(): IntegrationEngineCapabilities;

  /** Health do runtime. */
  health(): Promise<IntegrationEngineHealth>;

  /** F-01 — registra uma integração no catálogo. */
  registerIntegration(input: RegisterIntegrationInput): Promise<RegisterIntegrationResult>;

  /** F-01 — encontra integração por integrationId. */
  findIntegration(input: FindIntegrationInput): Promise<FindIntegrationResult>;

  /** F-01 — lista integrações, opcionalmente filtradas por categoria. */
  listIntegrations(input: ListIntegrationsInput): Promise<ListIntegrationsResult>;

  /** F-01 — estatísticas do catálogo de integrações. */
  getIntegrationRegistryStats(
    input?: GetIntegrationRegistryStatsInput,
  ): Promise<GetIntegrationRegistryStatsResult>;

  /** F-02 — registra um conector. */
  registerIntegrationConnector(
    input: RegisterIntegrationConnectorInput,
  ): Promise<RegisterIntegrationConnectorResult>;

  /** F-02 — encontra conector por connectorId. */
  findIntegrationConnector(
    input: FindIntegrationConnectorInput,
  ): Promise<FindIntegrationConnectorResult>;

  /** F-02 — lista conectores, opcionalmente filtrados por integrationId. */
  listIntegrationConnectors(
    input: ListIntegrationConnectorsInput,
  ): Promise<ListIntegrationConnectorsResult>;

  /** F-02 — estatísticas do catálogo de conectores. */
  getIntegrationConnectorStats(
    input?: GetIntegrationConnectorStatsInput,
  ): Promise<GetIntegrationConnectorStatsResult>;

  /** F-03 — registra um pipeline de integração. */
  registerIntegrationPipeline(
    input: RegisterIntegrationPipelineInput,
  ): Promise<RegisterIntegrationPipelineResult>;

  /** F-03 — encontra pipeline por pipelineId. */
  findIntegrationPipeline(
    input: FindIntegrationPipelineInput,
  ): Promise<FindIntegrationPipelineResult>;

  /** F-03 — lista pipelines, opcionalmente filtrados por integrationId. */
  listIntegrationPipelines(
    input: ListIntegrationPipelinesInput,
  ): Promise<ListIntegrationPipelinesResult>;

  /** F-03 — estatísticas do catálogo de pipelines. */
  getIntegrationPipelineStats(
    input?: GetIntegrationPipelineStatsInput,
  ): Promise<GetIntegrationPipelineStatsResult>;

  /** F-04 — registra um mapping. */
  registerIntegrationMapping(
    input: RegisterIntegrationMappingInput,
  ): Promise<RegisterIntegrationMappingResult>;

  /** F-04 — encontra mapping por mappingId. */
  findIntegrationMapping(input: FindIntegrationMappingInput): Promise<FindIntegrationMappingResult>;

  /** F-04 — lista mappings, opcionalmente filtrados. */
  listIntegrationMappings(
    input: ListIntegrationMappingsInput,
  ): Promise<ListIntegrationMappingsResult>;

  /** F-04 — estatísticas do catálogo de mappings. */
  getIntegrationMappingStats(
    input?: GetIntegrationMappingStatsInput,
  ): Promise<GetIntegrationMappingStatsResult>;
}
