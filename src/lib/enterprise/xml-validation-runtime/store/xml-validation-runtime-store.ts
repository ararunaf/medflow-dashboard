/**
 * XMLValidationRuntimeStore — contrato interno do store (C-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO valida XML funcional.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  XMLValidationContext,
  XMLValidationRequest,
  XMLValidationResult,
  XMLValidationStatistics,
} from "../ports/canonical";

export type StoredXMLValidationResult = XMLValidationResult;
export type StoredXMLValidationRequest = XMLValidationRequest;
export type StoredXMLValidationContext = XMLValidationContext;

/** Alias TISS-08. */
export type StoredCanonicalXMLValidationResult = StoredXMLValidationResult;

export interface XMLValidationRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredXMLValidationResult | undefined;
  setResult(result: StoredXMLValidationResult): void;
  listResults(): readonly StoredXMLValidationResult[];
  resultCount(): number;

  getRequest(requestId: string): StoredXMLValidationRequest | undefined;
  setRequest(request: StoredXMLValidationRequest): void;
  listRequests(): readonly StoredXMLValidationRequest[];
  requestCount(): number;

  getContext(documentId: string): StoredXMLValidationContext | undefined;
  setContext(context: StoredXMLValidationContext): void;
  listContexts(): readonly StoredXMLValidationContext[];
  contextCount(): number;

  statistics(): XMLValidationStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
