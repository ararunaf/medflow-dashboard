/**
 * OperatorRuntimePort — contrato único do Enterprise Operator Runtime (C-04).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de OperatorCapabilityProfile.
 *
 * Fluxo estrutural (C-04):
 *   Produto → Enterprise Runtime → OperatorRuntimePort
 *     → Adapter → Operator Runtime Store → OperatorCapabilityProfile
 *
 * C-04: infraestrutura canônica estrutural apenas. Sem operadoras reais.
 * Sem lógica condicional por operadora. Sem autenticação. Sem SOAP/XML/REST
 * funcional. Sem banco. Sem persistência. Sem APIs.
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7).
 */
import type {
  GetOperatorProfileInput,
  GetOperatorProfileResult,
  ListOperatorProfilesInput,
  ListOperatorProfilesResult,
  OperatorRuntimeCapabilities,
  OperatorRuntimeHealth,
  OperatorRuntimeInfo,
  OperatorRuntimeProviderId,
  OperatorStatsInput,
  OperatorStatsResult,
  PrepareOperatorProfileInput,
  PrepareOperatorProfileResult,
} from "./types";

export interface OperatorRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: OperatorRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de OperatorCapabilityProfile.
   * NÃO resolve operadora real. NÃO autentica. NÃO comunica.
   * Sempre realOperatorResolved = false e communicationExecuted = false.
   * Sempre runtimeReady = true.
   */
  prepareProfile(input: PrepareOperatorProfileInput): Promise<PrepareOperatorProfileResult>;

  /** Obtém perfil/resposta estrutural por responseId ou profileId. */
  getProfile(input: GetOperatorProfileInput): Promise<GetOperatorProfileResult>;

  /** Lista perfis/respostas estruturais do store in-memory. */
  listProfiles(input?: ListOperatorProfilesInput): Promise<ListOperatorProfilesResult>;

  /** Estatísticas estruturais do store in-memory (C-04). */
  stats(input?: OperatorStatsInput): Promise<OperatorStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<OperatorRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): OperatorRuntimeCapabilities;

  /** Metadados agregados do provedor (C-04). */
  providerInfo(): OperatorRuntimeInfo;
}
