/**
 * XMLSchemaRuntimeStore — contrato interno do store (TISS-07).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO carrega XSD oficial; NÃO valida XML; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { CanonicalXMLSchemaResult, CanonicalXMLSchemaStatistics } from "../ports/canonical";

export type StoredCanonicalXMLSchemaResult = CanonicalXMLSchemaResult;

export interface XMLSchemaRuntimeStore {
  readonly storeId: string;

  getResult(resultId: string): StoredCanonicalXMLSchemaResult | undefined;
  setResult(result: StoredCanonicalXMLSchemaResult): void;
  listResults(): readonly StoredCanonicalXMLSchemaResult[];

  resultCount(): number;
  statistics(): CanonicalXMLSchemaStatistics;
  health(): { ok: boolean; message?: string };
}
