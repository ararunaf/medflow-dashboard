/**
 * TISSMappingRuntimeStore — contrato interno do store (F3-CAP-11).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa mapeamento funcional.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalMapping,
  CanonicalMappingResult,
  CanonicalMappingStatistics,
} from "../ports/canonical";

export type StoredTISSMappingRuntimeMapping = CanonicalMapping;
export type StoredTISSMappingRuntimeResult = CanonicalMappingResult;

export interface TISSMappingRuntimeStore {
  readonly storeId: string;

  getMapping(mappingId: string): StoredTISSMappingRuntimeMapping | undefined;
  setMapping(mapping: StoredTISSMappingRuntimeMapping): void;
  removeMapping(mappingId: string): void;
  listMappings(): readonly StoredTISSMappingRuntimeMapping[];
  mappingCount(): number;

  getResult(resultId: string): StoredTISSMappingRuntimeResult | undefined;
  setResult(result: StoredTISSMappingRuntimeResult): void;
  listResults(): readonly StoredTISSMappingRuntimeResult[];
  resultCount(): number;

  statistics(): CanonicalMappingStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
