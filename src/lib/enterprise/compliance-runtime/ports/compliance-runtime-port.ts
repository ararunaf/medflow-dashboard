/**
 * ComplianceRuntimePort — contrato único do Enterprise Compliance Runtime (S3-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de identidade futura.
 *
 * Fluxo estrutural (S3-02):
 *   Produto → Enterprise Runtime → ComplianceRuntimePort
 *     → Adapter → Compliance Runtime Store → ComplianceResult
 *
 * S3-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 */
import type {
  ComplianceRuntimeCapabilities,
  ComplianceRuntimeHealth,
  ComplianceRuntimeInfo,
  ComplianceRuntimeProviderId,
  ComplianceStatsInput,
  ComplianceStatsResult,
  CloseComplianceJobInput,
  CloseComplianceJobResult,
  GetComplianceResultInput,
  GetComplianceResultResult,
  OpenComplianceJobInput,
  OpenComplianceJobResult,
  RegisterComplianceFindingInput,
  RegisterComplianceFindingResult,
  SubmitComplianceRequestInput,
  SubmitComplianceRequestResult,
} from "./types";

export interface ComplianceRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ComplianceRuntimeProviderId;

  // -------------------------------------------------------------------------
  // S3-02 — operações estruturais canônicas (nunca executam identidade real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de identidade. NÃO inicia motor de identidade. */
  openJob(input: OpenComplianceJobInput): Promise<OpenComplianceJobResult>;

  /** Fecha job estrutural de identidade. NÃO interrompe motor (não há). */
  closeJob(input: CloseComplianceJobInput): Promise<CloseComplianceJobResult>;

  /** Cria ComplianceRequest estrutural dentro de um job. NÃO dispara identidade. */
  submitRequest(input: SubmitComplianceRequestInput): Promise<SubmitComplianceRequestResult>;

  /** Registra ComplianceFinding estrutural. NÃO executa regras/motor. */
  registerFinding(input: RegisterComplianceFindingInput): Promise<RegisterComplianceFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa identidade. */
  getResult(input: GetComplianceResultInput): Promise<GetComplianceResultResult>;

  /** Estatísticas estruturais do store in-memory (S3-02). */
  stats(input?: ComplianceStatsInput): Promise<ComplianceStatsResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<ComplianceRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ComplianceRuntimeCapabilities;

  /** Metadados agregados do provedor (S3-02). */
  providerInfo(): ComplianceRuntimeInfo;
}
