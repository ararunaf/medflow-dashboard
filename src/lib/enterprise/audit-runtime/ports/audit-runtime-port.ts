/**
 * AuditRuntimePort — contrato único do Enterprise Audit Runtime (F3-CAP-10).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de auditoria futura.
 *
 * Fluxo estrutural (F3-CAP-10):
 *   Produto → Enterprise Runtime → AuditRuntimePort
 *     → Adapter → Audit Runtime Store → AuditResult
 *
 * F3-CAP-10: infraestrutura canônica estrutural apenas. Sem auditoria real.
 * Sem IA. Sem OpenAI. Sem Azure OpenAI. Sem Gemini. Sem Claude. Sem ML.
 * Sem regras TISS. Sem regras de operadoras. Sem justificativas automáticas.
 * Sem correções automáticas. Sem aprovação/rejeição automática.
 * Sem persistência. Sem banco. Sem APIs.
 */
import type {
  AuditRuntimeCapabilities,
  AuditRuntimeHealth,
  AuditRuntimeInfo,
  AuditRuntimeProviderId,
  AuditStatsInput,
  AuditStatsResult,
  CloseAuditJobInput,
  CloseAuditJobResult,
  GetAuditResultInput,
  GetAuditResultResult,
  OpenAuditJobInput,
  OpenAuditJobResult,
  RegisterAuditFindingInput,
  RegisterAuditFindingResult,
  SubmitAuditRequestInput,
  SubmitAuditRequestResult,
} from "./types";

export interface AuditRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AuditRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-10 — operações estruturais canônicas (nunca executam auditoria real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de auditoria. NÃO inicia auditoria. NÃO chama IA. */
  openJob(input: OpenAuditJobInput): Promise<OpenAuditJobResult>;

  /** Fecha job estrutural de auditoria. NÃO interrompe motor (não há). */
  closeJob(input: CloseAuditJobInput): Promise<CloseAuditJobResult>;

  /** Cria AuditRequest estrutural dentro de um job. NÃO dispara auditoria. */
  submitRequest(input: SubmitAuditRequestInput): Promise<SubmitAuditRequestResult>;

  /** Registra AuditFinding estrutural. NÃO executa regras/IA. */
  registerFinding(input: RegisterAuditFindingInput): Promise<RegisterAuditFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa auditoria. */
  getResult(input: GetAuditResultInput): Promise<GetAuditResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-10). */
  stats(input?: AuditStatsInput): Promise<AuditStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<AuditRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AuditRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-10). */
  providerInfo(): AuditRuntimeInfo;
}
