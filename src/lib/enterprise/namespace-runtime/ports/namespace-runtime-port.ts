/**
 * NamespaceRuntimePort — contrato único do Enterprise Namespace Runtime (TISS-10).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface
 * para preparar a infraestrutura de gerenciamento canônico de namespaces XML futuros.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → NamespaceRuntimePort
 *     → Adapter → Namespace Runtime Store → Canonical Namespace Runtime Result
 *
 * TISS-10: infraestrutura canônica apenas — sem namespace oficial / resolução real / XML TISS/ANS.
 */
import type {
  GetCanonicalNamespaceResultInput,
  GetCanonicalNamespaceResultResult,
  ListCanonicalNamespaceResultsInput,
  ListCanonicalNamespaceResultsResult,
  PrepareCanonicalNamespaceInput,
  PrepareCanonicalNamespaceResult,
  NamespaceRuntimeHealth,
  NamespaceRuntimeInfo,
  NamespaceRuntimePortCapabilities,
  NamespaceRuntimeProviderId,
} from "./types";

export interface NamespaceRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: NamespaceRuntimeProviderId;

  /**
   * Executa operação estrutural de preparação canônica do Namespace Runtime.
   * NÃO carrega namespace oficial. NÃO resolve/valida namespace real. NÃO produz XML TISS/ANS.
   * Sempre officialNamespacesLoaded = false e realNamespacesLoaded = false.
   * Sempre runtimeReady = true.
   */
  prepare(input: PrepareCanonicalNamespaceInput): Promise<PrepareCanonicalNamespaceResult>;

  getResult(input: GetCanonicalNamespaceResultInput): Promise<GetCanonicalNamespaceResultResult>;
  listResults(
    input?: ListCanonicalNamespaceResultsInput,
  ): Promise<ListCanonicalNamespaceResultsResult>;

  health(): Promise<NamespaceRuntimeHealth>;
  capabilities(): NamespaceRuntimePortCapabilities;
  providerInfo(): NamespaceRuntimeInfo;
}
