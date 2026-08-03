/**
 * XSDRuntimeStore — contrato interno do store (TISS-09).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO carrega XSD oficial; NÃO valida XML; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { CanonicalXSDRuntimeResult, CanonicalXSDStatistics } from "../ports/canonical";

export type StoredCanonicalXSDRuntimeResult = CanonicalXSDRuntimeResult;

export interface XSDRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredCanonicalXSDRuntimeResult | undefined;
  setResult(result: StoredCanonicalXSDRuntimeResult): void;
  listResults(): readonly StoredCanonicalXSDRuntimeResult[];

  resultCount(): number;
  statistics(): CanonicalXSDStatistics;
  health(): { ok: boolean; message?: string };
}
