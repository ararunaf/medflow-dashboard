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
  CanonicalIntegrationRouting,
  CanonicalIntegrationRoutingResult,
  CanonicalIntegrationRoutingStats,
  CanonicalIntegrationTransformation,
  CanonicalIntegrationTransformationResult,
  CanonicalIntegrationTransformationStats,
  CanonicalIntegrationValidation,
  CanonicalIntegrationValidationResult,
  CanonicalIntegrationValidationStats,
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
  CanonicalIntegrationRouting,
  CanonicalIntegrationRoutingResult,
  CanonicalIntegrationRoutingStats,
  CanonicalIntegrationTransformation,
  CanonicalIntegrationTransformationResult,
  CanonicalIntegrationTransformationStats,
  CanonicalIntegrationValidation,
  CanonicalIntegrationValidationResult,
  CanonicalIntegrationValidationStats,
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
  readonly integrationTransformationOk: boolean;
  readonly integrationValidationOk: boolean;
  readonly integrationRoutingOk: boolean;
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

export interface RegisterIntegrationTransformationInput {
  readonly transformation: CanonicalIntegrationTransformation;
}

export type RegisterIntegrationTransformationResult = CanonicalIntegrationTransformationResult;

export interface FindIntegrationTransformationInput {
  readonly transformationId: string;
}

export type FindIntegrationTransformationResult = CanonicalIntegrationTransformation | null;

export interface ListIntegrationTransformationsInput {
  readonly integrationId?: string;
  readonly pipelineId?: string;
  readonly connectorId?: string;
  readonly mappingId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationTransformationsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly transformations: readonly CanonicalIntegrationTransformation[];
  readonly total: number;
}

export interface GetIntegrationTransformationStatsInput {
  readonly integrationId?: string;
  readonly pipelineId?: string;
  readonly connectorId?: string;
  readonly mappingId?: string;
}

export interface GetIntegrationTransformationStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationTransformationStats;
}

export interface RegisterIntegrationValidationInput {
  readonly validation: CanonicalIntegrationValidation;
}

export type RegisterIntegrationValidationResult = CanonicalIntegrationValidationResult;

export interface FindIntegrationValidationInput {
  readonly validationId: string;
}

export type FindIntegrationValidationResult = CanonicalIntegrationValidation | null;

export interface ListIntegrationValidationsInput {
  readonly integrationId?: string;
  readonly connectorId?: string;
  readonly pipelineId?: string;
  readonly mappingId?: string;
  readonly transformationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationValidationsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly validations: readonly CanonicalIntegrationValidation[];
  readonly total: number;
}

export interface GetIntegrationValidationStatsInput {
  readonly integrationId?: string;
  readonly connectorId?: string;
  readonly pipelineId?: string;
  readonly mappingId?: string;
  readonly transformationId?: string;
}

export interface GetIntegrationValidationStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationValidationStats;
}

export interface RegisterIntegrationRoutingInput {
  readonly routing: CanonicalIntegrationRouting;
}

export type RegisterIntegrationRoutingResult = CanonicalIntegrationRoutingResult;

export interface FindIntegrationRoutingInput {
  readonly routeId: string;
}

export type FindIntegrationRoutingResult = CanonicalIntegrationRouting | null;

export interface ResolveIntegrationRoutingInput {
  readonly integrationId: string;
}

export interface ResolveIntegrationRoutingResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly route: CanonicalIntegrationRouting | null;
}

export interface ListIntegrationRoutingsInput {
  readonly integrationId?: string;
  readonly connectorId?: string;
  readonly pipelineId?: string;
  readonly mappingId?: string;
  readonly transformationId?: string;
  readonly validationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListIntegrationRoutingsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly routings: readonly CanonicalIntegrationRouting[];
  readonly total: number;
}

export interface GetIntegrationRoutingStatsInput {
  readonly integrationId?: string;
  readonly connectorId?: string;
  readonly pipelineId?: string;
  readonly mappingId?: string;
  readonly transformationId?: string;
  readonly validationId?: string;
}

export interface GetIntegrationRoutingStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalIntegrationRoutingStats;
}
