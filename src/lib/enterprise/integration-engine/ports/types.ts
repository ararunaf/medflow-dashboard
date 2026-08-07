/**
 * Tipos públicos do Bloco F — Enterprise Integration Engine.
 */
import type {
  CanonicalIntegration,
  CanonicalIntegrationRegistryResult,
  CanonicalIntegrationRegistryStats,
} from "./canonical";

export type {
  CanonicalIntegration,
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
