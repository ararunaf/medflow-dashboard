/**
 * TISSMappingRuntimePort — contrato único do Enterprise TISS Mapping Runtime (F3-CAP-11).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de mapeamento canônico TISS futuro.
 *
 * Fluxo estrutural (F3-CAP-11):
 *   Produto → Enterprise Runtime → TISSMappingRuntimePort
 *     → Adapter → TISS Mapping Runtime Store → CanonicalMappingResult
 *
 * F3-CAP-11: infraestrutura canônica estrutural apenas. Sem mapeamento
 * funcional. Sem operadoras. Sem XML. Sem preenchimento automático.
 * Sem IA. Sem banco. Sem persistência. Sem APIs.
 */
import type {
  GetTISSMappingResultInput,
  GetTISSMappingResultResult,
  PrepareTISSMappingInput,
  PrepareTISSMappingResult,
  TISSMappingRuntimeCapabilities,
  TISSMappingRuntimeHealth,
  TISSMappingRuntimeInfo,
  TISSMappingRuntimeProviderId,
  TISSMappingStatsInput,
  TISSMappingStatsResult,
} from "./types";

export interface TISSMappingRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: TISSMappingRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-11 — operações estruturais canônicas (nunca executam mapeamento).
  // -------------------------------------------------------------------------

  /** Prepara mapping estrutural canônico. NÃO mapeia. NÃO gera XML. NÃO preenche. */
  prepareMapping(input: PrepareTISSMappingInput): Promise<PrepareTISSMappingResult>;

  /** Obtém resultado estrutural por mapping/result. NÃO executa mapeamento. */
  getResult(input: GetTISSMappingResultInput): Promise<GetTISSMappingResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-11). */
  stats(input?: TISSMappingStatsInput): Promise<TISSMappingStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<TISSMappingRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TISSMappingRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-11). */
  providerInfo(): TISSMappingRuntimeInfo;
}
