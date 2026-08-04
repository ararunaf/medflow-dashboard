/**
 * SOAPRuntimeStore — contrato interno do store (C-03).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO comunica SOAP.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { SOAPContext, SOAPRequest, SOAPResponse, SOAPStatistics } from "../ports/canonical";

export type StoredSOAPResponse = SOAPResponse;
export type StoredSOAPRequest = SOAPRequest;
export type StoredSOAPContext = SOAPContext;

export interface SOAPRuntimeStore {
  readonly storeId: string;

  getResponse(responseId: string): StoredSOAPResponse | undefined;
  setResponse(response: StoredSOAPResponse): void;
  listResponses(): readonly StoredSOAPResponse[];
  responseCount(): number;

  getRequest(requestId: string): StoredSOAPRequest | undefined;
  setRequest(request: StoredSOAPRequest): void;
  listRequests(): readonly StoredSOAPRequest[];
  requestCount(): number;

  getContext(contextId: string): StoredSOAPContext | undefined;
  setContext(context: StoredSOAPContext): void;
  listContexts(): readonly StoredSOAPContext[];
  contextCount(): number;

  statistics(): SOAPStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
