/**
 * XMLSchemaRuntimePort — contrato único do Enterprise XML Schema Runtime (TISS-07).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface
 * para gerenciar XML Schemas canônicos.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → Adapter → XML Schema Store → Canonical XML Schema
 *
 * TISS-07: infraestrutura canônica apenas — sem XSD oficial / validação / XML TISS/ANS.
 */
import type {
  GetCanonicalXMLSchemaResultInput,
  GetCanonicalXMLSchemaResultResult,
  ListCanonicalXMLSchemaResultsInput,
  ListCanonicalXMLSchemaResultsResult,
  RegisterCanonicalXMLSchemaInput,
  RegisterCanonicalXMLSchemaResult,
  SelectCanonicalXMLSchemaInput,
  SelectCanonicalXMLSchemaResult,
  XMLSchemaRuntimeHealth,
  XMLSchemaRuntimeInfo,
  XMLSchemaRuntimePortCapabilities,
  XMLSchemaRuntimeProviderId,
} from "./types";

export interface XMLSchemaRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLSchemaRuntimeProviderId;

  /**
   * Registra um XML Schema canônico (estrutural).
   * NÃO carrega XSD oficial. NÃO valida XML. NÃO produz XML TISS/ANS.
   * Sempre officialXsdLoaded = false e xsdValidationPerformed = false.
   */
  register(input: RegisterCanonicalXMLSchemaInput): Promise<RegisterCanonicalXMLSchemaResult>;

  /**
   * Seleciona um XML Schema canônico previamente registrado.
   * D-03 — schema selection funcional sem XSD oficial / sem TISS/ANS / sem operadoras.
   */
  select(input: SelectCanonicalXMLSchemaInput): Promise<SelectCanonicalXMLSchemaResult>;

  getResult(input: GetCanonicalXMLSchemaResultInput): Promise<GetCanonicalXMLSchemaResultResult>;
  listResults(
    input?: ListCanonicalXMLSchemaResultsInput,
  ): Promise<ListCanonicalXMLSchemaResultsResult>;

  health(): Promise<XMLSchemaRuntimeHealth>;
  capabilities(): XMLSchemaRuntimePortCapabilities;
  providerInfo(): XMLSchemaRuntimeInfo;
}
