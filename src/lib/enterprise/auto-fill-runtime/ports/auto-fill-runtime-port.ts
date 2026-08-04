/**
 * AutoFillRuntimePort — contrato único do Enterprise Auto-Fill Runtime (F3-CAP-12).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de preenchimento canônico futuro de guias TISS.
 *
 * Fluxo estrutural (F3-CAP-12):
 *   Produto → Enterprise Runtime → AutoFillRuntimePort
 *     → Adapter → Auto-Fill Runtime Store → AutoFillResult
 *
 * F3-CAP-12: infraestrutura canônica estrutural apenas. Sem preenchimento
 * automático. Sem geração de XML. Sem escrita em guias. Sem integração com
 * operadoras. Sem IA. Sem banco. Sem persistência. Sem APIs.
 */
import type {
  AutoFillRuntimeCapabilities,
  AutoFillRuntimeHealth,
  AutoFillRuntimeInfo,
  AutoFillRuntimeProviderId,
  AutoFillStatsInput,
  AutoFillStatsResult,
  GetAutoFillResultInput,
  GetAutoFillResultResult,
  PrepareAutoFillInput,
  PrepareAutoFillResult,
} from "./types";

export interface AutoFillRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AutoFillRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-12 — operações estruturais canônicas (nunca executam preenchimento).
  // -------------------------------------------------------------------------

  /** Prepara sessão estrutural canônica. NÃO preenche. NÃO gera XML. NÃO escreve guias. */
  prepareAutoFill(input: PrepareAutoFillInput): Promise<PrepareAutoFillResult>;

  /** Obtém resultado estrutural por sessão/result. NÃO executa preenchimento. */
  getResult(input: GetAutoFillResultInput): Promise<GetAutoFillResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-12). */
  stats(input?: AutoFillStatsInput): Promise<AutoFillStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<AutoFillRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AutoFillRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-12). */
  providerInfo(): AutoFillRuntimeInfo;
}
