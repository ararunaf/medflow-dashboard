/**
 * IdentityRuntimePort — contrato único do Enterprise Identity Runtime (S2-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de identidade futura.
 *
 * Fluxo estrutural (S2-02):
 *   Produto → Enterprise Runtime → IdentityRuntimePort
 *     → Adapter → Identity Runtime Store → IdentityResult
 *
 * S2-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 */
import type {
  IdentityRuntimeCapabilities,
  IdentityRuntimeHealth,
  IdentityRuntimeInfo,
  IdentityRuntimeProviderId,
  IdentityStatsInput,
  IdentityStatsResult,
  CloseIdentityJobInput,
  CloseIdentityJobResult,
  GetIdentityResultInput,
  GetIdentityResultResult,
  OpenIdentityJobInput,
  OpenIdentityJobResult,
  RegisterIdentityFindingInput,
  RegisterIdentityFindingResult,
  SubmitIdentityRequestInput,
  SubmitIdentityRequestResult,
} from "./types";

export interface IdentityRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: IdentityRuntimeProviderId;

  // -------------------------------------------------------------------------
  // S2-02 — operações estruturais canônicas (nunca executam identidade real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de identidade. NÃO inicia motor de identidade. */
  openJob(input: OpenIdentityJobInput): Promise<OpenIdentityJobResult>;

  /** Fecha job estrutural de identidade. NÃO interrompe motor (não há). */
  closeJob(input: CloseIdentityJobInput): Promise<CloseIdentityJobResult>;

  /** Cria IdentityRequest estrutural dentro de um job. NÃO dispara identidade. */
  submitRequest(input: SubmitIdentityRequestInput): Promise<SubmitIdentityRequestResult>;

  /** Registra IdentityFinding estrutural. NÃO executa regras/motor. */
  registerFinding(input: RegisterIdentityFindingInput): Promise<RegisterIdentityFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa identidade. */
  getResult(input: GetIdentityResultInput): Promise<GetIdentityResultResult>;

  /** Estatísticas estruturais do store in-memory (S2-02). */
  stats(input?: IdentityStatsInput): Promise<IdentityStatsResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<IdentityRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): IdentityRuntimeCapabilities;

  /** Metadados agregados do provedor (S2-02). */
  providerInfo(): IdentityRuntimeInfo;
}
