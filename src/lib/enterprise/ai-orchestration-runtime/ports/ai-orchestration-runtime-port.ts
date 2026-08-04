/**
 * AIOrchestrationRuntimePort — contrato único do Enterprise AI Orchestration
 * Runtime (F3-CAP-09).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / tasks de IA futura.
 *
 * Fluxo estrutural (F3-CAP-09):
 *   Produto → Enterprise Runtime → AIOrchestrationRuntimePort
 *     → Adapter → AI Orchestration Runtime Store → AIExecutionResult
 *
 * F3-CAP-09: infraestrutura canônica estrutural apenas. Sem IA real.
 * Sem OpenAI. Sem Azure OpenAI. Sem Gemini. Sem Claude. Sem Ollama.
 * Sem Llama. Sem ML. Sem Prompt Engineering. Sem HTTP. Sem agentes
 * funcionais. Sem workflow. Sem decisão automática. Sem persistência.
 */
import type {
  AIOrchestrationRuntimeCapabilities,
  AIOrchestrationRuntimeHealth,
  AIOrchestrationRuntimeInfo,
  AIOrchestrationRuntimeProviderId,
  AIOrchestrationStatsInput,
  AIOrchestrationStatsResult,
  CloseAIOrchestrationJobInput,
  CloseAIOrchestrationJobResult,
  GetAIResultInput,
  GetAIResultResult,
  OpenAIOrchestrationJobInput,
  OpenAIOrchestrationJobResult,
  RegisterAITaskInput,
  RegisterAITaskResult,
  SubmitAIRequestInput,
  SubmitAIRequestResult,
} from "./types";

export interface AIOrchestrationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AIOrchestrationRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-09 — operações estruturais canônicas (nunca executam IA real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de orquestração AI. NÃO inicia LLM. NÃO chama HTTP. */
  openJob(input: OpenAIOrchestrationJobInput): Promise<OpenAIOrchestrationJobResult>;

  /** Fecha job estrutural de orquestração AI. NÃO interrompe LLM (não há). */
  closeJob(input: CloseAIOrchestrationJobInput): Promise<CloseAIOrchestrationJobResult>;

  /** Cria AIRequest estrutural dentro de um job. NÃO dispara prompt/LLM. */
  submitRequest(input: SubmitAIRequestInput): Promise<SubmitAIRequestResult>;

  /** Registra AITask estrutural. NÃO executa agente. */
  registerTask(input: RegisterAITaskInput): Promise<RegisterAITaskResult>;

  /** Obtém resultado estrutural por job/request/task. NÃO executa IA. */
  getResult(input: GetAIResultInput): Promise<GetAIResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-09). */
  stats(input?: AIOrchestrationStatsInput): Promise<AIOrchestrationStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<AIOrchestrationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AIOrchestrationRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-09). */
  providerInfo(): AIOrchestrationRuntimeInfo;
}
