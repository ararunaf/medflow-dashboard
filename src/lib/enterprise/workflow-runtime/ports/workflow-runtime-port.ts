/**
 * WorkflowRuntimePort — contrato único do Enterprise Corporate Workflow Runtime (C-10).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de orquestração corporativa.
 *
 * Fluxo estrutural (C-10):
 *   Produto → Enterprise Runtime → WorkflowRuntimePort
 *     → Adapter → Workflow Runtime Store → WorkflowManifest /
 *       WorkflowExecutionResult / WorkflowStateMachine
 *
 * C-10: infraestrutura canônica estrutural apenas. Sem workflow funcional.
 * Sem BPM. Sem decisão automática. Sem execução de runtime. Sem filas.
 * Sem workers. Sem scheduler. Sem XML. Sem SOAP. Sem banco. Sem APIs.
 *
 * WORKFLOW IS PURE ORCHESTRATION (Regra Permanente nº 18): o Workflow Runtime
 * exclusivamente orquestra; nunca valida XML, nunca reconcilia, nunca autoriza,
 * nunca gera SOAP, nunca fala com operadoras, nunca processa lotes, nunca roda
 * IA, e nunca implementa regras de domínio.
 */
import type {
  GetWorkflowExecutionInput,
  GetWorkflowExecutionResult,
  ListWorkflowExecutionsInput,
  ListWorkflowExecutionsResult,
  PrepareWorkflowExecutionInput,
  PrepareWorkflowExecutionResult,
  WorkflowRuntimeCapabilities,
  WorkflowRuntimeHealth,
  WorkflowRuntimeInfo,
  WorkflowRuntimeProviderId,
  WorkflowStatsInput,
  WorkflowStatsResult,
} from "./types";

export interface WorkflowRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: WorkflowRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de WorkflowManifest / WorkflowExecution.
   * NÃO orquestra de fato. NÃO decide automaticamente. NÃO executa workflow.
   * Gera SEMPRE um workflowExecutionId novo e único (nunca reaproveitado).
   * Armazena manifesto/execução estruturalmente apenas.
   * Sempre executed = false.
   * Sempre runtimeReady = true.
   */
  prepareWorkflowExecution(
    input: PrepareWorkflowExecutionInput,
  ): Promise<PrepareWorkflowExecutionResult>;

  /**
   * Obtém manifesto/contexto/execução estrutural por workflowExecutionId,
   * transactionId, contextId ou correlationId.
   */
  getWorkflowExecution(input: GetWorkflowExecutionInput): Promise<GetWorkflowExecutionResult>;

  /** Lista manifestos/execuções estruturais do store in-memory. */
  listWorkflowExecutions(
    input?: ListWorkflowExecutionsInput,
  ): Promise<ListWorkflowExecutionsResult>;

  /** Estatísticas estruturais do store in-memory (C-10). */
  stats(input?: WorkflowStatsInput): Promise<WorkflowStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<WorkflowRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): WorkflowRuntimeCapabilities;

  /** Metadados agregados do provedor (C-10). */
  providerInfo(): WorkflowRuntimeInfo;
}
