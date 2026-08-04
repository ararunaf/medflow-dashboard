/**
 * SOAPRuntimePort — contrato único do Enterprise SOAP Runtime (C-03).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta
 * interface para encapsulamento estrutural futuro de transporte SOAP.
 *
 * Fluxo estrutural (C-03):
 *   Produto → Enterprise Runtime → SOAPRuntimePort
 *     → Adapter → SOAP Runtime Store → SOAPResponse
 *
 * C-03: infraestrutura canônica estrutural apenas. Sem comunicação SOAP.
 * Sem HTTP. Sem WSDL. Sem TLS. Sem certificado. Sem autenticação.
 * Sem MTOM. Sem operadoras. Sem banco. Sem persistência. Sem APIs.
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5): este Port é exclusivamente
 * o encapsulador de transporte SOAP; especialização ocorre por Adapters.
 */
import type {
  GetSOAPResponseInput,
  GetSOAPResponseResult,
  ListSOAPResponsesInput,
  ListSOAPResponsesResult,
  PrepareSOAPInput,
  PrepareSOAPResult,
  SOAPRuntimeCapabilities,
  SOAPRuntimeHealth,
  SOAPRuntimeInfo,
  SOAPRuntimeProviderId,
  SOAPStatsInput,
  SOAPStatsResult,
} from "./types";

export interface SOAPRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: SOAPRuntimeProviderId;

  // -------------------------------------------------------------------------
  // C-03 — operações estruturais canônicas (nunca comunicam SOAP).
  // -------------------------------------------------------------------------

  /**
   * Executa operação estrutural de preparação SOAP canônica.
   * NÃO envia HTTP. NÃO carrega WSDL. NÃO estabelece TLS.
   * Sempre communicationExecuted = false e realCommunicationPerformed = false.
   * Sempre runtimeReady = true.
   */
  prepare(input: PrepareSOAPInput): Promise<PrepareSOAPResult>;

  /** Obtém resposta estrutural por responseId. NÃO executa comunicação. */
  getResponse(input: GetSOAPResponseInput): Promise<GetSOAPResponseResult>;

  /** Lista respostas estruturais do store in-memory. */
  listResponses(input?: ListSOAPResponsesInput): Promise<ListSOAPResponsesResult>;

  /** Estatísticas estruturais do store in-memory (C-03). */
  stats(input?: SOAPStatsInput): Promise<SOAPStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<SOAPRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): SOAPRuntimeCapabilities;

  /** Metadados agregados do provedor (C-03). */
  providerInfo(): SOAPRuntimeInfo;
}
