/**
 * XMLTISSRuntimePort — contrato único do Enterprise XML TISS Runtime (C-01).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de transformação futura Canonical TISS → XML.
 *
 * Fluxo estrutural (C-01):
 *   Produto → Enterprise Runtime → XMLTISSRuntimePort
 *     → Adapter → XML TISS Runtime Store → XMLResult
 *
 * C-01: infraestrutura canônica estrutural apenas. Sem geração de XML.
 * Sem serialização. Sem parser. Sem XSD. Sem SOAP. Sem operadoras.
 * Sem banco. Sem persistência. Sem APIs.
 */
import type {
  XMLTISSRuntimeCapabilities,
  XMLTISSRuntimeHealth,
  XMLTISSRuntimeInfo,
  XMLTISSRuntimeProviderId,
  XMLStatsInput,
  XMLStatsResult,
  GetXMLResultInput,
  GetXMLResultResult,
  PrepareXMLDocumentInput,
  PrepareXMLDocumentResult,
} from "./types";

export interface XMLTISSRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLTISSRuntimeProviderId;

  // -------------------------------------------------------------------------
  // C-01 — operações estruturais canônicas (nunca geram XML).
  // -------------------------------------------------------------------------

  /** Prepara documento estrutural canônico. NÃO gera XML. NÃO serializa. NÃO valida XSD. */
  prepareXMLDocument(input: PrepareXMLDocumentInput): Promise<PrepareXMLDocumentResult>;

  /** Obtém resultado estrutural por document/result. NÃO executa geração de XML. */
  getResult(input: GetXMLResultInput): Promise<GetXMLResultResult>;

  /** Estatísticas estruturais do store in-memory (C-01). */
  stats(input?: XMLStatsInput): Promise<XMLStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<XMLTISSRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): XMLTISSRuntimeCapabilities;

  /** Metadados agregados do provedor (C-01). */
  providerInfo(): XMLTISSRuntimeInfo;
}
