/**
 * TenantRuntimePort — contrato único do Enterprise Tenant Runtime (S3-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de identidade futura.
 *
 * Fluxo estrutural (S3-02):
 *   Produto → Enterprise Runtime → TenantRuntimePort
 *     → Adapter → Tenant Runtime Store → TenantResult
 *
 * S3-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 */
import type {
  TenantRuntimeCapabilities,
  TenantRuntimeHealth,
  TenantRuntimeInfo,
  TenantRuntimeProviderId,
  TenantStatsInput,
  TenantStatsResult,
  CloseTenantJobInput,
  CloseTenantJobResult,
  GetTenantResultInput,
  GetTenantResultResult,
  OpenTenantJobInput,
  OpenTenantJobResult,
  RegisterTenantFindingInput,
  RegisterTenantFindingResult,
  SubmitTenantRequestInput,
  SubmitTenantRequestResult,
} from "./types";

export interface TenantRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: TenantRuntimeProviderId;

  // -------------------------------------------------------------------------
  // S3-02 — operações estruturais canônicas (nunca executam identidade real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de identidade. NÃO inicia motor de identidade. */
  openJob(input: OpenTenantJobInput): Promise<OpenTenantJobResult>;

  /** Fecha job estrutural de identidade. NÃO interrompe motor (não há). */
  closeJob(input: CloseTenantJobInput): Promise<CloseTenantJobResult>;

  /** Cria TenantRequest estrutural dentro de um job. NÃO dispara identidade. */
  submitRequest(input: SubmitTenantRequestInput): Promise<SubmitTenantRequestResult>;

  /** Registra TenantFinding estrutural. NÃO executa regras/motor. */
  registerFinding(input: RegisterTenantFindingInput): Promise<RegisterTenantFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa identidade. */
  getResult(input: GetTenantResultInput): Promise<GetTenantResultResult>;

  /** Estatísticas estruturais do store in-memory (S3-02). */
  stats(input?: TenantStatsInput): Promise<TenantStatsResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<TenantRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TenantRuntimeCapabilities;

  /** Metadados agregados do provedor (S3-02). */
  providerInfo(): TenantRuntimeInfo;
}
