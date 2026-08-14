/**
 * GovernanceRuntimePort — contrato único do Enterprise Governance Runtime (S6-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de identidade futura.
 *
 * Fluxo estrutural (S6-02):
 *   Produto → Enterprise Runtime → GovernanceRuntimePort
 *     → Adapter → Governance Runtime Store → GovernanceResult
 *
 * S6-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 */
import type {
  GovernanceRuntimeCapabilities,
  GovernanceRuntimeHealth,
  GovernanceRuntimeInfo,
  GovernanceRuntimeProviderId,
  GovernanceStatsInput,
  GovernanceStatsResult,
  CloseGovernanceJobInput,
  CloseGovernanceJobResult,
  GetGovernanceResultInput,
  GetGovernanceResultResult,
  OpenGovernanceJobInput,
  OpenGovernanceJobResult,
  RegisterGovernanceFindingInput,
  RegisterGovernanceFindingResult,
  SubmitGovernanceRequestInput,
  SubmitGovernanceRequestResult,
} from "./types";

export interface GovernanceRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: GovernanceRuntimeProviderId;

  // -------------------------------------------------------------------------
  // S6-02 — operações estruturais canônicas (nunca executam identidade real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de identidade. NÃO inicia motor de identidade. */
  openJob(input: OpenGovernanceJobInput): Promise<OpenGovernanceJobResult>;

  /** Fecha job estrutural de identidade. NÃO interrompe motor (não há). */
  closeJob(input: CloseGovernanceJobInput): Promise<CloseGovernanceJobResult>;

  /** Cria GovernanceRequest estrutural dentro de um job. NÃO dispara identidade. */
  submitRequest(input: SubmitGovernanceRequestInput): Promise<SubmitGovernanceRequestResult>;

  /** Registra GovernanceFinding estrutural. NÃO executa regras/motor. */
  registerFinding(input: RegisterGovernanceFindingInput): Promise<RegisterGovernanceFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa identidade. */
  getResult(input: GetGovernanceResultInput): Promise<GetGovernanceResultResult>;

  /** Estatísticas estruturais do store in-memory (S6-02). */
  stats(input?: GovernanceStatsInput): Promise<GovernanceStatsResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<GovernanceRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): GovernanceRuntimeCapabilities;

  /** Metadados agregados do provedor (S6-02). */
  providerInfo(): GovernanceRuntimeInfo;
}
