/**
 * AuthorizationRuntimePort — contrato único do Enterprise Authorization Runtime (C-05).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de autorização por estratégias.
 *
 * Fluxo estrutural (C-05):
 *   Produto → Enterprise Runtime → AuthorizationRuntimePort
 *     → Adapter → Authorization Runtime Store → AuthorizationStrategy / AuthorizationPolicy
 *
 * C-05: infraestrutura canônica estrutural apenas. Sem autorização funcional.
 * Sem elegibilidade. Sem integração com operadoras. Sem SOAP/XML/REST
 * funcional. Sem autenticação. Sem banco. Sem persistência. Sem APIs.
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9).
 * POLICY-DRIVEN AUTHORIZATION — OperatorCapabilityProfile + AuthorizationPolicy.
 */
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeProviderId,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  GetAuthorizationInput,
  GetAuthorizationResult,
  ListAuthorizationsInput,
  ListAuthorizationsResult,
  PrepareAuthorizationInput,
  PrepareAuthorizationResult,
} from "./types";

export interface AuthorizationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AuthorizationRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de Authorization.
   * NÃO autoriza. NÃO elegibilidade. NÃO comunica com operadoras.
   * Seleciona/armazena strategy + policy estruturalmente apenas.
   * Sempre authorizationExecuted = false e communicationExecuted = false.
   * Sempre runtimeReady = true.
   */
  prepareAuthorization(input: PrepareAuthorizationInput): Promise<PrepareAuthorizationResult>;

  /** Obtém autorização/resposta estrutural por responseId, strategyId ou policyId. */
  getAuthorization(input: GetAuthorizationInput): Promise<GetAuthorizationResult>;

  /** Lista autorizações/respostas estruturais do store in-memory. */
  listAuthorizations(input?: ListAuthorizationsInput): Promise<ListAuthorizationsResult>;

  /** Estatísticas estruturais do store in-memory (C-05). */
  stats(input?: AuthorizationStatsInput): Promise<AuthorizationStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<AuthorizationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AuthorizationRuntimeCapabilities;

  /** Metadados agregados do provedor (C-05). */
  providerInfo(): AuthorizationRuntimeInfo;
}
