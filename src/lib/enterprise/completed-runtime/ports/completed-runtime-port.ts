/**
 * CompletedRuntimePort — contrato único do Enterprise Completed Runtime (A10-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / findings de completedoria futura.
 *
 * Fluxo estrutural (A10-02):
 *   Produto → Enterprise Runtime → CompletedRuntimePort
 *     → Adapter → Completed Runtime Store → CompletedResult
 *
 * A10-02: infraestrutura canônica estrutural apenas. Sem completedoria real.
 * Sem IA. Sem OpenAI. Sem Azure OpenAI. Sem Gemini. Sem Claude. Sem ML.
 * Sem regras TISS. Sem regras de operadoras. Sem justificativas automáticas.
 * Sem correções automáticas. Sem aprovação/rejeição automática.
 * Sem persistência. Sem banco. Sem APIs.
 */
import type {
  CompletedRuntimeCapabilities,
  CompletedRuntimeHealth,
  CompletedRuntimeInfo,
  CompletedRuntimeProviderId,
  CompletedStatsInput,
  CompletedStatsResult,
  CloseCompletedJobInput,
  CloseCompletedJobResult,
  GetCompletedResultInput,
  GetCompletedResultResult,
  OpenCompletedJobInput,
  OpenCompletedJobResult,
  RegisterCompletedFindingInput,
  RegisterCompletedFindingResult,
  SubmitCompletedRequestInput,
  SubmitCompletedRequestResult,
} from "./types";

export interface CompletedRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: CompletedRuntimeProviderId;

  // -------------------------------------------------------------------------
  // A10-02 — operações estruturais canônicas (nunca executam completedoria real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de completedoria. NÃO inicia completedoria. NÃO chama IA. */
  openJob(input: OpenCompletedJobInput): Promise<OpenCompletedJobResult>;

  /** Fecha job estrutural de completedoria. NÃO interrompe motor (não há). */
  closeJob(input: CloseCompletedJobInput): Promise<CloseCompletedJobResult>;

  /** Cria CompletedRequest estrutural dentro de um job. NÃO dispara completedoria. */
  submitRequest(input: SubmitCompletedRequestInput): Promise<SubmitCompletedRequestResult>;

  /** Registra CompletedFinding estrutural. NÃO executa regras/IA. */
  registerFinding(input: RegisterCompletedFindingInput): Promise<RegisterCompletedFindingResult>;

  /** Obtém resultado estrutural por job/request/finding. NÃO executa completedoria. */
  getResult(input: GetCompletedResultInput): Promise<GetCompletedResultResult>;

  /** Estatísticas estruturais do store in-memory (A10-02). */
  stats(input?: CompletedStatsInput): Promise<CompletedStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<CompletedRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): CompletedRuntimeCapabilities;

  /** Metadados agregados do provedor (A10-02). */
  providerInfo(): CompletedRuntimeInfo;
}
