/**
 * NamespaceRuntimeStore — contrato interno do store (TISS-10).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO carrega namespace oficial; NÃO resolve/valida namespace; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalNamespaceRuntimeResult,
  CanonicalNamespaceStatistics,
} from "../ports/canonical";

export type StoredCanonicalNamespaceRuntimeResult = CanonicalNamespaceRuntimeResult;

export interface NamespaceRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredCanonicalNamespaceRuntimeResult | undefined;
  setResult(result: StoredCanonicalNamespaceRuntimeResult): void;
  listResults(): readonly StoredCanonicalNamespaceRuntimeResult[];

  resultCount(): number;
  statistics(): CanonicalNamespaceStatistics;
  health(): { ok: boolean; message?: string };
}
