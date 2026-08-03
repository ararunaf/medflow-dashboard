/**
 * InMemoryXSDRuntimeStore — store in-process (TISS-09).
 *
 * Implementação oficial do XSD Runtime Store.
 * Sem banco. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS. Sem operadoras.
 * Sem carregar arquivos. Sem parser. Sem schemas oficiais.
 */
import type { CanonicalXSDStatistics } from "../ports/canonical";
import type { StoredCanonicalXSDRuntimeResult, XSDRuntimeStore } from "./xsd-runtime-store";

export const IN_MEMORY_XSD_RUNTIME_STORE_ID = "in-memory-xsd-runtime";

export type InMemoryXSDRuntimeStoreOptions = {
  results?: readonly StoredCanonicalXSDRuntimeResult[];
};

/**
 * Store de resultados XSD Runtime canônicos in-memory — exclusivo do Adapter (TISS-09).
 */
export class InMemoryXSDRuntimeStore implements XSDRuntimeStore {
  readonly storeId = IN_MEMORY_XSD_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredCanonicalXSDRuntimeResult>();

  constructor(options: InMemoryXSDRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
  }

  getResult(resultId: string): StoredCanonicalXSDRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalXSDRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCanonicalXSDRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalXSDStatistics {
    const all = this.listResults();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let prepared = 0;
    for (const result of all) {
      if (result.status === "completed" || result.status === "prepared") completed += 1;
      if (result.status === "prepared") prepared += 1;
      if (result.status === "failed") failed += 1;
      if (result.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-xsd-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      preparedResults: prepared,
      officialXsdLoadedCount: 0,
      realXsdLoadedCount: 0,
      realValidationAvailableCount: 0,
      officialNamespacesLoadedCount: 0,
      officialSchemasLoadedCount: 0,
      schemaParsingEnabledCount: 0,
      schemaValidationEnabledCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XSD Runtime store ready (${this.resultCount()} results).`,
    };
  }
}
