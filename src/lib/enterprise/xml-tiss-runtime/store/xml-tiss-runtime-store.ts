/**
 * XMLTISSRuntimeStore — contrato interno do store (C-01).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO gera XML funcional.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { XMLDocument, XMLResult, XMLStatistics } from "../ports/canonical";

export type StoredXMLTISSRuntimeDocument = XMLDocument;
export type StoredXMLTISSRuntimeResult = XMLResult;

export interface XMLTISSRuntimeStore {
  readonly storeId: string;

  getDocument(documentId: string): StoredXMLTISSRuntimeDocument | undefined;
  setDocument(document: StoredXMLTISSRuntimeDocument): void;
  removeDocument(documentId: string): void;
  listDocuments(): readonly StoredXMLTISSRuntimeDocument[];
  documentCount(): number;

  getResult(resultId: string): StoredXMLTISSRuntimeResult | undefined;
  setResult(result: StoredXMLTISSRuntimeResult): void;
  listResults(): readonly StoredXMLTISSRuntimeResult[];
  resultCount(): number;

  statistics(): XMLStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
