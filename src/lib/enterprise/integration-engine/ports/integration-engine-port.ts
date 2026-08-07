/**
 * IntegrationEnginePort — contrato único da Enterprise Integration Engine.
 *
 * F-01: Integration Registry (`integrationRegistryImplemented = true`).
 * Demais capabilities permanecem false.
 */
import type {
  FindIntegrationInput,
  FindIntegrationResult,
  GetIntegrationRegistryStatsInput,
  GetIntegrationRegistryStatsResult,
  IntegrationEngineHealth,
  IntegrationEngineInfo,
  ListIntegrationsInput,
  ListIntegrationsResult,
  RegisterIntegrationInput,
  RegisterIntegrationResult,
} from "./types";
import type { IntegrationEngineCapabilities } from "./capabilities";

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
}
