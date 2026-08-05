/**
 * ReturnRuntimePort — contrato único do Enterprise Return Runtime (C-08).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de retornos corporativos.
 *
 * Fluxo estrutural (C-08):
 *   Produto → Enterprise Runtime → ReturnRuntimePort
 *     → Adapter → Return Runtime Store → ReturnManifest / ReturnCorrelation /
 *       ReturnStateMachine
 *
 * C-08: infraestrutura canônica estrutural apenas. Sem processamento de
 * retorno. Sem correlação automática. Sem reconciliação. Sem parser XML.
 * Sem SOAP. Sem operadoras. Sem banco. Sem APIs. Sem filas. Sem workflow.
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
 * Sequência futura oficial:
 *   Recebimento → Correlação → Validação → Atualização de Estado →
 *   Workflow → Auditoria
 */
import type {
  CorrelateReturnInput,
  CorrelateReturnResult,
  GetReturnInput,
  GetReturnResult,
  ListReturnsInput,
  ListReturnsResult,
  PrepareReturnInput,
  PrepareReturnResult,
  ReturnRuntimeCapabilities,
  ReturnRuntimeHealth,
  ReturnRuntimeInfo,
  ReturnRuntimeProviderId,
  ReturnStatsInput,
  ReturnStatsResult,
} from "./types";

export interface ReturnRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ReturnRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de ReturnManifest.
   * NÃO processa retorno. NÃO correlaciona automaticamente. NÃO reconcilia.
   * Armazena manifesto estruturalmente apenas.
   * Sempre returnProcessed = false.
   * Sempre runtimeReady = true.
   */
  prepareReturn(input: PrepareReturnInput): Promise<PrepareReturnResult>;

  /** Obtém manifesto/contexto estrutural por returnId, transactionId ou contextId. */
  getReturn(input: GetReturnInput): Promise<GetReturnResult>;

  /** Lista manifestos estruturais do store in-memory. */
  listReturns(input?: ListReturnsInput): Promise<ListReturnsResult>;

  /**
   * Operação estrutural de correlação (RULE_14).
   * NÃO executa correlação automática.
   * NÃO processa retorno.
   * Sempre automaticCorrelationImplemented = false.
   * Sempre correlated = false.
   */
  correlateReturn(input: CorrelateReturnInput): Promise<CorrelateReturnResult>;

  /** Estatísticas estruturais do store in-memory (C-08). */
  stats(input?: ReturnStatsInput): Promise<ReturnStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<ReturnRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ReturnRuntimeCapabilities;

  /** Metadados agregados do provedor (C-08). */
  providerInfo(): ReturnRuntimeInfo;
}
