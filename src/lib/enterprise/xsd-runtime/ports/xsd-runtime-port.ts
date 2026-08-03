/**
 * XSDRuntimePort — contrato único do Enterprise XSD Runtime (TISS-09).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface
 * para preparar a infraestrutura de gerenciamento canônico de XSDs futuros.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → Adapter → XSD Runtime Store → Canonical XSD Runtime Result
 *
 * TISS-09: infraestrutura canônica apenas — sem XSD oficial / validação real / XML TISS/ANS.
 */
import type {
  GetCanonicalXSDResultInput,
  GetCanonicalXSDResultResult,
  ListCanonicalXSDResultsInput,
  ListCanonicalXSDResultsResult,
  PrepareCanonicalXSDInput,
  PrepareCanonicalXSDResult,
  XSDRuntimeHealth,
  XSDRuntimeInfo,
  XSDRuntimePortCapabilities,
  XSDRuntimeProviderId,
} from "./types";

export interface XSDRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XSDRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação canônica do XSD Runtime.
   * NÃO carrega XSD oficial. NÃO valida XML. NÃO produz XML TISS/ANS.
   * Sempre officialXsdLoaded = false e realXsdLoaded = false.
   * Sempre runtimeReady = true.
   */
  prepare(input: PrepareCanonicalXSDInput): Promise<PrepareCanonicalXSDResult>;

  getResult(input: GetCanonicalXSDResultInput): Promise<GetCanonicalXSDResultResult>;
  listResults(input?: ListCanonicalXSDResultsInput): Promise<ListCanonicalXSDResultsResult>;

  health(): Promise<XSDRuntimeHealth>;
  capabilities(): XSDRuntimePortCapabilities;
  providerInfo(): XSDRuntimeInfo;
}
