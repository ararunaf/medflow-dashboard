/**
 * XMLValidationRuntimeStore — contrato interno do store (TISS-08).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO carrega XSD oficial; NÃO valida XML; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalXMLValidationResult,
  CanonicalXMLValidationStatistics,
} from "../ports/canonical";

export type StoredCanonicalXMLValidationResult = CanonicalXMLValidationResult;

export interface XMLValidationRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredCanonicalXMLValidationResult | undefined;
  setResult(result: StoredCanonicalXMLValidationResult): void;
  listResults(): readonly StoredCanonicalXMLValidationResult[];

  resultCount(): number;
  statistics(): CanonicalXMLValidationStatistics;
  health(): { ok: boolean; message?: string };
}
