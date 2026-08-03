/**
 * XMLSerializerRuntimePort — contrato único do Enterprise XML Serializer Runtime (TISS-06).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface
 * para serializar a estrutura XML canônica em texto.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort
 *     → Adapter → XML Serializer Store → Canonical XML String
 *
 * TISS-06: infraestrutura canônica apenas — sem XML TISS/ANS real / operadoras / XSD.
 */
import type {
  GetCanonicalXMLSerializeResultInput,
  GetCanonicalXMLSerializeResultResult,
  ListCanonicalXMLSerializeResultsInput,
  ListCanonicalXMLSerializeResultsResult,
  SerializeCanonicalXMLInput,
  SerializeCanonicalXMLResult,
  XMLSerializerRuntimeHealth,
  XMLSerializerRuntimeInfo,
  XMLSerializerRuntimePortCapabilities,
  XMLSerializerRuntimeProviderId,
} from "./types";

export interface XMLSerializerRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLSerializerRuntimeProviderId;

  /**
   * Serializa estrutura XML canônica em texto.
   * NÃO produz XML TISS/ANS real.
   * Sempre realTissXmlGenerated = false e realAnsXmlGenerated = false.
   */
  serialize(input: SerializeCanonicalXMLInput): Promise<SerializeCanonicalXMLResult>;

  getResult(
    input: GetCanonicalXMLSerializeResultInput,
  ): Promise<GetCanonicalXMLSerializeResultResult>;
  listResults(
    input?: ListCanonicalXMLSerializeResultsInput,
  ): Promise<ListCanonicalXMLSerializeResultsResult>;

  health(): Promise<XMLSerializerRuntimeHealth>;
  capabilities(): XMLSerializerRuntimePortCapabilities;
  providerInfo(): XMLSerializerRuntimeInfo;
}
