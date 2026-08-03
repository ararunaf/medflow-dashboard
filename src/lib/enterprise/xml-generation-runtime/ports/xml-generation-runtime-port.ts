/**
 * XMLGenerationRuntimePort — contrato único do Enterprise XML Generation Runtime (TISS-05).
 *
 * Application / XML Runtime / TISS Runtime dependem exclusivamente desta interface
 * para materializar a estrutura XML canônica.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → Adapter → XML Generation Store → Canonical XML Result
 *
 * TISS-05: infraestrutura canônica apenas — sem XML TISS/ANS real / operadoras.
 */
import type {
  GenerateCanonicalXMLInput,
  GenerateCanonicalXMLResult,
  GetCanonicalXMLResultInput,
  GetCanonicalXMLResultResult,
  ListCanonicalXMLResultsInput,
  ListCanonicalXMLResultsResult,
  XMLGenerationRuntimeHealth,
  XMLGenerationRuntimeInfo,
  XMLGenerationRuntimePortCapabilities,
  XMLGenerationRuntimeProviderId,
} from "./types";

export interface XMLGenerationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLGenerationRuntimeProviderId;

  /**
   * Gera estrutura XML canônica.
   * NÃO produz XML TISS/ANS real. Sempre realXmlGenerated = false.
   */
  generate(input: GenerateCanonicalXMLInput): Promise<GenerateCanonicalXMLResult>;

  getResult(input: GetCanonicalXMLResultInput): Promise<GetCanonicalXMLResultResult>;
  listResults(input?: ListCanonicalXMLResultsInput): Promise<ListCanonicalXMLResultsResult>;

  health(): Promise<XMLGenerationRuntimeHealth>;
  capabilities(): XMLGenerationRuntimePortCapabilities;
  providerInfo(): XMLGenerationRuntimeInfo;
}
