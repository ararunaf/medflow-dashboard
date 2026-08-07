/**
 * Tipos públicos do Bloco F — Enterprise Integration Engine.
 */
import type {
  CanonicalIntegration,
  CanonicalIntegrationConnector,
  CanonicalIntegrationConnectorResult,
  CanonicalIntegrationConnectorStats,
  CanonicalIntegrationMapping,
  CanonicalIntegrationMappingResult,
  CanonicalIntegrationMappingStats,
  CanonicalIntegrationPipeline,
  CanonicalIntegrationPipelineResult,
  CanonicalIntegrationPipelineStats,
  CanonicalIntegrationRegistryResult,
  CanonicalIntegrationRegistryStats,
} from "./canonical";

export type {
  CanonicalIntegration,
  CanonicalIntegrationConnector,
  CanonicalIntegrationConnectorResult,
  CanonicalIntegrationConnectorStats,
  CanonicalIntegrationMapping,
  CanonicalIntegrationMappingResult,
  CanonicalIntegrationMappingStats,
  CanonicalIntegrationPipeline,
  CanonicalIntegrationPipelineResult,
  CanonicalIntegrationPipelineStats,
  CanonicalIntegrationRegistryResult,
  CanonicalIntegrationRegistryStats,
};

export interface IntegrationEngineInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly vendor: string;
  readonly provider: string;
}

export interface IntegrationEngineHealth {
  readonly ok: boolean;
  readonly integrationEngineOk: boolean;
  readonly integrationRegistryOk: boolean;
  readonly integrationConnectorOk: boolean;
  readonly integrationPipelineOk: boolean;
  readonly integrationMappingOk: boolean;
}

export interface RegisterIntegrationInput {
  readonly integration: CanonicalIntegration;
}

export type RegisterIntegrationResult = CanonicalIntegrationRegistryResult;

export interface FindIntegrationInput {
  readonly integrationId: string;
}

export type FindIntegrationResult = CanonicalIntegration | null;

export interface ListIntegrationsInput {
  readonly category?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly integrations: readonly CanonicalIntegration[];
  readonly total: number;
}

export interface GetIntegrationRegistryStatsInput {
  readonly category?: string;
}

export interface GetIntegrationRegistryStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationRegistryStats;
}

export interface RegisterIntegrationConnectorInput {
  readonly connector: CanonicalIntegrationConnector;
}

export type RegisterIntegrationConnectorResult = CanonicalIntegrationConnectorResult;

export interface FindIntegrationConnectorInput {
  readonly connectorId: string;
}

export type FindIntegrationConnectorResult = CanonicalIntegrationConnector | null;

export interface ListIntegrationConnectorsInput {
  readonly integrationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationConnectorsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly connectors: readonly CanonicalIntegrationConnector[];
  readonly total: number;
}

export interface GetIntegrationConnectorStatsInput {
  readonly integrationId?: string;
}

export interface GetIntegrationConnectorStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationConnectorStats;
}

export interface RegisterIntegrationPipelineInput {
  readonly pipeline: CanonicalIntegrationPipeline;
}

export type RegisterIntegrationPipelineResult = CanonicalIntegrationPipelineResult;

export interface FindIntegrationPipelineInput {
  readonly pipelineId: string;
}

export type FindIntegrationPipelineResult = CanonicalIntegrationPipeline | null;

export interface ListIntegrationPipelinesInput {
  readonly integrationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationPipelinesResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly pipelines: readonly CanonicalIntegrationPipeline[];
  readonly total: number;
}

export interface GetIntegrationPipelineStatsInput {
  readonly integrationId?: string;
}

export interface GetIntegrationPipelineStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationPipelineStats;
}

export interface RegisterIntegrationMappingInput {
  readonly mapping: CanonicalIntegrationMapping;
}

export type RegisterIntegrationMappingResult = CanonicalIntegrationMappingResult;

export interface FindIntegrationMappingInput {
  readonly mappingId: string;
}

export type FindIntegrationMappingResult = CanonicalIntegrationMapping | null;

export interface ListIntegrationMappingsInput {
  readonly integrationId?: string;
  readonly pipelineId?: string;
  readonly connectorId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationMappingsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly mappings: readonly CanonicalIntegrationMapping[];
  readonly total: number;
}

export interface GetIntegrationMappingStatsInput {
  readonly integrationId?: string;
  readonly pipelineId?: string;
  readonly connectorId?: string;
}

export interface GetIntegrationMappingStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationMappingStats;
}
