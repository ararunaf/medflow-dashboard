/**
 * AuthorizationRuntimePort — contrato único do Enterprise Authorization Runtime (S3-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de identidade futura.
 *
 * Fluxo estrutural (S3-02):
 *   Produto → Enterprise Runtime → AuthorizationRuntimePort
 *     → Adapter → Authorization Runtime Store → AuthorizationResult
 *
 * S3-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 */
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeProviderId,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  CloseAuthorizationJobInput,
  CloseAuthorizationJobResult,
  GetAuthorizationResultInput,
  GetAuthorizationResultResult,
  OpenAuthorizationJobInput,
  OpenAuthorizationJobResult,
  RegisterAuthorizationFindingInput,
  RegisterAuthorizationFindingResult,
  SubmitAuthorizationRequestInput,
  SubmitAuthorizationRequestResult,
} from "./types";

export interface AuthorizationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AuthorizationRuntimeProviderId;

  // -------------------------------------------------------------------------
  // S3-02 — operações estruturais canônicas (nunca executam identidade real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de identidade. NÃO inicia motor de identidade. */
  openJob(input: OpenAuthorizationJobInput): Promise<OpenAuthorizationJobResult>;

  /** Fecha job estrutural de identidade. NÃO interrompe motor (não há). */
  closeJob(input: CloseAuthorizationJobInput): Promise<CloseAuthorizationJobResult>;

  /** Cria AuthorizationRequest estrutural dentro de um job. NÃO dispara identidade. */
  submitRequest(input: SubmitAuthorizationRequestInput): Promise<SubmitAuthorizationRequestResult>;

  /** Registra AuthorizationFinding estrutural. NÃO executa regras/motor. */
  registerFinding(
    input: RegisterAuthorizationFindingInput,
  ): Promise<RegisterAuthorizationFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa identidade. */
  getResult(input: GetAuthorizationResultInput): Promise<GetAuthorizationResultResult>;

  /** Estatísticas estruturais do store in-memory (S3-02). */
  stats(input?: AuthorizationStatsInput): Promise<AuthorizationStatsResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<AuthorizationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AuthorizationRuntimeCapabilities;

  /** Metadados agregados do provedor (S3-02). */
  providerInfo(): AuthorizationRuntimeInfo;
}
