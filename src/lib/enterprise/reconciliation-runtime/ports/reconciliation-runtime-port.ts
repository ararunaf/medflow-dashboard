/**
 * ReconciliationRuntimePort — contrato único do Enterprise Reconciliation Runtime (C-09).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para fundação estrutural futura de reconciliação corporativa.
 *
 * Fluxo estrutural (C-09):
 *   Produto → Enterprise Runtime → ReconciliationRuntimePort
 *     → Adapter → Reconciliation Runtime Store → ReconciliationManifest /
 *       CanonicalReconciliationResult / ReconciliationStateMachine
 *
 * C-09: infraestrutura canônica estrutural apenas. Sem reconciliação
 * funcional. Sem matching automático. Sem resolução de conflitos.
 * Sem comparação entre documentos. Sem XML. Sem SOAP. Sem banco.
 * Sem APIs. Sem filas. Sem workflow.
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16).
 */
import type {
  CorrelateReconciliationInput,
  CorrelateReconciliationResult,
  GetReconciliationInput,
  GetReconciliationResult,
  ListReconciliationsInput,
  ListReconciliationsResult,
  PrepareReconciliationInput,
  PrepareReconciliationResult,
  ReconciliationRuntimeCapabilities,
  ReconciliationRuntimeHealth,
  ReconciliationRuntimeInfo,
  ReconciliationRuntimeProviderId,
  ReconciliationStatsInput,
  ReconciliationStatsResult,
} from "./types";

export interface ReconciliationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ReconciliationRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação de ReconciliationManifest.
   * NÃO reconcilia. NÃO faz matching. NÃO resolve conflitos.
   * Armazena manifesto estruturalmente apenas.
   * Sempre reconciled = false.
   * Sempre runtimeReady = true.
   */
  prepareReconciliation(input: PrepareReconciliationInput): Promise<PrepareReconciliationResult>;

  /** Obtém manifesto/contexto estrutural por reconciliationId, transactionId ou contextId. */
  getReconciliation(input: GetReconciliationInput): Promise<GetReconciliationResult>;

  /** Lista manifestos estruturais do store in-memory. */
  listReconciliations(input?: ListReconciliationsInput): Promise<ListReconciliationsResult>;

  /**
   * Operação estrutural de correlação (RULE_14).
   * NÃO executa matching automático.
   * NÃO reconcilia.
   * Sempre automaticMatchingImplemented = false.
   * Sempre matched = false.
   */
  correlateReconciliation(
    input: CorrelateReconciliationInput,
  ): Promise<CorrelateReconciliationResult>;

  /** Estatísticas estruturais do store in-memory (C-09). */
  stats(input?: ReconciliationStatsInput): Promise<ReconciliationStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<ReconciliationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ReconciliationRuntimeCapabilities;

  /** Metadados agregados do provedor (C-09). */
  providerInfo(): ReconciliationRuntimeInfo;
}
