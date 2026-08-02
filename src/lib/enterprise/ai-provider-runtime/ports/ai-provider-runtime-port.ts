/**
 * AIProviderRuntimePort — contrato único do AI Provider Runtime (ARCH-02 / DIP-07).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para coordenar invocações de IA.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → AIProviderRuntimePort
 *     → Canonical Execution Orchestrator → AIProviderPort → Adapter → Provider
 *
 * NÃO permite bypass. NÃO expõe fetch/SDK de vendor ao produto.
 */
import type { AIRequest, AIResponse } from "../../ai-provider/ports/types";
import type {
  CoordinateAIInvocationInput,
  CoordinateAIInvocationResult,
  GetAIProviderRuntimeSessionInput,
  GetAIProviderRuntimeSessionResult,
  ListAIProviderReferencesResult,
  ListAIProviderRuntimeSessionsInput,
  ListAIProviderRuntimeSessionsResult,
  AIProviderRuntimeCapabilities,
  AIProviderRuntimeHealth,
  AIProviderRuntimeProviderId,
} from "./types";

export interface AIProviderRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AIProviderRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<AIProviderRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AIProviderRuntimeCapabilities;

  /**
   * Invoca IA exclusivamente via AIProviderPort (Adapter oficial).
   * Único caminho autorizado para o produto alcançar Providers LLM.
   */
  invoke(request: AIRequest): Promise<AIResponse>;

  /**
   * Coordena estruturalmente uma sessão de invocação (Orchestrator + Port).
   * Sem alterar prompts / comportamento do produto.
   */
  coordinateInvocation(input: CoordinateAIInvocationInput): Promise<CoordinateAIInvocationResult>;

  /** Obtém sessão por id. */
  getSession(input: GetAIProviderRuntimeSessionInput): Promise<GetAIProviderRuntimeSessionResult>;

  /** Lista sessões (filtros estruturais opcionais). */
  listSessions(
    input?: ListAIProviderRuntimeSessionsInput,
  ): Promise<ListAIProviderRuntimeSessionsResult>;

  /** Lista referências estruturais a providers. */
  listProviderReferences(): Promise<ListAIProviderReferencesResult>;
}
