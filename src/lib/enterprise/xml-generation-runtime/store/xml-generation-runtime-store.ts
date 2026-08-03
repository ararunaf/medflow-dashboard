/**
 * XMLGenerationRuntimeStore — contrato interno do store (TISS-05).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria XML TISS/ANS; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { CanonicalXMLGenerationStatistics, CanonicalXMLResult } from "../ports/canonical";

export type StoredCanonicalXMLResult = CanonicalXMLResult;

export interface XMLGenerationRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredCanonicalXMLResult | undefined;
  setResult(result: StoredCanonicalXMLResult): void;
  listResults(): readonly StoredCanonicalXMLResult[];

  resultCount(): number;
  statistics(): CanonicalXMLGenerationStatistics;
  health(): { ok: boolean; message?: string };
}
