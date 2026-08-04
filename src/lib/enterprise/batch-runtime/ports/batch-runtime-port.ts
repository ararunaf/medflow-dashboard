/**
 * BatchRuntimePort — contrato único do Enterprise Batch Runtime (C-06).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de lote corporativo.
 *
 * Fluxo estrutural (C-06):
 *   Produto → Enterprise Runtime → BatchRuntimePort
 *     → Adapter → Batch Runtime Store → BatchManifest / BatchStateMachine
 *
 * C-06: infraestrutura canônica estrutural apenas. Sem processamento em lote.
 * Sem filas. Sem workers. Sem retry funcional. Sem scheduler. Sem paralelismo.
 * Sem SOAP/XML funcional. Sem banco. Sem APIs. Sem envio para operadoras.
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 */
import type {
  BatchRuntimeCapabilities,
  BatchRuntimeHealth,
  BatchRuntimeInfo,
  BatchRuntimeProviderId,
  BatchStatsInput,
  BatchStatsResult,
  GetBatchInput,
  GetBatchResult,
  ListBatchesInput,
  ListBatchesResult,
  PrepareBatchInput,
  PrepareBatchResult,
} from "./types";

export interface BatchRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: BatchRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de BatchManifest.
   * NÃO processa lote. NÃO enfileira. NÃO envia. NÃO executa workers.
   * Armazena manifesto estruturalmente apenas.
   * Sempre batchProcessed = false.
   * Sempre runtimeReady = true.
   */
  prepareBatch(input: PrepareBatchInput): Promise<PrepareBatchResult>;

  /** Obtém manifesto/contexto estrutural por batchId ou contextId. */
  getBatch(input: GetBatchInput): Promise<GetBatchResult>;

  /** Lista manifestos estruturais do store in-memory. */
  listBatches(input?: ListBatchesInput): Promise<ListBatchesResult>;

  /** Estatísticas estruturais do store in-memory (C-06). */
  stats(input?: BatchStatsInput): Promise<BatchStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<BatchRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): BatchRuntimeCapabilities;

  /** Metadados agregados do provedor (C-06). */
  providerInfo(): BatchRuntimeInfo;
}
