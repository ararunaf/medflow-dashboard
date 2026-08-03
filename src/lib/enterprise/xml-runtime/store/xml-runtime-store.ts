/**
 * XMLRuntimeStore — contrato interno do store (TISS-04).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria XML; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { CanonicalXMLGeneration, CanonicalXMLStatistics } from "../ports/canonical";

export type StoredXMLGeneration = CanonicalXMLGeneration;

export interface XMLRuntimeStore {
  readonly storeId: string;

  getGeneration(generationId: string): StoredXMLGeneration | undefined;
  setGeneration(generation: StoredXMLGeneration): void;
  listGenerations(): readonly StoredXMLGeneration[];

  generationCount(): number;
  statistics(): CanonicalXMLStatistics;
  health(): { ok: boolean; message?: string };
}
