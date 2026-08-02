/**
 * TISSProviderPort — contrato único TISS (TISS-01).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface.
 * Detalhes de XML / operadora / contrato ficam exclusivamente em adapters futuros
 * via Rule Packs / Profiles / Metadata / Configuração — nunca no Core.
 *
 * TISS-01: infraestrutura oficial (sem XML real / sem envio a operadoras).
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSProviderPort → DefaultTISSProviderAdapter → Implementação oficial
 */
import type {
  TISSProviderConfigurationValidation,
  TISSProviderHealth,
  TISSProviderId,
  TISSProviderInfo,
  TISSProviderPortCapabilities,
  TISSProcessInput,
  TISSProviderOperationResult,
} from "./types";

export interface TISSProviderPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: TISSProviderId;

  /**
   * Processa pedido canônico TISS (estrutural na TISS-01).
   * Retorna CanonicalTISSResult (sem modelos paralelos).
   */
  process(input: TISSProcessInput): Promise<TISSProviderOperationResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<TISSProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TISSProviderPortCapabilities;

  /** Metadados estáveis do provedor. */
  providerInfo(): TISSProviderInfo;

  /**
   * Valida configuração estrutural do adapter.
   * NÃO realiza XML / envio a operadoras / validações ANS.
   */
  validateConfiguration(): Promise<TISSProviderConfigurationValidation>;
}
