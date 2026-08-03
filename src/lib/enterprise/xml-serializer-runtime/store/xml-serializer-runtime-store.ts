/**
 * XMLSerializerRuntimeStore — contrato interno do store (TISS-06).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria XML TISS/ANS; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalXMLSerializeResult,
  CanonicalXMLSerializerStatistics,
} from "../ports/canonical";

export type StoredCanonicalXMLSerializeResult = CanonicalXMLSerializeResult;

export interface XMLSerializerRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredCanonicalXMLSerializeResult | undefined;
  setResult(result: StoredCanonicalXMLSerializeResult): void;
  listResults(): readonly StoredCanonicalXMLSerializeResult[];

  resultCount(): number;
  statistics(): CanonicalXMLSerializerStatistics;
  health(): { ok: boolean; message?: string };
}
