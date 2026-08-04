/**
 * XMLValidationRuntimePort — contrato único do Enterprise XML Validation Runtime (C-02).
 *
 * Application / Enterprise Runtime / TISS Runtime dependem exclusivamente desta
 * interface para orquestração estrutural de validação futura de XML.
 *
 * Fluxo estrutural (C-02):
 *   Produto → Enterprise Runtime → XMLValidationRuntimePort
 *     → Adapter → XML Validation Runtime Store → XMLValidationResult
 *
 * C-02: infraestrutura canônica estrutural apenas. Sem validação XML.
 * Sem XSD. Sem parser. Sem correção automática. Sem SOAP. Sem operadoras.
 * Sem banco. Sem persistência. Sem APIs. Sem IA.
 */
import type {
  GetXMLValidationResultInput,
  GetXMLValidationResultResult,
  ListXMLValidationResultsInput,
  ListXMLValidationResultsResult,
  ValidateXMLInput,
  ValidateXMLResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeProviderId,
  XMLValidationStatsInput,
  XMLValidationStatsResult,
} from "./types";

export interface XMLValidationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLValidationRuntimeProviderId;

  // -------------------------------------------------------------------------
  // C-02 — operações estruturais canônicas (nunca validam XML).
  // -------------------------------------------------------------------------

  /**
   * Executa operação estrutural de validação canônica.
   * NÃO carrega XSD oficial. NÃO valida XML. NÃO produz XML TISS/ANS.
   * Sempre validationExecuted = false e realValidationPerformed = false.
   * Sempre validationEngineReady = true.
   */
  validate(input: ValidateXMLInput): Promise<ValidateXMLResult>;

  /** Obtém resultado estrutural por resultId. NÃO executa validação. */
  getResult(input: GetXMLValidationResultInput): Promise<GetXMLValidationResultResult>;

  /** Lista resultados estruturais do store in-memory. */
  listResults(input?: ListXMLValidationResultsInput): Promise<ListXMLValidationResultsResult>;

  /** Estatísticas estruturais do store in-memory (C-02). */
  stats(input?: XMLValidationStatsInput): Promise<XMLValidationStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<XMLValidationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): XMLValidationRuntimeCapabilities;

  /** Metadados agregados do provedor (C-02). */
  providerInfo(): XMLValidationRuntimeInfo;
}
