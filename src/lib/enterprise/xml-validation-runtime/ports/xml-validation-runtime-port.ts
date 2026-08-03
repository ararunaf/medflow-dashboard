/**
 * XMLValidationRuntimePort — contrato único do Enterprise XML Validation Runtime (TISS-08).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface
 * para preparar a infraestrutura de validação XML canônica.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort
 *     → Adapter → XML Validation Store → Canonical XML Validation Result
 *
 * TISS-08: infraestrutura canônica apenas — sem XSD oficial / validação real / XML TISS/ANS.
 */
import type {
  GetCanonicalXMLValidationResultInput,
  GetCanonicalXMLValidationResultResult,
  ListCanonicalXMLValidationResultsInput,
  ListCanonicalXMLValidationResultsResult,
  ValidateCanonicalXMLInput,
  ValidateCanonicalXMLResult,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimePortCapabilities,
  XMLValidationRuntimeProviderId,
} from "./types";

export interface XMLValidationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLValidationRuntimeProviderId;

  /**
   * Executa operação estrutural de validação canônica.
   * NÃO carrega XSD oficial. NÃO valida XML. NÃO produz XML TISS/ANS.
   * Sempre validationExecuted = false e realValidationPerformed = false.
   * Sempre validationEngineReady = true.
   */
  validate(input: ValidateCanonicalXMLInput): Promise<ValidateCanonicalXMLResult>;

  getResult(
    input: GetCanonicalXMLValidationResultInput,
  ): Promise<GetCanonicalXMLValidationResultResult>;
  listResults(
    input?: ListCanonicalXMLValidationResultsInput,
  ): Promise<ListCanonicalXMLValidationResultsResult>;

  health(): Promise<XMLValidationRuntimeHealth>;
  capabilities(): XMLValidationRuntimePortCapabilities;
  providerInfo(): XMLValidationRuntimeInfo;
}
