/**
 * InMemoryTISSMappingRuntimeStore — store in-process oficial (F3-CAP-11).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem mapeamento funcional).
 */
import type { CanonicalMappingStatistics } from "../ports/canonical";
import type {
  StoredTISSMappingRuntimeMapping,
  StoredTISSMappingRuntimeResult,
  TISSMappingRuntimeStore,
} from "./tiss-mapping-runtime-store";

export const IN_MEMORY_TISS_MAPPING_RUNTIME_STORE_ID = "in-memory-tiss-mapping-runtime";

export type InMemoryTISSMappingRuntimeStoreOptions = {
  mappings?: readonly StoredTISSMappingRuntimeMapping[];
  results?: readonly StoredTISSMappingRuntimeResult[];
};

export class InMemoryTISSMappingRuntimeStore implements TISSMappingRuntimeStore {
  readonly storeId = IN_MEMORY_TISS_MAPPING_RUNTIME_STORE_ID;

  private readonly mappings = new Map<string, StoredTISSMappingRuntimeMapping>();
  private readonly results = new Map<string, StoredTISSMappingRuntimeResult>();

  constructor(options: InMemoryTISSMappingRuntimeStoreOptions = {}) {
    for (const mapping of options.mappings ?? []) this.setMapping(mapping);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getMapping(mappingId: string): StoredTISSMappingRuntimeMapping | undefined {
    const mapping = this.mappings.get(mappingId);
    return mapping ? { ...mapping } : undefined;
  }

  setMapping(mapping: StoredTISSMappingRuntimeMapping): void {
    this.mappings.set(mapping.mappingId, { ...mapping });
  }

  removeMapping(mappingId: string): void {
    this.mappings.delete(mappingId);
  }

  listMappings(): readonly StoredTISSMappingRuntimeMapping[] {
    return Array.from(this.mappings.values()).map((mapping) => ({ ...mapping }));
  }

  mappingCount(): number {
    return this.mappings.size;
  }

  getResult(resultId: string): StoredTISSMappingRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredTISSMappingRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredTISSMappingRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalMappingStatistics {
    const mappings = this.listMappings();
    let preparedMappings = 0;
    for (const mapping of mappings) {
      if (mapping.status === "prepared") preparedMappings += 1;
    }
    return {
      kind: "canonical-tiss-mapping-statistics",
      totalMappings: mappings.length,
      preparedMappings,
      totalResults: this.resultCount(),
      totalIssues: 0,
      mappingEngineImplementedCount: 0,
      operatorMappingImplementedCount: 0,
      templateMappingImplementedCount: 0,
      canonicalModelImplementedCount: 0,
      guideTransformationImplementedCount: 0,
      fieldNormalizationImplementedCount: 0,
      tissVersionMappingImplementedCount: 0,
      layoutMappingImplementedCount: 0,
      xmlMappingImplementedCount: 0,
      autoFillPreparationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `TISS Mapping Runtime store ready (${this.mappingCount()} mappings, ${this.resultCount()} results).`,
    };
  }
}
