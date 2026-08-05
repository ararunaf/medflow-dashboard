/**
 * ProtocolRuntimePort — contrato único do Enterprise Protocol Runtime (C-07).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de Protocol Abstraction.
 *
 * Fluxo estrutural (C-07):
 *   Produto → Enterprise Runtime → ProtocolRuntimePort
 *     → Adapter → Protocol Runtime Store → ProtocolProfile / ProtocolResolver
 *
 * C-07: infraestrutura canônica estrutural apenas. Sem SOAP. Sem REST.
 * Sem gRPC. Sem mensageria. Sem HTTP. Sem TLS. Sem autenticação.
 * Sem APIs. Sem banco. Sem resolução funcional de protocolos.
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12).
 * O Runtime nunca conhece protocolos concretos. Nunca seleciona protocolos
 * diretamente. SOAP/REST/gRPC/mensageria serão apenas Adapters futuros.
 */
import type {
  GetProtocolProfileInput,
  GetProtocolProfileResult,
  ListProtocolProfilesInput,
  ListProtocolProfilesResult,
  PrepareProtocolProfileInput,
  PrepareProtocolProfileResult,
  ProtocolRuntimeCapabilities,
  ProtocolRuntimeHealth,
  ProtocolRuntimeInfo,
  ProtocolRuntimeProviderId,
  ProtocolStatsInput,
  ProtocolStatsResult,
  ResolveProtocolInput,
  ResolveProtocolResult,
} from "./types";

export interface ProtocolRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ProtocolRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de ProtocolProfile.
   * NÃO seleciona protocolo. NÃO envia. NÃO resolve funcionalmente.
   * Armazena perfil estruturalmente apenas.
   * Sempre protocolResolved = false.
   * Sempre runtimeReady = true.
   */
  prepareProfile(input: PrepareProtocolProfileInput): Promise<PrepareProtocolProfileResult>;

  /** Obtém perfil/contexto estrutural por profileId ou contextId. */
  getProfile(input: GetProtocolProfileInput): Promise<GetProtocolProfileResult>;

  /** Lista perfis estruturais do store in-memory. */
  listProfiles(input?: ListProtocolProfilesInput): Promise<ListProtocolProfilesResult>;

  /**
   * Operação estrutural de resolução (PROTOCOL RESOLUTION).
   * NÃO seleciona SOAP/REST/gRPC/mensageria.
   * NÃO implementa resolução funcional.
   * Sempre protocolResolutionImplemented = false.
   * Sempre protocolResolved = false.
   */
  resolveProtocol(input: ResolveProtocolInput): Promise<ResolveProtocolResult>;

  /** Estatísticas estruturais do store in-memory (C-07). */
  stats(input?: ProtocolStatsInput): Promise<ProtocolStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<ProtocolRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ProtocolRuntimeCapabilities;

  /** Metadados agregados do provedor (C-07). */
  providerInfo(): ProtocolRuntimeInfo;
}
