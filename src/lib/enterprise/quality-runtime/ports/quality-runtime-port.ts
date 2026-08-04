/**
 * QualityRuntimePort — contrato único do Enterprise Quality Runtime (F3-CAP-13).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de avaliação de qualidade documental futura.
 *
 * Fluxo estrutural (F3-CAP-13):
 *   Produto → Enterprise Runtime → QualityRuntimePort
 *     → Adapter → Quality Runtime Store → QualityResult
 *
 * F3-CAP-13: infraestrutura canônica estrutural apenas. Sem avaliação
 * automática. Sem score funcional. Sem decisão automática. Sem IA.
 * Sem banco. Sem persistência. Sem APIs.
 */
import type {
  QualityRuntimeCapabilities,
  QualityRuntimeHealth,
  QualityRuntimeInfo,
  QualityRuntimeProviderId,
  QualityStatsInput,
  QualityStatsResult,
  GetQualityResultInput,
  GetQualityResultResult,
  PrepareQualityAssessmentInput,
  PrepareQualityAssessmentResult,
} from "./types";

export interface QualityRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: QualityRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-13 — operações estruturais canônicas (nunca executam avaliação).
  // -------------------------------------------------------------------------

  /** Prepara sessão estrutural canônica. NÃO avalia. NÃO calcula score. NÃO decide. */
  prepareQualityAssessment(
    input: PrepareQualityAssessmentInput,
  ): Promise<PrepareQualityAssessmentResult>;

  /** Obtém resultado estrutural por assessment/result. NÃO executa avaliação. */
  getResult(input: GetQualityResultInput): Promise<GetQualityResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-13). */
  stats(input?: QualityStatsInput): Promise<QualityStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<QualityRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): QualityRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-13). */
  providerInfo(): QualityRuntimeInfo;
}
