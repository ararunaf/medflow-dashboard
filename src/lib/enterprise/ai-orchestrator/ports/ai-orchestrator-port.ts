/**
 * AIOrchestratorPort — contrato único do AI Orchestrator (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou AI Provider Framework ficam nos adapters.
 *
 * EPC-16: fundação de orquestração. NÃO implementa IA real, HTTP, prompts,
 * auditoria, OCR, contratos, TISS ou Rule Engine.
 *
 * O Orchestrator conversa APENAS com o AI Provider Framework (EPC-07).
 */
import type {
  AIOrchestrationRequest,
  AIOrchestrationResult,
  AIOrchestratorCapabilities,
  AIOrchestratorHealth,
  AIOrchestratorProviderId,
  GetProviderInput,
  GetProviderResult,
  ListAvailableProvidersInput,
  ListAvailableProvidersResult,
} from "./types";

export interface AIOrchestratorPort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: AIOrchestratorProviderId;

  /**
   * Seleciona o Provider de IA mais adequado para a solicitação.
   * NÃO executa IA. NÃO chama HTTP. NÃO invoca AIProviderPort.invoke().
   */
  selectProvider(request: AIOrchestrationRequest): Promise<AIOrchestrationResult>;

  /** Obtém o registro de um Provider via Registry EPC-07. */
  getProvider(input: GetProviderInput): Promise<GetProviderResult>;

  /** Lista Providers disponíveis no Registry EPC-07. */
  listAvailableProviders(
    input?: ListAvailableProvidersInput,
  ): Promise<ListAvailableProvidersResult>;

  /** Verificação leve de prontidão (sem I/O externo). */
  health(): Promise<AIOrchestratorHealth>;

  /** Capacidades estáticas do Orchestrator adapter ativo. */
  capabilities(): AIOrchestratorCapabilities;
}
