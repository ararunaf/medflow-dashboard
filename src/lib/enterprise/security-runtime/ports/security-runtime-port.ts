/**
 * SecurityRuntimePort — contrato único do Enterprise Security Runtime (S1-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de segurança futura.
 *
 * Fluxo estrutural (S1-02):
 *   Produto → Enterprise Runtime → SecurityRuntimePort
 *     → Adapter → Security Runtime Store → SecurityResult
 *
 * S1-02: infraestrutura canônica estrutural apenas. Sem segurança real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 */
import type {
  SecurityRuntimeCapabilities,
  SecurityRuntimeHealth,
  SecurityRuntimeInfo,
  SecurityRuntimeProviderId,
  SecurityStatsInput,
  SecurityStatsResult,
  CloseSecurityJobInput,
  CloseSecurityJobResult,
  GetSecurityResultInput,
  GetSecurityResultResult,
  OpenSecurityJobInput,
  OpenSecurityJobResult,
  RegisterSecurityFindingInput,
  RegisterSecurityFindingResult,
  SubmitSecurityRequestInput,
  SubmitSecurityRequestResult,
} from "./types";

export interface SecurityRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: SecurityRuntimeProviderId;

  // -------------------------------------------------------------------------
  // S1-02 — operações estruturais canônicas (nunca executam segurança real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de segurança. NÃO inicia motor de segurança. */
  openJob(input: OpenSecurityJobInput): Promise<OpenSecurityJobResult>;

  /** Fecha job estrutural de segurança. NÃO interrompe motor (não há). */
  closeJob(input: CloseSecurityJobInput): Promise<CloseSecurityJobResult>;

  /** Cria SecurityRequest estrutural dentro de um job. NÃO dispara segurança. */
  submitRequest(input: SubmitSecurityRequestInput): Promise<SubmitSecurityRequestResult>;

  /** Registra SecurityFinding estrutural. NÃO executa regras/motor. */
  registerFinding(input: RegisterSecurityFindingInput): Promise<RegisterSecurityFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa segurança. */
  getResult(input: GetSecurityResultInput): Promise<GetSecurityResultResult>;

  /** Estatísticas estruturais do store in-memory (S1-02). */
  stats(input?: SecurityStatsInput): Promise<SecurityStatsResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<SecurityRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): SecurityRuntimeCapabilities;

  /** Metadados agregados do provedor (S1-02). */
  providerInfo(): SecurityRuntimeInfo;
}
